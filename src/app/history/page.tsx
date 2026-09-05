import Link from "next/link";
import { getAgentRunsSince, getContentSince, getSignalsSince, getBioFindingsSince } from "@/lib/data";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import ScorePill from "@/components/ScorePill";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: { since?: string } }) {
  const since = searchParams.since ? new Date(searchParams.since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [runs, content, signals, bioFindings] = await Promise.all([
    getAgentRunsSince(since),
    getContentSince(since),
    getSignalsSince(since),
    getBioFindingsSince(since),
  ]);

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">Archive</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">History</h1>
      </header>

      <form method="get" className="mt-6 flex items-end gap-3">
        <label className="block">
          <span className="label mb-1 block">Since</span>
          <input
            type="date"
            name="since"
            defaultValue={searchParams.since ?? since.toISOString().slice(0, 10)}
            className="h-[38px] rounded border border-line bg-panel px-2 text-sm text-ink"
          />
        </label>
        <button className="btn-secondary h-[38px]" type="submit">
          Apply
        </button>
      </form>

      <section className="mt-8">
        <p className="label mb-3">Agent Runs ({runs.length})</p>
        <ul className="panel divide-y divide-line">
          {runs.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span className="font-medium text-ink">
                {r.agent === "CONTENT"
                  ? "Content Agent"
                  : r.agent === "BIO_ADAPTABILITY"
                    ? "Bioadaptability Researcher"
                    : "Pain Researcher"}
              </span>
              <span className="text-muted">{r.summary ?? r.error ?? "—"}</span>
              <span className="text-xs uppercase tracking-wide text-muted">{r.status}</span>
              <span className="font-mono text-xs text-muted">{formatDateTime(r.startedAt)}</span>
            </li>
          ))}
          {runs.length === 0 && <li className="p-4 text-sm text-muted">No agent runs in this period.</li>}
        </ul>
      </section>

      <section className="mt-8">
        <p className="label mb-3">Content ({content.length})</p>
        <ul className="panel divide-y divide-line">
          {content.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <Link href={`/content?id=${c.id}`} className="text-ink hover:underline">
                {c.mainIdea}
              </Link>
              <span className="whitespace-nowrap text-xs text-muted">
                {c.status} · {formatDate(c.createdAt)}
              </span>
            </li>
          ))}
          {content.length === 0 && <li className="p-4 text-sm text-muted">No content in this period.</li>}
        </ul>
      </section>

      <section className="mt-8">
        <p className="label mb-3">Signals ({signals.length})</p>
        <ul className="panel divide-y divide-line">
          {signals.slice(0, 100).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <Link href={`/signals/${s.id}`} className="text-ink hover:underline">
                {s.personName} — {s.company_}
              </Link>
              <span className="text-xs text-muted">{titleCase(s.painCategory)}</span>
              <ScorePill score={s.overallScore} />
              <span className="whitespace-nowrap text-xs text-muted">{formatDate(s.discoveredAt)}</span>
            </li>
          ))}
          {signals.length === 0 && <li className="p-4 text-sm text-muted">No signals in this period.</li>}
        </ul>
      </section>

      <section className="mt-8 pb-16">
        <p className="label mb-3">Adaptation Findings ({bioFindings.length})</p>
        <ul className="panel divide-y divide-line">
          {bioFindings.slice(0, 100).map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <Link href={`/adaptability/${f.id}`} className="text-ink hover:underline">
                {f.title}
              </Link>
              <span className="text-xs text-muted">{titleCase(f.category)}</span>
              <ScorePill score={f.overallScore} />
              <span className="whitespace-nowrap text-xs text-muted">{formatDate(f.discoveredAt)}</span>
            </li>
          ))}
          {bioFindings.length === 0 && <li className="p-4 text-sm text-muted">No adaptation findings in this period.</li>}
        </ul>
      </section>
    </div>
  );
}
