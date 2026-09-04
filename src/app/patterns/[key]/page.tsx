import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatternByKey, getRepresentativeSignals, getRelatedContent } from "@/lib/data";
import { formatDate, pct, titleCase } from "@/lib/format";
import ScorePill from "@/components/ScorePill";

export const dynamic = "force-dynamic";

export default async function PatternDetailPage({ params }: { params: { key: string } }) {
  const pattern = await getPatternByKey(params.key);
  if (!pattern) notFound();

  const [representative, relatedContent] = await Promise.all([
    getRepresentativeSignals(pattern),
    getRelatedContent(pattern.id),
  ]);

  const sourceUrls = [...new Set(representative.map((s) => s.sourceUrl))];

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">{titleCase(pattern.painCategory)}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">{pattern.label}</h1>
        <p className="mt-2 text-sm text-muted">
          {pattern.signalCount} signals · {pct(pattern.growthRate)} vs previous 30 days · first seen{" "}
          {formatDate(pattern.firstAppearance)}, latest {formatDate(pattern.latestAppearance)}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Signals" value={String(pattern.signalCount)} />
        <Stat label="Last 30 days" value={String(pattern.last30Count)} />
        <Stat label="Previous 30 days" value={String(pattern.previous30Count)} />
        <Stat label="Average Score" value={pattern.averageScore.toFixed(0)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <TagList title="Industries" items={pattern.topIndustries as { name: string; count: number }[]} />
        <TagList title="Countries" items={pattern.topCountries as { name: string; count: number }[]} />
        <TagList title="Leadership Roles" items={pattern.topRoles as { name: string; count: number }[]} />
      </div>

      <section className="mt-10 panel p-6">
        <p className="label mb-2">What Are We Learning?</p>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-accent">AI-Generated Interpretation</p>
        {pattern.aiSynthesis ? (
          <p className="text-[15px] leading-relaxed text-ink/90">{pattern.aiSynthesis}</p>
        ) : (
          <p className="text-sm text-muted">
            Synthesis not yet available for this pattern (requires the AI Gateway to be configured).
          </p>
        )}
      </section>

      <section className="mt-10">
        <p className="label mb-3">Representative Signals</p>
        <ul className="space-y-3">
          {representative.map((s) => (
            <li key={s.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link href={`/signals/${s.id}`} className="font-medium text-ink hover:underline">
                    {s.personName}
                  </Link>
                  <span className="text-sm text-muted"> — {s.role}, {s.company_}</span>
                </div>
                <ScorePill score={s.overallScore} />
              </div>
              <p className="mt-2 text-sm text-ink/80">{s.painDescription}</p>
            </li>
          ))}
          {representative.length === 0 && <p className="text-sm text-muted">No signals recorded.</p>}
        </ul>
      </section>

      <section className="mt-10">
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

      {relatedContent.length > 0 && (
        <section className="mt-10 pb-16">
          <p className="label mb-3">Related Content</p>
          <ul className="space-y-2">
            {relatedContent.map((c) => (
              <li key={c.id}>
                <Link href={`/content?id=${c.id}`} className="text-ink hover:underline">
                  {c.mainIdea}
                </Link>
                <span className="ml-2 text-xs text-muted">{formatDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
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
