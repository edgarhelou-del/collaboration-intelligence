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

  const rows = await prisma.aiUsage.findMany({
    where: { provider, day: { gte: monthCut } },
    select: { day: true, count: true },
  });

  let daily = 0;
  let weekly = 0;
  let monthly = 0;
  for (const r of rows) {
    monthly += r.count;
    if (r.day >= weekCut) weekly += r.count;
    if (r.day === today) daily += r.count;
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
 * dependency) and NO call is spent — keeping the app strictly inside the free
 * tier. A window with limit 0 is treated as disabled.
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
        `${label} ${w.name} free-tier limit reached (${w.count}/${w.limit}). Runs are paused ` +
          `automatically to stay within the free tier — no charges are incurred. This window ` +
          `resets on its own; to allow more now, raise ${w.envVar}.`
      );
    }
  }

  const day = utcDay();
  await prisma.aiUsage.upsert({
    where: { provider_day: { provider, day } },
    create: { provider, day, count: 1 },
    update: { count: { increment: 1 } },
  });
}
