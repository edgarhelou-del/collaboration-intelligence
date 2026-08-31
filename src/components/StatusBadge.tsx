export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded border border-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {status.replaceAll("_", " ")}
    </span>
  );
}
