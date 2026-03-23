"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const TOTAL_ROUNDS = 10;
const ROUND_DURATION = 3000;

interface EmojiChallenge {
  label: string;
  shortLabel: string;
  check: (b: Record<string, number>) => number;
}

// SVG face components
const SmileFace = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" aria-label="笑顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
    <circle cx="35" cy="40" r="6" fill="#333"/>
    <circle cx="65" cy="40" r="6" fill="#333"/>
    <path d="M 30 62 Q 50 80 70 62" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const SurpriseFace = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" aria-label="驚き顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
    <ellipse cx="35" cy="38" rx="7" ry="9" fill="#333"/>
    <ellipse cx="65" cy="38" rx="7" ry="9" fill="#333"/>
    <path d="M 35 70 Q 50 82 65 70" stroke="#333" strokeWidth="2" fill="none"/>
    <ellipse cx="50" cy="72" rx="10" ry="12" fill="#333"/>
  </svg>
);

const AngryFace = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" aria-label="怒り顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FF6B6B" stroke="#333" strokeWidth="2"/>
    <line x1="25" y1="32" x2="45" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
    <line x1="75" y1="32" x2="55" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
    <ellipse cx="35" cy="46" rx="7" ry="6" fill="#333"/>
    <ellipse cx="65" cy="46" rx="7" ry="6" fill="#333"/>
    <path d="M 35 70 Q 50 60 65 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const LolFace = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" aria-label="爆笑顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
    <path d="M 28 36 Q 35 44 42 36" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M 58 36 Q 65 44 72 36" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M 25 62 Q 50 86 75 62" stroke="#333" strokeWidth="3" fill="#333" strokeLinecap="round"/>
    <ellipse cx="50" cy="72" rx="18" ry="10" fill="#CC4444"/>
    <line x1="35" y1="72" x2="65" y2="72" stroke="#FFB6B6" strokeWidth="2"/>
  </svg>
);

const LoadingFace = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 animate-bounce" aria-label="読み込み中" role="img">
    <circle cx="50" cy="50" r="45" fill="#7c3aed" stroke="#4f46e5" strokeWidth="2"/>
    <circle cx="35" cy="44" r="5" fill="#fff"/>
    <circle cx="65" cy="44" r="5" fill="#fff"/>
    <path d="M 35 65 Q 50 74 65 65" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </svg>
);

const IdleFace = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24" aria-label="ゲーム待機中" role="img">
    <circle cx="50" cy="50" r="45" fill="#7c3aed" stroke="#4f46e5" strokeWidth="2"/>
    <circle cx="35" cy="42" r="7" fill="#fff"/>
    <circle cx="65" cy="42" r="7" fill="#fff"/>
    <circle cx="37" cy="42" r="3" fill="#4f46e5"/>
    <circle cx="67" cy="42" r="3" fill="#4f46e5"/>
    <path d="M 32 63 Q 50 76 68 63" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const CHALLENGES: EmojiChallenge[] = [
  {
    label: "Smile",
    shortLabel: "SMILE",
    check: (b) => Math.min(1, ((b.mouthSmileLeft ?? 0) + (b.mouthSmileRight ?? 0)) / 0.6),
  },
  {
    label: "Surprise!",
    shortLabel: "WOW",
    check: (b) => Math.min(1, ((b.jawOpen ?? 0) * 0.7 + (b.browInnerUp ?? 0) * 0.3) / 0.5),
  },
  {
    label: "Angry",
    shortLabel: "ANGRY",
    check: (b) => Math.min(1, ((b.browDownLeft ?? 0) + (b.browDownRight ?? 0)) / 0.5),
  },
  {
    label: "LOL",
    shortLabel: "LOL",
    check: (b) => Math.min(1, ((b.eyeSquintLeft ?? 0) + (b.eyeSquintRight ?? 0) + (b.mouthSmileLeft ?? 0)) / 0.9),
  },
];

const CHALLENGE_ICONS: Record<string, React.ReactNode> = {
  Smile: <SmileFace />,
  "Surprise!": <SurpriseFace />,
  Angry: <AngryFace />,
  LOL: <LolFace />,
};

function getRandomChallenge(): EmojiChallenge {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}

