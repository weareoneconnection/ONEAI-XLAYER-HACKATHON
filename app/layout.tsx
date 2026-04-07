import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneAI × OneClaw × WAOC — XLayer Hackathon Demo",
  description:
    "Turn natural language intent into strategy, execution, and on-chain proof on XLayer."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
