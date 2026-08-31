export default function Bar({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-44 shrink-0 truncate text-sm text-ink">{label}</div>
      <div className="h-2.5 flex-1 bg-line/40">
        <div className="h-full bg-ink" style={{ width: `${width}%` }} />
      </div>
      <div className="w-20 shrink-0 text-right font-mono text-xs text-muted">{sub ?? value}</div>
    </div>
  );
}
