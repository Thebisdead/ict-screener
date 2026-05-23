import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICT Screener — Smart Money Concepts",
  description: "Real-time US stock screener using ICT / Smart Money Concepts: OB, FVG, MSB, LS, OTE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
