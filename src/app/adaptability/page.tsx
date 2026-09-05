import Link from "next/link";
import { getBioFilterOptions, getBioFindingCounts, getBioFindings, type BioFindingFilters } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import ScorePill from "@/components/ScorePill";
import RunAgentsButton from "@/components/RunAgentsButton";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "CHANGE_READINESS",
  "CHANGE_FATIGUE",
  "RESILIENCE",
  "LEARNING_AGILITY",
  "REORGANIZATION",
  "TRANSFORMATION_ADOPTION",
  "LEADERSHIP_OF_CHANGE",
  "TEAM_ADAPTABILITY",
  "CULTURE_SHIFT",
  "AI_ADOPTION",
  "IDENTITY_AND_MEANING",
  "OTHER",
];
const LEVELS = ["INDIVIDUAL", "TEAM", "ORGANIZATION"];
const TYPES = ["ATTRIBUTED", "RESEARCH"];
const STATUSES = ["NEW", "REVIEWING", "RELEVANT", "ARCHIVED"];

export default async function AdaptabilityPage({ searchParams }: { searchParams: Record<string, string> }) {
  const filters: BioFindingFilters = {
    minScore: searchParams.minScore ? Number(searchParams.minScore) : undefined,
    category: searchParams.category || undefined,
    level: searchParams.level || undefined,
    findingType: searchParams.findingType || undefined,
    industry: searchParams.industry || undefined,
    country: searchParams.country || undefined,
    status: searchParams.status || undefined,
    since: searchParams.since || undefined,
  };

  const [findings, options, counts] = await Promise.all([
    getBioFindings(filters, 200),
    getBioFilterOptions(),
    getBioFindingCounts(),
  ]);

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="kicker">Bioadaptability Researcher</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Adaptability Radar</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            How individuals, teams and organizations sense, absorb and evolve through change — captured
            from both named practitioners and research.
          </p>
        </div>
        <RunAgentsButton target="bio-adaptability" label="Run Bioadaptability" className="btn-secondary" />
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Findings" value={counts.total} />
        <Stat label="Attributed" value={counts.attributed} />
        <Stat label="Research" value={counts.research} />
        <Stat label="Strong+" value={counts.exceptional + counts.strong} />
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-4 border-b border-line pb-6" method="get">
        <TextField name="minScore" label="Min Score" defaultValue={searchParams.minScore} type="number" />
        <SelectField name="findingType" label="Type" options={TYPES} labelFn={titleCase} defaultValue={searchParams.findingType} />
        <SelectField name="level" label="Level" options={LEVELS} labelFn={titleCase} defaultValue={searchParams.level} />
        <SelectField name="category" label="Category" options={CATEGORIES} labelFn={titleCase} defaultValue={searchParams.category} />
        <SelectField name="industry" label="Industry" options={options.industries} defaultValue={searchParams.industry} />
        <SelectField name="country" label="Country" options={options.countries} defaultValue={searchParams.country} />
        <SelectField name="status" label="Status" options={STATUSES} labelFn={titleCase} defaultValue={searchParams.status} />
        <TextField name="since" label="Since" defaultValue={searchParams.since} type="date" />
        <button className="btn-secondary h-[38px]" type="submit">
          Filter
        </button>
        <Link href="/adaptability" className="text-xs text-muted underline">
          Clear
        </Link>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Finding</th>
              <th className="py-2 pr-4">Level</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => (
              <tr key={f.id} className="border-b border-line/60 hover:bg-line/10">
                <td className="py-3 pr-4">
                  <Link href={`/adaptability/${f.id}`}>
                    <ScorePill score={f.overallScore} />
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <TypeTag type={f.findingType} />
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/adaptability/${f.id}`} className="font-medium text-ink hover:underline">
                    {f.title}
                  </Link>
                  {f.company && <span className="block text-xs text-muted">{f.personName ? `${f.personName}, ` : ""}{f.company}</span>}
                </td>
                <td className="py-3 pr-4 text-ink/80">{titleCase(f.level)}</td>
                <td className="py-3 pr-4 text-ink/80">{f.patternLabel || titleCase(f.category)}</td>
                <td className="py-3 pr-4 text-ink/80">{f.sourceName ?? hostname(f.sourceUrl)}</td>
                <td className="py-3 pr-4 text-ink/80">{formatDate(f.sourceDate ?? f.discoveredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {findings.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No findings yet — run the Bioadaptability Researcher, or adjust your filters.
          </p>
        )}
      </div>
    </div>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="label mb-1">{label}</p>
      <p className="font-mono text-2xl text-ink">{value}</p>
    </div>
  );
}

function TypeTag({ type }: { type: string }) {
  const isAttributed = type === "ATTRIBUTED";
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isAttributed ? "border-signal-strong text-signal-strong" : "border-signal-interesting text-signal-interesting"
      }`}
    >
      {isAttributed ? "Attributed" : "Research"}
    </span>
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
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labelFn ? labelFn(o) : o}
          </option>
        ))}
      </select>
    </label>
  );
}
