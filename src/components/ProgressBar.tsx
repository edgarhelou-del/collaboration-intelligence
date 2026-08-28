export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-paper/50">
        <span>
          Pregunta {Math.min(current + 1, total)} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
