import Link from "next/link";
import { getFilterOptions, getSignals, type SignalFilters } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
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
          <p className="kicker">Pain Researcher</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Pain Radar</h1>
        </div>
        <RunAgentsButton target="pain-research" label="Run Pain Researcher" className="btn-secondary" />
      </header>

      <form className="mt-6 flex flex-wrap items-end gap-4 border-b border-line pb-6" method="get">
        <TextField name="minScore" label="Min Score" defaultValue={searchParams.minScore} type="number" />
        <SelectField name="industry" label="Industry" options={options.industries} defaultValue={searchParams.industry} />
        <SelectField name="country" label="Country" options={options.countries} defaultValue={searchParams.country} />
        <SelectField name="role" label="Role" options={options.roles} defaultValue={searchParams.role} />
        <SelectField
          name="painCategory"
          label="Pain Category"
          options={PAIN_CATEGORIES}
          labelFn={titleCase}
          defaultValue={searchParams.painCategory}
        />
        <SelectField
          name="evidenceType"
          label="Evidence"
          options={EVIDENCE_TYPES}
          defaultValue={searchParams.evidenceType}
        />
        <SelectField name="status" label="Status" options={STATUSES} defaultValue={searchParams.status} />
        <TextField name="since" label="Since" defaultValue={searchParams.since} type="date" />
        <button className="btn-secondary h-[38px]" type="submit">
          Filter
        </button>
        <Link href="/signals" className="text-xs text-muted underline">
          Clear
        </Link>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Person</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Pain</th>
              <th className="py-2 pr-4">Industry</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Date</th>
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
                <td className="py-3 pr-4 text-ink/80">{s.patternLabel || titleCase(s.painCategory)}</td>
                <td className="py-3 pr-4 text-ink/80">{s.industry ?? "—"}</td>
                <td className="py-3 pr-4 text-xs text-muted">{s.status}</td>
                <td className="py-3 pr-4 text-ink/80">{formatDate(s.discoveredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {signals.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No signals yet — run the Pain Researcher, or adjust your filters.
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
