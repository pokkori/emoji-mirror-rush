"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const TOTAL_ROUNDS = 10;
const ROUND_DURATION = 3000;

interface EmojiChallenge {
  emoji: string;
  label: string;
  check: (b: Record<string, number>) => number;
}

const CHALLENGES: EmojiChallenge[] = [
  {
    emoji: "😄", label: "Smile",
    check: (b) => Math.min(1, ((b.mouthSmileLeft ?? 0) + (b.mouthSmileRight ?? 0)) / 0.6),
  },
  {
    emoji: "😲", label: "Surprise!",
    check: (b) => Math.min(1, ((b.jawOpen ?? 0) * 0.7 + (b.browInnerUp ?? 0) * 0.3) / 0.5),
  },
  {
    emoji: "😤", label: "Angry",
    check: (b) => Math.min(1, ((b.browDownLeft ?? 0) + (b.browDownRight ?? 0)) / 0.5),
  },
  {
    emoji: "😂", label: "LOL",
    check: (b) => Math.min(1, ((b.eyeSquintLeft ?? 0) + (b.eyeSquintRight ?? 0) + (b.mouthSmileLeft ?? 0)) / 0.9),
  },
];

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
    const rank = pct >= 80 ? "🏆 Expression Master!" : pct >= 60 ? "😄 Great Performer!" : pct >= 40 ? "🙂 Getting There!" : "😅 Keep Practicing!";
    const shareText = `😄 Emoji Mirror Rush!\nScore: ${totalScore}/${maxScore} (${pct}%)\n${rank}\nCan you beat me? 👇\n#EmojiMirrorRush`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    return (
      <div className="min-h-dvh flex items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #0d0d0d, #1a0a2e)" }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)" }}>
          <div className="text-5xl mb-2">🎭</div>
          <h2 className="text-2xl font-black mb-1" style={{ color: "#f59e0b" }}>Game Over!</h2>
          <div className="text-5xl font-black mb-1" style={{ color: "#7c3aed" }}>{totalScore}<span className="text-xl text-purple-400">/{maxScore}</span></div>
          <div className="text-lg font-bold mb-4 text-purple-300">{rank}</div>
          {totalScore > highScore && <div className="text-yellow-400 font-bold mb-3">🎉 New High Score!</div>}
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
              className="w-full py-3 rounded-xl font-black text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              Play Again 😄
            </button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "#1a1a1a", display: "flex" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share on X
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center"
      style={{ background: "linear-gradient(160deg, #0d0d0d, #1a0a2e)" }}>
      {phase === "playing" && (
        <div className="w-full max-w-lg flex items-center justify-between px-4 py-2"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="text-center">
            <div className="text-xs text-purple-400">Round</div>
            <div className="text-lg font-black text-white">{round + 1}/{TOTAL_ROUNDS}</div>
          </div>
          <div className="text-center">
            <div className="text-6xl leading-none">{challenge.emoji}</div>
            <div className="text-xs text-purple-300 font-bold">{challenge.label}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-purple-400">Time</div>
            <div className="text-2xl font-black" style={{ color: timeLeft <= 1 ? "#ef4444" : "#fff" }}>{timeLeft}s</div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-lg" style={{ aspectRatio: "4/3" }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted
          style={{ transform: "scaleX(-1)" }} />
        <canvas ref={canvasRef} width={640} height={480}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: phase === "playing" ? "block" : "none" }} />

        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}>
            {phase === "loading" && (
              <div className="text-center">
                <div className="text-5xl mb-3 animate-bounce">😄</div>
                <p className="text-purple-300 animate-pulse font-bold">Loading AI model...</p>
                <p className="text-purple-600 text-xs mt-1">First time may take 30 seconds</p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center px-4">
                <div className="text-6xl mb-3">🎭</div>
                <h1 className="text-2xl font-black mb-3" style={{ color: "#f59e0b" }}>Emoji Mirror Rush</h1>
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <button onClick={loadModel}
                  className="px-10 py-3 rounded-2xl font-black text-white text-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}>
                  Start Game 😄
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "playing" && (
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <div className="rounded-xl px-3 py-1 font-black text-xl"
              style={{ background: "rgba(0,0,0,0.6)", color: liveScore >= 70 ? "#22c55e" : liveScore >= 40 ? "#f59e0b" : "#ef4444" }}>
              {liveScore}%
            </div>
          </div>
        )}
      </div>

      {phase === "playing" && roundScoresRef.current.length > 0 && (
        <div className="w-full max-w-lg px-4 py-2 flex gap-1">
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