import Link from "next/link";
import {
  getLatestContent,
  getSignalCounts,
  getPatterns,
  getRecentAgentRuns,
} from "@/lib/data";
import { hasAI, hasSearch } from "@/lib/env";
import { formatDateTime, relativeDay, titleCase } from "@/lib/format";
import RunAgentsButton from "@/components/RunAgentsButton";
import Bar from "@/components/Bar";
import ScorePill from "@/components/ScorePill";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [latestContent, signalCounts, patterns, recentRuns] = await Promise.all([
    getLatestContent(),
    getSignalCounts(),
    getPatterns("frequent"),
    getRecentAgentRuns(12),
  ]);

  const systemReady = hasAI() && hasSearch();
  const topPatterns = patterns.slice(0, 6);
  const maxSignalCount = Math.max(1, ...topPatterns.map((p) => p.signalCount));

  const groupedActivity = groupByDay(
    recentRuns.map((r) => ({
      date: r.startedAt,
      text: activityText(r),
    }))
  );

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="kicker">Inteligencia Natural</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Collaboration Intelligence Radar</h1>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${systemReady ? "bg-signal-interesting" : "bg-signal-strong"}`} />
            <span className="font-semibold uppercase tracking-wide text-muted">
              {systemReady ? "System Active" : "System Active — Limited (check Settings)"}
            </span>
          </div>
        </div>
        <RunAgentsButton />
      </header>

      <section className="mt-10">
        <p className="label mb-3">Today</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <div className="flex items-start justify-between">
              <p className="label">Content Agent</p>
              {latestContent && <StatusBadge status={latestContent.status} />}
            </div>
            {latestContent ? (
              <>
                <p className="mt-3 font-serif text-lg leading-snug text-ink">{latestContent.mainIdea}</p>
                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-muted">
                  <dt>Generated</dt>
                  <dd className="text-right text-ink">{formatDateTime(latestContent.createdAt)}</dd>
                  <dt>Sources</dt>
                  <dd className="text-right text-ink">
                    {Array.isArray(latestContent.sources) ? latestContent.sources.length : 0}
                  </dd>
                  <dt>Score</dt>
                  <dd className="text-right"><ScorePill score={latestContent.score} /></dd>
                </dl>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">No content generated yet. Run the agents to get started.</p>
            )}
            <Link href="/content" className="btn-secondary mt-5 inline-flex">
              View Content
            </Link>
          </div>

          <div className="panel p-6">
            <p className="label">Pain Researcher</p>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted">Signals discovered</dt>
              <dd className="text-right font-mono text-ink">{signalCounts.total}</dd>
              <dt className="text-muted">Exceptional</dt>
              <dd className="text-right font-mono text-signal-exceptional">{signalCounts.exceptional}</dd>
              <dt className="text-muted">Strong</dt>
              <dd className="text-right font-mono text-signal-strong">{signalCounts.strong}</dd>
              <dt className="text-muted">Interesting</dt>
              <dd className="text-right font-mono text-signal-interesting">{signalCounts.interesting}</dd>
            </dl>
            <Link href="/signals" className="btn-secondary mt-5 inline-flex">
              View Signals
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <p className="label mb-3">Emerging Collaboration Signals</p>
        <div className="panel p-6">
          {topPatterns.length === 0 ? (
            <p className="text-sm text-muted">No patterns detected yet — run the Pain Researcher to begin building the radar.</p>
          ) : (
            topPatterns.map((p) => (
              <Link key={p.id} href={`/patterns/${p.key}`} className="block hover:opacity-80">
                <Bar value={p.signalCount} max={maxSignalCount} label={p.label} sub={`${p.signalCount}`} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10 pb-16">
        <p className="label mb-3">Recent Activity</p>
        <div className="panel divide-y divide-line">
          {groupedActivity.length === 0 && <p className="p-6 text-sm text-muted">No agent runs yet.</p>}
          {groupedActivity.map((group) => (
            <div key={group.day} className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.day}</p>
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 font-mono text-xs text-muted">
                      {item.date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                    <span className="text-ink">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function activityText(run: { agent: string; status: string; summary: string | null; error: string | null }) {
  const agentLabel = run.agent === "CONTENT" ? "Content Agent" : "Pain Researcher";
  if (run.status === "RUNNING") return `${agentLabel} started a run`;
  if (run.status === "FAILED") return `${agentLabel} run failed — ${run.error ?? "unknown error"}`;
  return `${agentLabel} — ${run.summary ?? titleCase(run.status)}`;
}

function groupByDay(items: { date: Date; text: string }[]) {
  const groups = new Map<string, { date: Date; text: string }[]>();
  for (const item of items) {
    const key = relativeDay(item.date);
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }
  return [...groups.entries()].map(([day, items]) => ({ day, items }));
}
