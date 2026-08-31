"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/content", label: "Content" },
  { href: "/signals", label: "Pain Radar" },
  { href: "/patterns", label: "Emerging Patterns" },
  { href: "/history", label: "History" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col justify-between px-6 py-8 sm:flex">
      <div>
        <Link href="/">
          <Logo />
        </Link>
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-sm transition ${
                  active ? "bg-ink text-paper" : "text-ink/70 hover:bg-line/40 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Link
        href="/settings"
        className={`rounded px-3 py-2 text-sm transition ${
          pathname.startsWith("/settings") ? "bg-ink text-paper" : "text-ink/70 hover:bg-line/40 hover:text-ink"
        }`}
      >
        Settings
      </Link>
    </aside>
  );
}
