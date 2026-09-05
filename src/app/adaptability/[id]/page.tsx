import Link from "next/link";
import { notFound } from "next/navigation";
import { getBioFindingById } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import ScorePill from "@/components/ScorePill";
import BioFindingStatusControl from "@/components/BioFindingStatusControl";

export const dynamic = "force-dynamic";

export default async function BioFindingDetailPage({ params }: { params: { id: string } }) {
  const finding = await getBioFindingById(params.id);
  if (!finding) notFound();

  const attribution = [finding.personName, finding.role, finding.company].filter(Boolean).join(", ");

  return (
    <div className="px-8 py-8 sm:px-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
        <article>
          <div className="flex items-center gap-2">
            <p className="kicker">{titleCase(finding.category)}</p>
            <span className="text-muted">·</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              {finding.findingType === "ATTRIBUTED" ? "Attributed" : "Research"}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{finding.title}</h1>
          {attribution && <p className="text-sm text-muted">{attribution}</p>}

          <Section title="What's Happening">
            <p className="text-[15px] leading-relaxed text-ink/90">{finding.summary}</p>
          </Section>

          <Section title="Evidence">
            <blockquote className="border-l-2 border-line pl-4 text-[15px] italic leading-relaxed text-ink/90">
              {finding.isParaphrase ? `Paraphrased: ${finding.evidence}` : `"${finding.evidence}"`}
            </blockquote>
          </Section>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Field label="Source">
              <a href={finding.sourceUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                {finding.sourceName || new URL(finding.sourceUrl).hostname}
              </a>
            </Field>
            <Field label="Date">{formatDate(finding.sourceDate ?? finding.discoveredAt)}</Field>
            <Field label="Level">{titleCase(finding.level)}</Field>
            <Field label="Score">
              <ScorePill score={finding.overallScore} />
            </Field>
          </div>

          {finding.whyItMatters && (
            <Section title="Why It Matters">
              <p className="text-[15px] leading-relaxed text-ink/90">{finding.whyItMatters}</p>
            </Section>
          )}

          {finding.implication && (
            <Section title="Implication for Leaders">
              <p className="text-[15px] leading-relaxed text-ink/90">{finding.implication}</p>
            </Section>
          )}

          <Section title="Score Breakdown">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Breakdown label="Evidence" value={finding.evidenceScore} max={35} />
              <Breakdown label="Relevance" value={finding.relevanceScore} max={30} />
              <Breakdown label="Actionability" value={finding.actionabilityScore} max={20} />
              <Breakdown label="Recency" value={finding.recencyScore} max={15} />
            </div>
          </Section>
        </article>

        <aside>
          <p className="label mb-3">Curation</p>
          <BioFindingStatusControl id={finding.id} status={finding.status} />

          <div className="mt-8 space-y-2 text-xs text-muted">
            <p className="label">Details</p>
            <p>Type: {titleCase(finding.findingType)}</p>
            <p>Level: {titleCase(finding.level)}</p>
            <p>Industry: {finding.industry ?? "—"}</p>
            <p>Country: {finding.country ?? "—"}</p>
            <p>
              Pattern:{" "}
              <Link href="/adaptability/patterns" className="text-accent underline">
                {finding.patternLabel}
              </Link>
            </p>
            <p>Discovered: {formatDate(finding.discoveredAt)}</p>
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
