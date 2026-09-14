import { hasAI, hasSearch, env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getAllUsage, type ProviderUsage, type WindowUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let dbConnected = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbConnected = false;
  }

  let usage: ProviderUsage[] = [];
  if (dbConnected) {
    try {
      usage = await getAllUsage();
    } catch {
      // usage table unavailable — leave empty, panel shows a note
    }
  }

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">Configuration</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Groq powers the LLM work and Tavily powers web search. Local usage guardrails pause new calls
          at the configured thresholds; provider-side billing and spend controls remain the source of truth.
        </p>
      </header>

      <section className="mt-8">
        <p className="label mb-3">System Status</p>
        <ul className="panel divide-y divide-line">
          <StatusRow label="Database (PostgreSQL)" ok={dbConnected} okText="Connected" badText="Not connected" />
          <StatusRow
            label="LLM (Groq)"
            ok={hasAI()}
            okText={`Configured — model ${env.GROQ_MODEL}`}
            badText="Not configured — add a free GROQ_API_KEY from console.groq.com"
          />
          <StatusRow
            label="Web research (Tavily)"
            ok={hasSearch()}
            okText="Configured — free web search enabled"
            badText="Not configured — add a free TAVILY_API_KEY from tavily.com"
          />
          <StatusRow
            label="Cron protection (CRON_SECRET)"
            ok={Boolean(env.CRON_SECRET)}
            okText="Set — /api/agents/* require it"
            badText="Not set — /api/agents/* are open (fine for local dev)"
          />
        </ul>
      </section>

      <section className="mt-8">
        <p className="label mb-3">Free-tier usage &amp; limits</p>
        {usage.length === 0 ? (
          <p className="text-sm text-muted">Usage data is unavailable right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {usage.map((u) => (
              <ProviderUsageCard key={u.provider} usage={u} />
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Windows are rolling: daily = today (UTC), weekly = last 7 days, monthly = last 30 days. When
          any window with a limit is reached, runs pause automatically until it resets. Adjust a cap with
          its env var, e.g.{" "}
          <code className="rounded bg-line/40 px-1">GROQ_DAILY_LIMIT</code> or{" "}
          <code className="rounded bg-line/40 px-1">TAVILY_MONTHLY_LIMIT</code> (set to 0 to disable a
          window).
        </p>
      </section>

      <section className="mt-8 pb-16">
        <p className="label mb-3">Scheduling</p>
        <p className="text-sm text-ink/90">
          Agents run manually today, from the dashboard&rsquo;s run buttons. To automate daily runs,
          enable the cron job already defined in <code className="rounded bg-line/40 px-1">vercel.json</code>{" "}
          (calls <code className="rounded bg-line/40 px-1">/api/agents/run-all</code> once a day) after
          deploying to Vercel, and set <code className="rounded bg-line/40 px-1">CRON_SECRET</code> to
          lock that endpoint down to Vercel Cron.
        </p>
      </section>
    </div>
  );
}

function ProviderUsageCard({ usage }: { usage: ProviderUsage }) {
  return (
    <div className="panel p-4">
      <p className="text-sm font-medium text-ink">{usage.label}</p>
      <div className="mt-3 space-y-3">
        <UsageBar name="Daily" window={usage.daily} />
        <UsageBar name="Weekly" window={usage.weekly} />
        <UsageBar name="Monthly" window={usage.monthly} />
      </div>
    </div>
  );
}

function UsageBar({ name, window }: { name: string; window: WindowUsage }) {
  const disabled = window.limit === 0;
  const pct = disabled ? 0 : Math.min(100, (window.count / window.limit) * 100);
  const atLimit = !disabled && window.count >= window.limit;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">{name}</span>
        <span className={atLimit ? "text-signal-strong" : "text-ink"}>
          {disabled ? (
            <>
              {window.count} <span className="text-muted">/ no cap</span>
            </>
          ) : (
            <>
              {window.count} / {window.limit}
            </>
          )}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line/40">
        <div
          className={`h-full rounded-full ${atLimit ? "bg-signal-strong" : "bg-signal-interesting"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusRow({ label, ok, okText, badText }: { label: string; ok: boolean; okText: string; badText: string }) {
  return (
    <li className="flex items-center justify-between gap-4 p-4 text-sm">
      <span className="text-ink">{label}</span>
      <span className="flex items-center gap-2 text-right">
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-signal-interesting" : "bg-signal-strong"}`} />
        <span className="text-xs text-muted">{ok ? okText : badText}</span>
      </span>
    </li>
  );
}
