import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "KOLAB — Radar de Inteligencia de Colaboración",
  description:
    "Un radar del estado de la colaboración humana dentro de las organizaciones: señales, patrones e insights, acumulados a lo largo del tiempo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto flex max-w-[1400px]">
          <Sidebar />
          <main className="min-w-0 flex-1 border-l border-line">{children}</main>
        </div>
      </body>
    </html>
  );
}