export default function EmojiGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "result">("idle");
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [challenge, setChallenge] = useState<EmojiChallenge>(CHALLENGES[0]);
  const [timeLeft, setTimeLeft] = useState(3);
  const [liveScore, setLiveScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [highScore, setHighScore] = useState(0);
  const roundScoresRef = useRef<number[]>([]);
  const currentChallengeRef = useRef<EmojiChallenge>(CHALLENGES[0]);
  const roundBestScoreRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const hs = localStorage.getItem("emoji_rush_hs");
    if (hs) setHighScore(parseInt(hs, 10));
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  const startRound = useCallback((roundIndex: number) => {
    if (roundIndex >= TOTAL_ROUNDS) {
      isPlayingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      const total = roundScoresRef.current.reduce((a, b) => a + b, 0);
      const prevHs = parseInt(localStorage.getItem("emoji_rush_hs") ?? "0", 10);
      const newHs = Math.max(total, prevHs);
      localStorage.setItem("emoji_rush_hs", String(newHs));
      setHighScore(newHs);
      setRoundScores([...roundScoresRef.current]);
      setPhase("result");
      return;
    }
    const ch = getRandomChallenge();
    currentChallengeRef.current = ch;
    roundBestScoreRef.current = 0;
    isPlayingRef.current = true;
    setRound(roundIndex);
    setChallenge(ch);
    setTimeLeft(3);
    setPhase("playing");

    let t = 3;
    const iv = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) clearInterval(iv);
    }, 1000);

    roundTimerRef.current = setTimeout(() => {
      clearInterval(iv);
      const score = Math.round(roundBestScoreRef.current * 100);
      roundScoresRef.current = [...roundScoresRef.current, score];
      startRound(roundIndex + 1);
    }, ROUND_DURATION);
  }, []);

  const loadModel = useCallback(async () => {
    setPhase("loading");
    try {
      await startCamera();
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;
      const fs = await FilesetResolver.forVisionTasks(WASM_URL);
      const fl = await FaceLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
      landmarkerRef.current = fl;
      startRound(0);
    } catch (e) {
      console.error(e);
      setError("Camera or model failed to load. Please allow camera access and try again.");
      setPhase("idle");
    }
  }, [startRound]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function loop(now: number) {
      if (!isPlayingRef.current) return;
      const lm = landmarkerRef.current;
      if (lm && video!.readyState >= 2) {
        try {
          const result = lm.detectForVideo(video!, now);
          if (result.faceBlendshapes?.[0]) {
            const bs: Record<string, number> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.faceBlendshapes[0].categories.forEach((c: any) => { bs[c.categoryName] = c.score; });
            const matchScore = currentChallengeRef.current.check(bs);
            roundBestScoreRef.current = Math.max(roundBestScoreRef.current, matchScore);
            setLiveScore(Math.round(matchScore * 100));

            ctx!.save();
            ctx!.scale(-1, 1);
            ctx!.drawImage(video!, -canvas!.width, 0, canvas!.width, canvas!.height);
            ctx!.restore();

            const barW = canvas!.width * matchScore;
            ctx!.fillStyle = matchScore > 0.7 ? "#22c55e" : matchScore > 0.4 ? "#f59e0b" : "#ef4444";
            ctx!.fillRect(0, canvas!.height - 8, barW, 8);
            ctx!.fillStyle = "rgba(255,255,255,0.2)";
            ctx!.fillRect(barW, canvas!.height - 8, canvas!.width - barW, 8);
          }
        } catch {
          // non-fatal
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }, []);

  const totalScore = roundScoresRef.current.reduce((a, b) => a + b, 0);

  if (phase === "result") {
    const maxScore = TOTAL_ROUNDS * 100;
    const pct = Math.round((totalScore / maxScore) * 100);
    const rankLabel = pct >= 80 ? "Expression Master!" : pct >= 60 ? "Great Performer!" : pct >= 40 ? "Getting There!" : "Keep Practicing!";
    const rankIcon = pct >= 80 ? "MASTER" : pct >= 60 ? "GREAT" : pct >= 40 ? "GOOD" : "TRY";
    const shareText = `Emoji Mirror Rush!\nScore: ${totalScore}/${maxScore} (${pct}%)\n${rankLabel}\nCan you beat me?\n#EmojiMirrorRush`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    return (
      <div className="min-h-dvh flex items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #0d0d0d, #1a0a2e)" }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)" }}
          role="region" aria-label="ゲーム結果">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
            style={{ background: "rgba(124,58,237,0.3)", border: "2px solid #7c3aed" }}>
            <span className="text-xl font-black text-purple-300">{rankIcon}</span>
          </div>
          <h2 className="text-2xl font-black mb-1" style={{ color: "#f59e0b" }}>Game Over!</h2>
          <div className="text-5xl font-black mb-1" style={{ color: "#7c3aed" }}>{totalScore}<span className="text-xl text-purple-400">/{maxScore}</span></div>
          <div className="text-lg font-bold mb-4 text-purple-300">{rankLabel}</div>
          {totalScore > highScore && (
            <div className="text-yellow-400 font-bold mb-3 px-3 py-1 rounded-lg"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)" }}
              role="status" aria-live="polite">
              NEW HIGH SCORE!
            </div>
          )}
          <div className="rounded-xl p-3 mb-4 space-y-1" style={{ background: "rgba(0,0,0,0.3)" }}>
            {roundScores.map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-purple-400">Round {i + 1}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full rounded-full" style={{ width: `${s}%`, background: s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span className="font-bold text-white w-8 text-right">{s}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <button onClick={() => { roundScoresRef.current = []; setPhase("idle"); loadModel(); }}
              className="w-full py-3 rounded-xl font-black text-white min-h-[44px]"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              aria-label="もう一度プレイする">
              Play Again
            </button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 min-h-[44px]"
              style={{ background: "#1a1a1a", display: "flex" }}
              aria-label="Xでスコアをシェアする">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share on X
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center"
      style={{ background: "linear-gradient(160deg, #0d0d0d, #1a0a2e)" }}
      role="application" aria-label="Emoji Mirror Rush ゲーム">
      {phase === "playing" && (
        <div className="w-full max-w-lg flex items-center justify-between px-4 py-2"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="text-center">
            <div className="text-xs text-purple-400">Round</div>
            <div className="text-lg font-black text-white">{round + 1}/{TOTAL_ROUNDS}</div>
          </div>
          <div className="text-center flex flex-col items-center" aria-label={`お題: ${challenge.label}`}>
            {CHALLENGE_ICONS[challenge.label]}
            <div className="text-xs text-purple-300 font-bold mt-1">{challenge.label}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-purple-400">Time</div>
            <div className="text-2xl font-black" style={{ color: timeLeft <= 1 ? "#ef4444" : "#fff" }}
              aria-label={`残り${timeLeft}秒`}>{timeLeft}s</div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-lg" style={{ aspectRatio: "4/3" }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted
          style={{ transform: "scaleX(-1)" }} aria-label="カメラ映像" />
        <canvas ref={canvasRef} width={640} height={480}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: phase === "playing" ? "block" : "none" }}
          aria-hidden="true" />

        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}>
            {phase === "loading" && (
              <div className="text-center">
                <LoadingFace />
                <p className="text-purple-300 animate-pulse font-bold mt-3">Loading AI model...</p>
                <p className="text-purple-600 text-xs mt-1">First time may take 30 seconds</p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center px-4">
                <IdleFace />
                <h1 className="text-2xl font-black mb-3 mt-2" style={{ color: "#f59e0b" }}>Emoji Mirror Rush</h1>
                {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}
                <button onClick={loadModel}
                  className="px-10 py-3 rounded-2xl font-black text-white text-lg min-h-[44px]"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}
                  aria-label="ゲームを開始する">
                  Start Game
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "playing" && (
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <div className="rounded-xl px-3 py-1 font-black text-xl"
              style={{ background: "rgba(0,0,0,0.6)", color: liveScore >= 70 ? "#22c55e" : liveScore >= 40 ? "#f59e0b" : "#ef4444" }}
              aria-label={`現在のスコア: ${liveScore}パーセント`} role="status" aria-live="polite">
              {liveScore}%
            </div>
          </div>
        )}
      </div>

      {phase === "playing" && roundScoresRef.current.length > 0 && (
        <div className="w-full max-w-lg px-4 py-2 flex gap-1" aria-label="ラウンドスコア履歴">
          {roundScoresRef.current.map((s, i) => (
            <div key={i} className="flex-1 h-2 rounded-full"
              style={{ background: s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444" }} />
          ))}
          {Array.from({ length: TOTAL_ROUNDS - roundScoresRef.current.length }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
      )}
    </div>
  );
}
