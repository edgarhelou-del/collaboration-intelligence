import { hasAI, hasSearch, env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let dbConnected = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbConnected = false;
  }

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">Configuration</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Settings</h1>
      </header>

      <section className="mt-8">
        <p className="label mb-3">System Status</p>
        <ul className="panel divide-y divide-line">
          <StatusRow label="Database (PostgreSQL)" ok={dbConnected} okText="Connected" badText="Not connected" />
          <StatusRow label="AI generation (ANTHROPIC_API_KEY)" ok={hasAI()} okText="Configured" badText="Not configured" />
          <StatusRow
            label="Web research (TAVILY_API_KEY)"
            ok={hasSearch()}
            okText="Configured"
            badText="Not configured — Pain Researcher will report incomplete research rather than fabricate signals"
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
        <p className="label mb-3">Model</p>
        <p className="text-sm text-ink">{env.ANTHROPIC_MODEL}</p>
        <p className="mt-1 text-xs text-muted">Override with the ANTHROPIC_MODEL environment variable.</p>
      </section>

      <section className="mt-8 pb-16">
        <p className="label mb-3">Scheduling</p>
        <p className="text-sm text-ink/90">
          Agents run manually today, from the dashboard&rsquo;s &ldquo;Run Both Agents&rdquo; button. To automate daily
          runs, enable the cron job already defined in <code className="rounded bg-line/40 px-1">vercel.json</code>{" "}
          (calls <code className="rounded bg-line/40 px-1">/api/agents/run-all</code> once a day) after deploying to
          Vercel, and set <code className="rounded bg-line/40 px-1">CRON_SECRET</code> to lock that endpoint down to
          Vercel Cron.
        </p>
      </section>
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
