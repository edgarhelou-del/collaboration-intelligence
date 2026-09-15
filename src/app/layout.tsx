import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "KOLAB — Collaboration Intelligence Radar",
  description:
    "A radar of the state of human collaboration inside organizations: signals, patterns and insight, accumulated over time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto flex max-w-[1400px]">
          <Sidebar />
          <main className="min-w-0 flex-1 border-l border-line">{children}</main>
        </div>
      </body>
    </html>
  );
}
