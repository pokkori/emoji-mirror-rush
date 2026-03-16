import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "😄 Emoji Mirror Rush | Express yourself!",
  description: "Match emoji expressions with your face! AI scores your expressions in real-time. How many can you match?",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
