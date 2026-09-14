import "server-only";
import { prisma } from "./prisma";
import { USAGE_LIMITS, PROVIDER_LABELS, type ProviderKey } from "./env";
import { AgentDependencyError } from "./agents/errors";

/** UTC calendar day as "YYYY-MM-DD" (lexicographically comparable). */
function utcDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** The UTC day string `n` days before today. */
function dayNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return utcDay(d);
}

function usageKey(provider: ProviderKey, day: string = utcDay()): string {
  return `${provider}:${day}`;
}

export type WindowUsage = { count: number; limit: number };
export type ProviderUsage = {
  provider: ProviderKey;
  label: string;
  daily: WindowUsage;
  weekly: WindowUsage;
  monthly: WindowUsage;
};

/**
 * Sums a provider's usage across the three rolling windows from the per-day
 * rows: daily = today, weekly = last 7 days, monthly = last 30 days.
 */
async function windowCounts(
  provider: ProviderKey
): Promise<{ daily: number; weekly: number; monthly: number }> {
  const monthCut = dayNDaysAgo(29);
  const weekCut = dayNDaysAgo(6);
  const today = utcDay();

  const prefix = `${provider}:`;
  const rows = await prisma.aiUsage.findMany({
    where: { day: { startsWith: prefix, gte: usageKey(provider, monthCut) } },
    select: { day: true, count: true },
  });

  let daily = 0;
  let weekly = 0;
  let monthly = 0;
  for (const r of rows) {
    const date = r.day.slice(prefix.length);
    if (date < monthCut) continue;
    monthly += r.count;
    if (date >= weekCut) weekly += r.count;
    if (date === today) daily += r.count;
  }
  return { daily, weekly, monthly };
}

export async function getProviderUsage(provider: ProviderKey): Promise<ProviderUsage> {
  const c = await windowCounts(provider);
  const l = USAGE_LIMITS[provider];
  return {
    provider,
    label: PROVIDER_LABELS[provider],
    daily: { count: c.daily, limit: l.daily },
    weekly: { count: c.weekly, limit: l.weekly },
    monthly: { count: c.monthly, limit: l.monthly },
  };
}

/** All providers' usage, for the settings dashboard. */
export async function getAllUsage(): Promise<ProviderUsage[]> {
  const providers: ProviderKey[] = ["groq", "tavily"];
  return Promise.all(providers.map(getProviderUsage));
}

/**
 * The automatic brake. Reserves one call against a provider's budget, but only
 * after verifying every enabled window is still under its cap. When a window is
 * at its limit it throws AgentDependencyError (so it surfaces like any missing
 * dependency) and no provider call is made. A window with limit 0 is treated
 * as disabled. These counters are an application guardrail; provider-side
 * quotas and spend controls remain authoritative.
 */
export async function reserveCall(provider: ProviderKey): Promise<void> {
  const c = await windowCounts(provider);
  const l = USAGE_LIMITS[provider];
  const label = PROVIDER_LABELS[provider];

  const windows: { name: string; count: number; limit: number; envVar: string }[] = [
    { name: "daily", count: c.daily, limit: l.daily, envVar: `${provider.toUpperCase()}_DAILY_LIMIT` },
    { name: "weekly", count: c.weekly, limit: l.weekly, envVar: `${provider.toUpperCase()}_WEEKLY_LIMIT` },
    { name: "monthly", count: c.monthly, limit: l.monthly, envVar: `${provider.toUpperCase()}_MONTHLY_LIMIT` },
  ];

  for (const w of windows) {
    if (w.limit > 0 && w.count >= w.limit) {
      throw new AgentDependencyError(
        `${label} ${w.name} usage guardrail reached (${w.count}/${w.limit}). Runs are paused ` +
          `until this window resets; to allow more calls now, raise ${w.envVar} and verify the ` +
          `provider-side quota or spend control first.`
      );
    }
  }

  const day = usageKey(provider);
  await prisma.aiUsage.upsert({
    where: { day },
    create: { day, count: 1 },
    update: { count: { increment: 1 } },
  });
}
