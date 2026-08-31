import { notFound } from "next/navigation";
import { getSignalById } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import ScorePill from "@/components/ScorePill";
import SignalStatusControl from "@/components/SignalStatusControl";

export const dynamic = "force-dynamic";

export default async function SignalDetailPage({ params }: { params: { id: string } }) {
  const signal = await getSignalById(params.id);
  if (!signal) notFound();

  return (
    <div className="px-8 py-8 sm:px-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
        <article>
          <p className="kicker">{signal.company_}</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{signal.personName}</h1>
          <p className="text-sm text-muted">{signal.role}</p>

          <Section title={titleCase(signal.painCategory) + " Pain"}>
            <p className="text-[15px] leading-relaxed text-ink/90">{signal.painDescription}</p>
          </Section>

          <Section title="Evidence">
            <blockquote className="border-l-2 border-line pl-4 text-[15px] italic leading-relaxed text-ink/90">
              {signal.isParaphrase ? `Paraphrased: ${signal.evidence}` : `"${signal.evidence}"`}
            </blockquote>
          </Section>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Field label="Source">
              <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                {signal.sourceName || new URL(signal.sourceUrl).hostname}
              </a>
            </Field>
            <Field label="Date">{formatDate(signal.sourceDate ?? signal.discoveredAt)}</Field>
            <Field label="Evidence Type">{signal.evidenceType}</Field>
            <Field label="Score">
              <ScorePill score={signal.overallScore} />
            </Field>
          </div>

          {signal.whyItMatters && (
            <Section title="Why It Matters">
              <p className="text-[15px] leading-relaxed text-ink/90">{signal.whyItMatters}</p>
            </Section>
          )}

          {signal.underlyingIssue && (
            <Section title="Potential Underlying Issue">
              <p className="text-[15px] leading-relaxed text-ink/90">{signal.underlyingIssue}</p>
            </Section>
          )}

          {signal.commercialRelevanceNote && (
            <Section title="Commercial Relevance">
              <p className="text-[15px] leading-relaxed text-ink/90">{signal.commercialRelevanceNote}</p>
            </Section>
          )}

          <Section title="Score Breakdown">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
              <Breakdown label="Evidence" value={signal.confidenceScore} max={30} />
              <Breakdown label="Seniority" value={signal.seniorityScore} max={20} />
              <Breakdown label="Org Relevance" value={signal.organizationalRelevanceScore} max={20} />
              <Breakdown label="Recency" value={signal.recencyScore} max={15} />
              <Breakdown label="Commercial" value={signal.commercialRelevanceScore} max={15} />
            </div>
          </Section>
        </article>

        <aside>
          <p className="label mb-3">Curation</p>
          <SignalStatusControl id={signal.id} status={signal.status} />

          <div className="mt-8 space-y-2 text-xs text-muted">
            <p className="label">Details</p>
            <p>Industry: {signal.industry ?? "—"}</p>
            <p>Country: {signal.country ?? "—"}</p>
            <p>Company size: {signal.companySize ?? "—"}</p>
            <p>Pattern: {signal.patternLabel}</p>
            <p>Discovered: {formatDate(signal.discoveredAt)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="label mb-2">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function Breakdown({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="font-mono text-ink">
        {value}/{max}
      </p>
    </div>
  );
}
