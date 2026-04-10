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

const _faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "このゲームは無料で遊べますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、基本プレイは完全無料でお楽しみいただけます。ブラウザから即座にプレイ開始できます。"
      }
    },
    {
      "@type": "Question",
      "name": "スマートフォンでも遊べますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、スマートフォン・タブレット・PCすべてに対応しています。ブラウザからそのままプレイできます。"
      }
    },
    {
      "@type": "Question",
      "name": "アプリのダウンロードは必要ですか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ダウンロード不要です。ブラウザを開いてアクセスするだけですぐに遊べます。"
      }
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(_faqLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
