export function titleCase(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((w) => (w === "ai" ? "AI" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\bAi\b/g, "AI")
    .replace(/^Human AI/, "Human-AI");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("es-ES", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function relativeDay(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return "Hoy";
  if (isYesterday) return "Ayer";
  return formatDate(date);
}

export function pct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n * 100)}%`;
}
