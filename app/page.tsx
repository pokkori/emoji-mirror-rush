import Link from "next/link";
export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(160deg, #0d0d0d, #1a0a2e, #0d0d0d)" }}>
      <div className="text-center mb-8">
        <div className="text-8xl mb-4">😄</div>
        <h1 className="text-4xl font-black mb-2" style={{ color: "#f59e0b", textShadow: "0 0 20px rgba(245,158,11,0.5)" }}>
          Emoji Mirror Rush
        </h1>
        <p className="text-lg text-purple-300 mb-1 font-bold">Match the emoji with your face!</p>
        <p className="text-sm text-purple-500">10 rounds · 3 seconds each · AI scoring</p>
      </div>
      <Link href="/game"
        className="inline-block px-14 py-4 rounded-2xl text-xl font-black mb-10 transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 30px rgba(124,58,237,0.5)", color: "#fff" }}>
        Play Now 😄
      </Link>
      <div className="w-full max-w-sm space-y-3">
        {[
          { e: "😄", label: "Smile", desc: "Show your biggest smile!" },
          { e: "😲", label: "Surprise", desc: "Open your mouth wide, raise eyebrows" },
          { e: "😤", label: "Angry", desc: "Furrow your brows, look fierce" },
          { e: "😂", label: "Laughing", desc: "Squint eyes + big smile" },
        ].map((item) => (
          <div key={item.e} className="flex gap-4 items-center p-3 rounded-xl"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <span className="text-3xl">{item.e}</span>
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
