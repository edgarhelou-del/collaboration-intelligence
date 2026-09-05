import Link from "next/link";
import { getBioPatterns } from "@/lib/data";
import { pct, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BioPatternsPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = searchParams.sort === "growing" ? "growing" : "frequent";
  const patterns = await getBioPatterns(sort);

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">Radar</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Adaptability Patterns</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Recurring themes in how people, teams and organizations adapt to change — accumulated across
          runs from both attributed accounts and research.
        </p>
      </header>

      <div className="mt-6 flex gap-2 text-xs">
        <Link href="/adaptability/patterns?sort=frequent" className={`btn-secondary ${sort === "frequent" ? "border-ink" : ""}`}>
          Most Frequent
        </Link>
        <Link href="/adaptability/patterns?sort=growing" className={`btn-secondary ${sort === "growing" ? "border-ink" : ""}`}>
          Fastest Growing
        </Link>
      </div>

      {patterns.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No adaptation patterns detected yet — run the Bioadaptability Researcher to begin building the radar.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {patterns.map((p) => (
            <div key={p.id} className="panel p-6">
              <div className="flex items-center gap-2">
                <p className="kicker">{titleCase(p.category)}</p>
                <span className="text-muted">·</span>
                <p className="kicker">{titleCase(p.level)}</p>
              </div>
              <h2 className="mt-1 font-serif text-xl font-semibold text-ink">{p.label}</h2>
              <p className="mt-2 text-sm text-muted">
                {p.findingCount} finding{p.findingCount === 1 ? "" : "s"} ·{" "}
                <span className={p.growthRate >= 0 ? "text-signal-interesting" : "text-muted"}>
                  {pct(p.growthRate)} vs previous 30 days
                </span>
              </p>

              <div className="mt-4 flex gap-4 text-xs text-muted">
                <span>
                  <span className="font-mono text-signal-strong">{p.attributedCount}</span> attributed
                </span>
                <span>
                  <span className="font-mono text-signal-interesting">{p.researchCount}</span> research
                </span>
                <span>
                  avg score <span className="font-mono text-ink">{p.averageScore.toFixed(0)}</span>
                </span>
              </div>

              <Link href={`/adaptability/patterns/${p.key}`} className="btn-secondary mt-5 inline-flex">
                View Pattern
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
