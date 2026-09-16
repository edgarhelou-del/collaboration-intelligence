import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalUrl, localDay, payloadSchema, prepareReview, topics, type Payload } from "../src/lib/observatory/schema";
import { authorize, sessionValue, validSession } from "../src/lib/observatory/auth";

const now = new Date("2026-09-16T04:30:00Z");
function input(): Payload { return {
  runId: "test-1", items: [{ url: "https://example.org/study", title: "Research", source: "Journal",
    channel: "Investigación", topic: "collective", published: "2026-09-01", summary: "Original summary of a verified study.",
    insight: "Application for collective learning.", caveat: "No causal inference.", evidence: "Estudio", score: 80,
    method: "Síntesis del agente", verified: now.toISOString() }],
  drafts: [], details: [{ source: "Journal", topic: "collective", status: "ok", found: 1 }],
}; }

test("rejects missing or malformed bearer tokens and fails closed without configuration", () => {
  const previous = process.env.RADAR_INGEST_TOKEN;
  try {
    delete process.env.RADAR_INGEST_TOKEN;
    assert.equal(authorize(new Request("https://example.org"))?.status, 503);
    process.env.RADAR_INGEST_TOKEN = "test-only-token-012345678901234567890";
    assert.equal(authorize(new Request("https://example.org"))?.status, 401);
    assert.equal(authorize(new Request("https://example.org", { headers: { authorization: process.env.RADAR_INGEST_TOKEN } }))?.status, 401);
    assert.equal(authorize(new Request("https://example.org", { headers: { authorization: `Bearer ${process.env.RADAR_INGEST_TOKEN}` } })), null);
    assert.equal(validSession(sessionValue(Date.now() + 60000)), true);
    assert.equal(validSession(sessionValue(Date.now() - 1)), false);
    assert.equal(validSession(sessionValue(Date.now() + 60000) + "tampered"), false);
    const oldSession = sessionValue(Date.now() + 60000);
    process.env.RADAR_INGEST_TOKEN = "rotated-test-token-012345678901234567890";
    assert.equal(validSession(oldSession), false);
  } finally { if (previous === undefined) delete process.env.RADAR_INGEST_TOKEN; else process.env.RADAR_INGEST_TOKEN = previous; }
});
test("rejects unsafe source links, oversized reviews and future dates", () => {
  const p = input();
  p.items[0].url = "javascript:alert(1)";
  assert.equal(payloadSchema.safeParse(p).success, false);
  p.items[0].url = "https://user:password@example.org";
  assert.equal(payloadSchema.safeParse(p).success, false);
  const big = input(); big.items = Array(9).fill(big.items[0]);
  assert.equal(payloadSchema.safeParse(big).success, false);
  const future = input(); future.items[0].published = "2027-01-01";
  assert.throws(() => prepareReview(future, [], [...topics], now), /future/);
});
test("deduplicates tracking variants but preserves meaningful query parameters", () => {
  assert.equal(canonicalUrl("https://example.org/study/?utm_source=x#intro"), canonicalUrl("https://example.org/study"));
  assert.notEqual(canonicalUrl("https://example.org/study?id=1"), canonicalUrl("https://example.org/study?id=2"));
  const first = prepareReview(input(), [], [...topics], now);
  const p = input(); p.runId = "test-2"; p.items[0].url += "/?utm_source=x";
  assert.equal(prepareReview(p, [first], [...topics], now).items.length, 0);
});
test("enforces enabled topics and reference provenance", () => {
  assert.throws(() => prepareReview(input(), [], ["ai"], now), /disabled/);
  const p = input(); p.drafts = [{ url: "https://example.org/unknown", title: "Title", angle: "Angle", body: "A draft for a non-existing reference." }];
  assert.throws(() => prepareReview(p, [], [...topics], now), /reference/);
});
test("daily draft quota uses Bogotá midnight and ignores duplicate drafts", () => {
  const p = input(); p.drafts = [{ url: p.items[0].url, title: "Draft", angle: "Angle", body: "Original draft supported by this reference." }];
  const first = prepareReview(p, [], [...topics], now);
  const secondInput = input(); secondInput.runId = "test-2"; secondInput.items[0].url += "-2";
  secondInput.drafts = [{ ...p.drafts[0], url: secondInput.items[0].url, title: "Second" }];
  const second = prepareReview(secondInput, [first], [...topics], now);
  assert.equal(prepareReview(p, [first, second], [...topics], now).drafts.length, 0);
  const third = input(); third.runId = "test-3"; third.items[0].url += "-3";
  third.drafts = [{ ...p.drafts[0], url: third.items[0].url, title: "Third" }];
  assert.throws(() => prepareReview(third, [first, second], [...topics], now), /two new drafts/);
  assert.equal(localDay(now), "2026-09-15");
  assert.equal(prepareReview(third, [first, second], [...topics], new Date("2026-09-16T05:01:00Z")).drafts.length, 1);
});
test("records reviews without news and enforces the report quota", () => {
  const empty = input(); empty.items = []; empty.details[0].found = 0;
  const review = prepareReview(empty, [], [...topics], now);
  assert.equal(review.items.length, 0); assert.equal(review.details.length, 1);
  const p = input(); p.report = { title: "Connections", body: "Interpretation connecting inspected references.", references: [p.items[0].url] };
  const first = prepareReview(p, [], [...topics], now);
  assert.throws(() => prepareReview(p, [first], [...topics], now), /one report/);
});
