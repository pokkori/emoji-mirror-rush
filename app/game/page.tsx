"use client";
import dynamic from "next/dynamic";
const EmojiGame = dynamic(() => import("@/components/EmojiGame"), { ssr: false });
export default function GamePage() {
  return <EmojiGame />;
}
