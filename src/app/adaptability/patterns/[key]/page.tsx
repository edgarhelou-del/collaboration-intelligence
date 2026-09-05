import Link from "next/link";
import { notFound } from "next/navigation";
import { getBioPatternByKey, getRepresentativeBioFindings } from "@/lib/data";
import { formatDate, pct, titleCase } from "@/lib/format";
import ScorePill from "@/components/ScorePill";

export const dynamic = "force-dynamic";

export default async function BioPatternDetailPage({ params }: { params: { key: string } }) {
  const pattern = await getBioPatternByKey(params.key);
  if (!pattern) notFound();

  const representative = await getRepresentativeBioFindings(pattern);
  const sourceUrls = [...new Set(representative.map((f) => f.sourceUrl))];

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <div className="flex items-center gap-2">
          <p className="kicker">{titleCase(pattern.category)}</p>
          <span className="text-muted">·</span>
          <p className="kicker">{titleCase(pattern.level)}</p>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">{pattern.label}</h1>
        <p className="mt-2 text-sm text-muted">
          {pattern.findingCount} findings · {pct(pattern.growthRate)} vs previous 30 days · first seen{" "}
          {formatDate(pattern.firstAppearance)}, latest {formatDate(pattern.latestAppearance)}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Findings" value={String(pattern.findingCount)} />
        <Stat label="Attributed" value={String(pattern.attributedCount)} />
        <Stat label="Research" value={String(pattern.researchCount)} />
        <Stat label="Average Score" value={pattern.averageScore.toFixed(0)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <TagList title="Industries" items={pattern.topIndustries as { name: string; count: number }[]} />
        <TagList title="Countries" items={pattern.topCountries as { name: string; count: number }[]} />
        <TagList title="Levels" items={(pattern.topLevels as { name: string; count: number }[]).map((l) => ({ ...l, name: titleCase(l.name) }))} />
      </div>

      <section className="mt-10 panel p-6">
        <p className="label mb-2">What Are We Learning?</p>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-accent">AI-Generated Interpretation</p>
        {pattern.aiSynthesis ? (
          <p className="text-[15px] leading-relaxed text-ink/90">{pattern.aiSynthesis}</p>
        ) : (
          <p className="text-sm text-muted">
            Synthesis not yet available for this pattern (requires the AI Gateway to be configured, and refreshes on the next run).
          </p>
        )}
      </section>

      <section className="mt-10">
        <p className="label mb-3">Representative Findings</p>
        <ul className="space-y-3">
          {representative.map((f) => (
            <li key={f.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/adaptability/${f.id}`} className="font-medium text-ink hover:underline">
                  {f.title}
                </Link>
                <ScorePill score={f.overallScore} />
              </div>
              <p className="mt-2 text-sm text-ink/80">{f.summary}</p>
              <p className="mt-1 text-xs text-muted">
                {titleCase(f.findingType)}
                {f.company ? ` · ${f.personName ? `${f.personName}, ` : ""}${f.company}` : ""}
              </p>
            </li>
          ))}
          {representative.length === 0 && <p className="text-sm text-muted">No findings recorded.</p>}
        </ul>
      </section>

      <section className="mt-10 pb-16">
        <p className="label mb-3">Supporting Sources</p>
        <ul className="space-y-1.5 text-sm">
          {sourceUrls.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer" className="text-accent underline">
                {url}
              </a>
            </li>
          ))}
          {sourceUrls.length === 0 && <p className="text-sm text-muted">No sources recorded.</p>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className="font-mono text-2xl text-ink">{value}</p>
    </div>
  );
}

function TagList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  return (
    <div>
      <p className="label mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">—</p>
      ) : (
        <ul className="space-y-1 text-sm text-ink/90">
          {items.map((i) => (
            <li key={i.name} className="flex justify-between">
              <span>{i.name}</span>
              <span className="font-mono text-muted">{i.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
