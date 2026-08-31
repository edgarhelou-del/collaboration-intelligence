import Link from "next/link";
import { getFilterOptions, getSignals, type SignalFilters } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { painCategoryLabel, signalStatusLabel, evidenceTypeLabel } from "@/lib/labels";
import ScorePill from "@/components/ScorePill";
import RunAgentsButton from "@/components/RunAgentsButton";

export const dynamic = "force-dynamic";

const PAIN_CATEGORIES = [
  "COLLABORATION",
  "SILOS",
  "COMMUNICATION",
  "TRUST",
  "ALIGNMENT",
  "KNOWLEDGE_SHARING",
  "CULTURE",
  "LEADERSHIP",
  "PSYCHOLOGICAL_SAFETY",
  "COORDINATION",
  "HUMAN_AI_COLLABORATION",
  "OTHER",
];
const STATUSES = ["NEW", "INVESTIGATING", "RELEVANT", "CONTACTED", "ARCHIVED"];
const EVIDENCE_TYPES = ["DIRECT", "INDIRECT"];

export default async function SignalsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const filters: SignalFilters = {
    minScore: searchParams.minScore ? Number(searchParams.minScore) : undefined,
    industry: searchParams.industry || undefined,
    country: searchParams.country || undefined,
    role: searchParams.role || undefined,
    painCategory: searchParams.painCategory || undefined,
    evidenceType: searchParams.evidenceType || undefined,
    status: searchParams.status || undefined,
    since: searchParams.since || undefined,
  };

  const [signals, options] = await Promise.all([getSignals(filters, 200), getFilterOptions()]);

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="kicker">Investigador de Dolores</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Radar de Dolores</h1>
        </div>
        <RunAgentsButton target="pain-research" label="Ejecutar Investigador de Dolores" className="btn-secondary" />
      </header>

      <form className="mt-6 flex flex-wrap items-end gap-4 border-b border-line pb-6" method="get">
        <TextField name="minScore" label="Puntuación mín." defaultValue={searchParams.minScore} type="number" />
        <SelectField name="industry" label="Industria" options={options.industries} defaultValue={searchParams.industry} />
        <SelectField name="country" label="País" options={options.countries} defaultValue={searchParams.country} />
        <SelectField name="role" label="Rol" options={options.roles} defaultValue={searchParams.role} />
        <SelectField
          name="painCategory"
          label="Categoría de dolor"
          options={PAIN_CATEGORIES}
          labelFn={painCategoryLabel}
          defaultValue={searchParams.painCategory}
        />
        <SelectField
          name="evidenceType"
          label="Evidencia"
          options={EVIDENCE_TYPES}
          labelFn={evidenceTypeLabel}
          defaultValue={searchParams.evidenceType}
        />
        <SelectField name="status" label="Estado" options={STATUSES} labelFn={signalStatusLabel} defaultValue={searchParams.status} />
        <TextField name="since" label="Desde" defaultValue={searchParams.since} type="date" />
        <button className="btn-secondary h-[38px]" type="submit">
          Filtrar
        </button>
        <Link href="/signals" className="text-xs text-muted underline">
          Limpiar
        </Link>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="py-2 pr-4">Puntuación</th>
              <th className="py-2 pr-4">Persona</th>
              <th className="py-2 pr-4">Rol</th>
              <th className="py-2 pr-4">Empresa</th>
              <th className="py-2 pr-4">Dolor</th>
              <th className="py-2 pr-4">Industria</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s) => (
              <tr key={s.id} className="border-b border-line/60 hover:bg-line/10">
                <td className="py-3 pr-4">
                  <Link href={`/signals/${s.id}`}>
                    <ScorePill score={s.overallScore} />
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/signals/${s.id}`} className="font-medium text-ink hover:underline">
                    {s.personName}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-ink/80">{s.role}</td>
                <td className="py-3 pr-4 text-ink/80">{s.company_}</td>
                <td className="py-3 pr-4 text-ink/80">{s.patternLabel || painCategoryLabel(s.painCategory)}</td>
                <td className="py-3 pr-4 text-ink/80">{s.industry ?? "—"}</td>
                <td className="py-3 pr-4 text-xs text-muted">{signalStatusLabel(s.status)}</td>
                <td className="py-3 pr-4 text-ink/80">{formatDate(s.discoveredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {signals.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Aún no hay señales — ejecuta el Investigador de Dolores o ajusta tus filtros.
          </p>
        )}
      </div>
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="h-[38px] w-32 rounded border border-line bg-panel px-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
  labelFn,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
  labelFn?: (v: string) => string;
}) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-[38px] w-40 rounded border border-line bg-panel px-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labelFn ? labelFn(o) : o}
          </option>
        ))}
      </select>
    </label>
  );
}
