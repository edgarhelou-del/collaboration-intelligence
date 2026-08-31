import Link from "next/link";
import {
  getLatestContent,
  getSignalCounts,
  getPatterns,
  getRecentAgentRuns,
} from "@/lib/data";
import { hasAI, hasSearch, env } from "@/lib/env";
import { getAiUsageToday } from "@/lib/usage";
import { formatDateTime, relativeDay } from "@/lib/format";
import { runStatusLabel } from "@/lib/labels";
import RunAgentsButton from "@/components/RunAgentsButton";
import Bar from "@/components/Bar";
import ScorePill from "@/components/ScorePill";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [latestContent, signalCounts, patterns, recentRuns, usage] = await Promise.all([
    getLatestContent(),
    getSignalCounts(),
    getPatterns("frequent"),
    getRecentAgentRuns(12),
    getAiUsageToday().catch(() => ({ count: 0, limit: env.AI_DAILY_CALL_LIMIT })),
  ]);

  const systemReady = hasAI() && hasSearch();
  const capDisabled = usage.limit === 0;
  const usagePct = capDisabled ? 0 : Math.min(100, (usage.count / usage.limit) * 100);
  const usageDepleted = !capDisabled && usage.count >= usage.limit;
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
          <p className="kicker">KOLAB</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Radar de Inteligencia de Colaboración</h1>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${systemReady ? "bg-signal-interesting" : "bg-signal-strong"}`} />
            <span className="font-semibold uppercase tracking-wide text-muted">
              {systemReady ? "Sistema Activo" : "Sistema Activo — Limitado (revisa Configuración)"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <RunAgentsButton />
          <div className="w-full min-w-[180px] sm:w-52">
            <div className="flex items-baseline justify-between">
              <span className="label">Uso de IA hoy</span>
              <span className="font-mono text-xs text-ink">
                {capDisabled ? `${usage.count} llamadas` : `${usage.count}/${usage.limit}`}
              </span>
            </div>
            {!capDisabled && (
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line/40">
                <div
                  className={`h-full rounded-full ${usageDepleted ? "bg-signal-strong" : "bg-signal-interesting"}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
            <p className="mt-1 text-[11px] leading-tight text-muted">
              {capDisabled
                ? "Sin límite diario"
                : usageDepleted
                  ? "Límite diario del plan gratuito alcanzado — se reinicia a las 00:00 UTC"
                  : `${usage.limit - usage.count} llamadas restantes hoy`}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <p className="label mb-3">Hoy</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <div className="flex items-start justify-between">
              <p className="label">Agente de Contenido</p>
              {latestContent && <StatusBadge status={latestContent.status} />}
            </div>
            {latestContent ? (
              <>
                <p className="mt-3 font-serif text-lg leading-snug text-ink">{latestContent.mainIdea}</p>
                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-muted">
                  <dt>Generado</dt>
                  <dd className="text-right text-ink">{formatDateTime(latestContent.createdAt)}</dd>
                  <dt>Fuentes</dt>
                  <dd className="text-right text-ink">
                    {Array.isArray(latestContent.sources) ? latestContent.sources.length : 0}
                  </dd>
                  <dt>Puntuación</dt>
                  <dd className="text-right"><ScorePill score={latestContent.score} /></dd>
                </dl>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">Aún no se ha generado contenido. Ejecuta los agentes para comenzar.</p>
            )}
            <Link href="/content" className="btn-secondary mt-5 inline-flex">
              Ver Contenido
            </Link>
          </div>

          <div className="panel p-6">
            <p className="label">Investigador de Dolores</p>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted">Señales descubiertas</dt>
              <dd className="text-right font-mono text-ink">{signalCounts.total}</dd>
              <dt className="text-muted">Excepcional</dt>
              <dd className="text-right font-mono text-signal-exceptional">{signalCounts.exceptional}</dd>
              <dt className="text-muted">Fuerte</dt>
              <dd className="text-right font-mono text-signal-strong">{signalCounts.strong}</dd>
              <dt className="text-muted">Interesante</dt>
              <dd className="text-right font-mono text-signal-interesting">{signalCounts.interesting}</dd>
            </dl>
            <Link href="/signals" className="btn-secondary mt-5 inline-flex">
              Ver Señales
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <p className="label mb-3">Señales Emergentes de Colaboración</p>
        <div className="panel p-6">
          {topPatterns.length === 0 ? (
            <p className="text-sm text-muted">Aún no se detectan patrones — ejecuta el Investigador de Dolores para empezar a construir el radar.</p>
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
        <p className="label mb-3">Actividad Reciente</p>
        <div className="panel divide-y divide-line">
          {groupedActivity.length === 0 && <p className="p-6 text-sm text-muted">Aún no hay ejecuciones de agentes.</p>}
          {groupedActivity.map((group) => (
            <div key={group.day} className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.day}</p>
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 font-mono text-xs text-muted">
                      {item.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })}
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
  const agentLabel = run.agent === "CONTENT" ? "Agente de Contenido" : "Investigador de Dolores";
  if (run.status === "RUNNING") return `${agentLabel} inició una ejecución`;
  if (run.status === "FAILED") return `${agentLabel}: la ejecución falló — ${run.error ?? "error desconocido"}`;
  return `${agentLabel} — ${run.summary ?? runStatusLabel(run.status)}`;
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
