import Link from "next/link";

const SmileSVG = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto" aria-label="笑顔アイコン" role="img">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
    <circle cx="35" cy="40" r="6" fill="#333"/>
    <circle cx="65" cy="40" r="6" fill="#333"/>
    <path d="M 30 62 Q 50 80 70 62" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const SurpriseSVG = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8" aria-label="驚き顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
    <ellipse cx="35" cy="38" rx="7" ry="9" fill="#333"/>
    <ellipse cx="65" cy="38" rx="7" ry="9" fill="#333"/>
    <ellipse cx="50" cy="72" rx="10" ry="12" fill="#333"/>
  </svg>
);

const AngrySVG = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8" aria-label="怒り顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FF6B6B" stroke="#333" strokeWidth="2"/>
    <line x1="25" y1="32" x2="45" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
    <line x1="75" y1="32" x2="55" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
    <ellipse cx="35" cy="46" rx="7" ry="6" fill="#333"/>
    <ellipse cx="65" cy="46" rx="7" ry="6" fill="#333"/>
    <path d="M 35 70 Q 50 60 65 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const LolSVG = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8" aria-label="爆笑顔" role="img">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
    <path d="M 28 36 Q 35 44 42 36" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M 58 36 Q 65 44 72 36" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M 25 62 Q 50 86 75 62" stroke="#333" strokeWidth="3" fill="#333" strokeLinecap="round"/>
    <ellipse cx="50" cy="72" rx="18" ry="10" fill="#CC4444"/>
  </svg>
);

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(160deg, #0d0d0d, #1a0a2e, #0d0d0d)" }}>
      <div className="text-center mb-8">
        <div className="mb-4">
          <SmileSVG />
        </div>
        <h1 className="text-4xl font-black mb-2" style={{ color: "#f59e0b", textShadow: "0 0 20px rgba(245,158,11,0.5)" }}>
          Emoji Mirror Rush
        </h1>
        <p className="text-lg text-purple-300 mb-1 font-bold">Match the emoji with your face!</p>
        <p className="text-sm text-purple-500">10 rounds · 3 seconds each · AI scoring</p>
      </div>
      <Link href="/game"
        className="inline-block px-14 py-4 rounded-2xl text-xl font-black mb-10 transition-all active:scale-95 min-h-[56px]"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 30px rgba(124,58,237,0.5)", color: "#fff" }}
        aria-label="ゲームをプレイする">
        Play Now
      </Link>
      <div className="w-full max-w-sm space-y-3" role="list" aria-label="表情チャレンジ一覧">
        {[
          { icon: <SmileSVG />, label: "Smile", desc: "Show your biggest smile!" },
          { icon: <SurpriseSVG />, label: "Surprise", desc: "Open your mouth wide, raise eyebrows" },
          { icon: <AngrySVG />, label: "Angry", desc: "Furrow your brows, look fierce" },
          { icon: <LolSVG />, label: "Laughing", desc: "Squint eyes + big smile" },
        ].map((item) => (
          <div key={item.label} className="flex gap-4 items-center p-3 rounded-xl"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}
            role="listitem">
            <div className="flex-shrink-0">{item.icon}</div>
            <div>
              <div className="font-bold text-purple-200 text-sm">{item.label}</div>
              <div className="text-xs text-purple-400">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
