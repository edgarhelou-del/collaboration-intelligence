export function DimensionBar({ name, value }: { name: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-paper/80">{name}</span>
        <span className="font-medium text-paper">{Math.round(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gold" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
