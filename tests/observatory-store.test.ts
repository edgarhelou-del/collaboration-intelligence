import { test } from "node:test";
import assert from "node:assert/strict";
import type { Payload } from "../src/lib/observatory/schema";

test("database ingestion is atomic, private, idempotent and enforces concurrent quotas", {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/ci");
  process.env.APP_DATABASE_URL = url.href;
  process.env.RADAR_MONITOR_ENABLED = "true";
  process.env.ARTICLES_DAILY_LIMIT = "100";
  const { prisma } = await import("../src/lib/prisma");
  const { ingest, state } = await import("../src/lib/observatory/store");
  const { getRecentAgentRuns, getAgentRunsSince } = await import("../src/lib/data");
  const meter = `articles:${new Date().toISOString().slice(0, 10)}`;
  const make = (id: string): Payload => ({
    runId: id, items: [{ url: `https://example.org/${id}`, title: id, source: "Journal", channel: "Investigación", topic: "collective",
      published: null, summary: "A verified original research summary.", insight: "Application for collective learning.", caveat: "Not causal evidence.",
      evidence: "Estudio", score: 80, method: "Síntesis del agente", verified: new Date().toISOString() }], drafts: [],
    details: [{ source: "Journal", topic: "collective", status: "ok", found: 1 }],
  });
  try {
    await prisma.agentRun.deleteMany({ where: { id: { startsWith: "observatory:" } } });
    await prisma.aiUsage.deleteMany({ where: { day: meter } });
    const p = make("same-run");
    const retries = await Promise.all(Array.from({ length: 5 }, () => ingest(p)));
    assert.equal(retries.filter(r => !r.replayed).length, 1);
    assert.equal((await state()).items.length, 1);
    assert.equal((await prisma.aiUsage.findUniqueOrThrow({ where: { day: meter } })).count, 1);
    await assert.rejects(ingest({ ...p, items: [{ ...p.items[0], title: "Changed" }] }), /different content/);
    const copies = [make("copy-1"), make("copy-2")];
    copies.forEach(copy => { copy.items[0].url = p.items[0].url; });
    assert.equal((await Promise.all(copies.map(ingest))).reduce((n, r) => n + r.added, 0), 0);
    const withDraft = ["draft-1", "draft-2", "draft-3"].map(id => {
      const review = make(id);
      review.drafts = [{ url: review.items[0].url, title: id, angle: "Collective learning", body: "An original draft supported by this reference." }];
      return review;
    });
    const writes = await Promise.allSettled(withDraft.map(ingest));
    assert.equal(writes.filter(r => r.status === "fulfilled").length, 2);
    assert.equal((await state()).drafts.length, 2);
    assert.equal((await state()).items.length, 3); // The rejected transaction writes no item/meter.
    assert.equal((await prisma.aiUsage.findUniqueOrThrow({ where: { day: meter } })).count, 3);
    const empty = make("no-news"); empty.items = []; empty.details[0].found = 0;
    await ingest(empty);
    assert.ok((await state()).runs.some(r => r.runId === "no-news"));
    assert.ok((await getRecentAgentRuns()).every(r => !r.id.startsWith("observatory:")));
    assert.ok((await getAgentRunsSince(new Date(0))).every(r => !r.id.startsWith("observatory:")));
    process.env.RADAR_MONITOR_ENABLED = "false";
    await assert.rejects(ingest(make("paused")), /paused/);
    process.env.RADAR_MONITOR_ENABLED = "true";
    await prisma.aiUsage.update({ where: { day: meter }, data: { count: 100 } });
    await assert.rejects(ingest(make("over-budget")), /capacity/);
    assert.ok(!(await state()).runs.some(r => r.runId === "over-budget"));
  } finally {
    await prisma.agentRun.deleteMany({ where: { id: { startsWith: "observatory:" } } });
    await prisma.aiUsage.deleteMany({ where: { day: meter } });
    await prisma.$disconnect();
  }
});
