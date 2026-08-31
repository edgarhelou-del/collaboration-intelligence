import { notFound } from "next/navigation";
import { getSignalById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { painCategoryLabel, evidenceTypeLabel } from "@/lib/labels";
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

          <Section title={`Dolor: ${painCategoryLabel(signal.painCategory)}`}>
            <p className="text-[15px] leading-relaxed text-ink/90">{signal.painDescription}</p>
          </Section>

          <Section title="Evidencia">
            <blockquote className="border-l-2 border-line pl-4 text-[15px] italic leading-relaxed text-ink/90">
              {signal.isParaphrase ? `Parafraseado: ${signal.evidence}` : `"${signal.evidence}"`}
            </blockquote>
          </Section>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Field label="Fuente">
              <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                {signal.sourceName || new URL(signal.sourceUrl).hostname}
              </a>
            </Field>
            <Field label="Fecha">{formatDate(signal.sourceDate ?? signal.discoveredAt)}</Field>
            <Field label="Tipo de Evidencia">{evidenceTypeLabel(signal.evidenceType)}</Field>
            <Field label="Puntuación">
              <ScorePill score={signal.overallScore} />
            </Field>
          </div>

          {signal.whyItMatters && (
            <Section title="Por Qué Importa">
              <p className="text-[15px] leading-relaxed text-ink/90">{signal.whyItMatters}</p>
            </Section>
          )}

          {signal.underlyingIssue && (
            <Section title="Posible Problema Subyacente">
              <p className="text-[15px] leading-relaxed text-ink/90">{signal.underlyingIssue}</p>
            </Section>
          )}

          {signal.commercialRelevanceNote && (
            <Section title="Relevancia Comercial">
              <p className="text-[15px] leading-relaxed text-ink/90">{signal.commercialRelevanceNote}</p>
            </Section>
          )}

          <Section title="Desglose de Puntuación">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
              <Breakdown label="Evidencia" value={signal.confidenceScore} max={30} />
              <Breakdown label="Nivel jerárquico" value={signal.seniorityScore} max={20} />
              <Breakdown label="Relevancia org." value={signal.organizationalRelevanceScore} max={20} />
              <Breakdown label="Actualidad" value={signal.recencyScore} max={15} />
              <Breakdown label="Comercial" value={signal.commercialRelevanceScore} max={15} />
            </div>
          </Section>
        </article>

        <aside>
          <p className="label mb-3">Curaduría</p>
          <SignalStatusControl id={signal.id} status={signal.status} />

          <div className="mt-8 space-y-2 text-xs text-muted">
            <p className="label">Detalles</p>
            <p>Industria: {signal.industry ?? "—"}</p>
            <p>País: {signal.country ?? "—"}</p>
            <p>Tamaño de empresa: {signal.companySize ?? "—"}</p>
            <p>Patrón: {signal.patternLabel}</p>
            <p>Descubierto: {formatDate(signal.discoveredAt)}</p>
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
