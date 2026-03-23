import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Emoji Mirror Rush";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0d0d0d 0%, #1a0a2e 50%, #0d0d0d 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "#7c3aed" }} />

        {/* SVG Face */}
        <svg viewBox="0 0 100 100" width={160} height={160} style={{ marginBottom: 24 }}>
          <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#333" strokeWidth="2"/>
          <circle cx="35" cy="40" r="6" fill="#333"/>
          <circle cx="65" cy="40" r="6" fill="#333"/>
          <path d="M 30 62 Q 50 80 70 62" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>

        <div style={{ fontSize: 72, fontWeight: 900, color: "#f59e0b", marginBottom: 16, textAlign: "center" }}>
          Emoji Mirror Rush
        </div>
        <div style={{ fontSize: 32, color: "#c4b5fd", marginBottom: 32, textAlign: "center" }}>
          Match expressions with your face · AI scoring
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>
          emoji-mirror-rush.vercel.app
        </div>

        {/* Bottom bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: "#7c3aed" }} />
      </div>
    ),
    { ...size }
  );
}
