import "server-only";
import { prisma } from "../prisma";
import { env } from "../env";
import { hash, IngestError, KIND, localDay, PREFIX, prepareReview, topics, type Payload, type Review } from "./schema";
import type { Prisma } from "@prisma/client";

export function configuration() {
  const disabled = new Set((process.env.RADAR_DISABLED_TOPICS ?? "").split(",").map(t => t.trim()));
  const defaults = {
    collaboration: '"human collaboration" OR "colaboración equipos"',
    collective: '"collective intelligence" OR "inteligencia colectiva"',
    arts: '"arts based" organizational OR "arte colaboración empresas"',
    improv: '"applied improvisation" OR "improvisación empresas"',
    safety: '"psychological safety" OR "seguridad psicológica"',
    ai: '"AI" "organizational change" OR "IA cambio colaboración"',
    adaptability: '"organizational adaptability" OR "adaptive capacity" OR "organizational learning"',
  };
  const overrides: Record<string, string> = JSON.parse(process.env.RADAR_QUERIES_JSON ?? "{}");
  return { monitor_enabled: process.env.RADAR_MONITOR_ENABLED !== "false",
    agents: topics.map(id => ({ id, enabled: !disabled.has(id), query: typeof overrides[id] === "string" ? overrides[id] : defaults[id] })) };
}
export async function readReviews(db: Pick<Prisma.TransactionClient, "agentRun"> = prisma) {
  const rows = await db.agentRun.findMany({ where: { id: { startsWith: PREFIX } }, orderBy: { startedAt: "desc" }, select: { metadata: true } });
  return rows.map(row => row.metadata as unknown as Review).filter(r => r?.kind === KIND);
}
export async function state() {
  const reviews = await readReviews(), config = configuration();
  const today = reviews.filter(r => localDay(new Date(r.created)) === localDay(new Date()));
  return {
    settings: { monitor_enabled: config.monitor_enabled, last_research: reviews[0]?.created ?? null },
    agents: config.agents,
    items: reviews.flatMap(r => r.items),
    drafts: reviews.flatMap(r => r.drafts.map(d => ({ ...d, created: r.created }))),
    reports: reviews.flatMap(r => r.report ? [{ ...r.report, created: r.created }] : []),
    runs: reviews.map(r => ({ runId: r.runId, created: r.created, added: r.items.length, details: r.details })),
    remaining: { drafts: Math.max(0, 2 - today.reduce((n, r) => n + r.drafts.length, 0)), reports: today.some(r => r.report) ? 0 : 1 },
  };
}
export async function ingest(payload: Payload) {
  return prisma.$transaction(async tx => {
    // One lock covers deduplication, run idempotency and editorial quotas.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(728419263)`;
    const reviews = await readReviews(tx);
    const previous = reviews.find(r => r.runId === payload.runId);
    if (previous) {
      if (previous.payloadHash !== hash(JSON.stringify(payload))) throw new IngestError("runId already used with different content");
      return { ok: true, runId: previous.runId, added: previous.items.length, drafts: previous.drafts.length, replayed: true };
    }
    const config = configuration();
    if (!config.monitor_enabled) throw new IngestError("Monitoring is paused");
    const review = prepareReview(payload, reviews, config.agents.filter(a => a.enabled).map(a => a.id), new Date());
    if (review.items.length) {
      const day = `articles:${review.created.slice(0, 10)}`;
      await tx.$executeRaw`INSERT INTO "ai_usage" ("day", "count", "updatedAt") VALUES (${day}, 0, NOW()) ON CONFLICT ("day") DO NOTHING`;
      const [meter] = await tx.$queryRaw<{ count: number }[]>`SELECT "count" FROM "ai_usage" WHERE "day" = ${day} FOR UPDATE`;
      if (meter.count + review.items.length > env.ARTICLES_DAILY_LIMIT) throw new IngestError("Daily article capacity reached; shared limit resets at 00:00 UTC", 429);
      await tx.aiUsage.update({ where: { day }, data: { count: { increment: review.items.length } } });
    }
    const status = review.details.every(d => d.status === "error") ? "FAILED" : review.details.some(d => d.status !== "ok") ? "PARTIAL" : "SUCCESS";
    await tx.agentRun.create({ data: {
      id: PREFIX + hash(payload.runId), agent: "CONTENT", status,
      startedAt: new Date(review.created), finishedAt: new Date(review.created),
      summary: "Private observatory review", resultCount: review.items.length,
      metadata: review as unknown as Prisma.InputJsonValue,
    } });
    return { ok: true, runId: review.runId, added: review.items.length, drafts: review.drafts.length, replayed: false };
  }, { maxWait: 10000, timeout: 15000 });
}
