import Link from "next/link";

// Per-section switch between the active view (everything except archived) and
// the archive (archived only). It preserves the section's other query params
// (filters) while flipping the `archived` flag, and always drops `id` so the
// detail selection resets when you change views.
export default function ArchiveToggle({
  basePath,
  params,
  archived,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  archived: boolean;
}) {
  const build = (withArchive: boolean) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (!value || key === "archived" || key === "id") continue;
      sp.set(key, value);
    }
    if (withArchive) sp.set("archived", "1");
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="inline-flex overflow-hidden rounded border border-line text-xs">
      <Link
        href={build(false)}
        aria-current={!archived}
        className={`px-3 py-1.5 font-medium transition ${
          !archived ? "bg-ink text-panel" : "text-muted hover:text-ink"
        }`}
      >
        Active
      </Link>
      <Link
        href={build(true)}
        aria-current={archived}
        className={`border-l border-line px-3 py-1.5 font-medium transition ${
          archived ? "bg-ink text-panel" : "text-muted hover:text-ink"
        }`}
      >
        Archived
      </Link>
    </div>
  );
}
