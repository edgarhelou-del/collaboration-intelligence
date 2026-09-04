import "server-only";
import { prisma } from "./prisma";
import { env } from "./env";
import { AgentDependencyError } from "./agents/errors";

/** Current UTC day as "YYYY-MM-DD". */
function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reserves one model call against today's budget, enforcing the daily cap.
 *
 * Throws AgentDependencyError when the cap is already reached, so callers
 * report "budget exhausted" instead of spending beyond the AI Gateway free
 * tier. A limit of 0 disables the cap entirely.
 *
 * The read-then-increment is intentionally simple (two queries): at this
 * scale the tiny race window is harmless and it keeps the counter honest —
 * failed reservations are not counted against the budget.
 */
export async function reserveAiCall(): Promise<void> {
  const limit = env.AI_DAILY_CALL_LIMIT;
  if (limit === 0) return; // cap disabled

  const day = utcDay();
  const current = await prisma.aiUsage.upsert({
    where: { day },
    create: { day, count: 0 },
    update: {},
  });

  if (current.count >= limit) {
    throw new AgentDependencyError(
      `Daily AI budget reached (${current.count}/${limit} model calls today). ` +
        `This cap keeps usage within the AI Gateway free tier. It resets at 00:00 UTC; ` +
        `raise or disable it with the AI_DAILY_CALL_LIMIT environment variable.`
    );
  }

  await prisma.aiUsage.update({
    where: { day },
    data: { count: { increment: 1 } },
  });
}

/** Reads today's usage against the configured cap (for status/settings UI). */
export async function getAiUsageToday(): Promise<{ count: number; limit: number }> {
  const limit = env.AI_DAILY_CALL_LIMIT;
  const day = utcDay();
  const row = await prisma.aiUsage.findUnique({ where: { day } });
  return { count: row?.count ?? 0, limit };
}
