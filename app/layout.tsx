import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://emoji-face-battle.vercel.app"),
  title: "Emoji Mirror Rush | Express yourself!",
  description: "Match emoji expressions with your face! AI scores your expressions in real-time. How many can you match?",
  openGraph: {
    title: "Emoji Mirror Rush",
    description: "Match emoji expressions with your face! AI scores your expressions in real-time.",
    url: "https://emoji-mirror-rush.vercel.app",
    siteName: "Emoji Mirror Rush",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emoji Mirror Rush",
    description: "Match emoji expressions with your face! AI scores your expressions in real-time.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
