import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Inteligencia Natural — Collaboration Intelligence Radar",
  description:
    "A radar of the state of human collaboration inside organizations: signals, patterns and insight, accumulated over time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto flex max-w-[1400px]">
          <Sidebar />
          <main className="min-w-0 flex-1 border-l border-line">{children}</main>
        </div>
      </body>
    </html>
  );
}
