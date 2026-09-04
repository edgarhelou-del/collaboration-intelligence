export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="font-serif text-base font-semibold leading-tight tracking-tight text-ink">
        KOLAB
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Collaboration Radar
      </div>
    </div>
  );
}
