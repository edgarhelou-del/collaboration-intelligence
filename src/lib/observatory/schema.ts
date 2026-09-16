import { createHash } from "node:crypto";
import { z } from "zod";

export const topics = ["collaboration", "collective", "arts", "improv", "safety", "ai", "adaptability"] as const;
export const topicSchema = z.enum(topics);
export const urlSchema = z.string().url().max(2000).refine(value => {
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
}, "Expected an HTTP(S) reference without credentials");
const date = z.union([z.string().date(), z.string().datetime({ offset: true })]);
export const itemSchema = z.object({
  url: urlSchema, title: z.string().trim().min(1).max(500), source: z.string().trim().min(1).max(500),
  channel: z.enum(["Investigación", "Web", "Redes"]), topic: topicSchema,
  published: date.nullable(), summary: z.string().min(20).max(2200),
  insight: z.string().min(10).max(1400), caveat: z.string().min(5).max(1000),
  evidence: z.enum(["Estudio", "Caso práctico", "Marco conceptual", "Conversación", "Por verificar"]),
  score: z.number().int().min(0).max(100), method: z.literal("Síntesis del agente"),
  verified: z.string().datetime({ offset: true }),
}).strict();
export const draftSchema = z.object({
  url: urlSchema, title: z.string().trim().min(1).max(500),
  body: z.string().min(20).max(2999), angle: z.string().min(1).max(1000),
}).strict();
export const reportSchema = z.object({
  title: z.string().min(1).max(500), body: z.string().min(20).max(15000),
  references: z.array(urlSchema).min(1).max(30),
}).strict();
export const payloadSchema = z.object({
  runId: z.string().regex(/^[a-zA-Z0-9_.:-]{1,160}$/),
  items: z.array(itemSchema).max(8), drafts: z.array(draftSchema).max(2).default([]),
  report: reportSchema.optional(),
  details: z.array(z.object({
    source: z.string().min(1).max(150), topic: topicSchema,
    status: z.enum(["ok", "error", "partial"]), found: z.number().int().min(0),
    error: z.string().max(2000).optional(),
  }).strict()).min(1).max(100),
}).strict();
export type Payload = z.infer<typeof payloadSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type Report = z.infer<typeof reportSchema>;
export const PREFIX = "observatory:";
export const KIND = "kolab-observatory-v1";
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function canonicalUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "");
}
export const localDay = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
}).format(date);
export type Review = {
  kind: typeof KIND; runId: string; payloadHash: string; created: string;
  items: Item[]; drafts: Draft[]; report?: Report; details: Payload["details"];
};
export class IngestError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}

// Called inside one database transaction after acquiring the ingestion lock.
export function prepareReview(payload: Payload, reviews: Review[], enabled: string[], now: Date): Review {
  if (payload.items.some(i => !enabled.includes(i.topic)) || payload.details.some(d => !enabled.includes(d.topic))) {
    throw new IngestError("The review includes a disabled topic", 422);
  }
  if (payload.items.some(i => Date.parse(i.verified) > now.getTime() + 60_000 || (i.published && Date.parse(i.published) > now.getTime()))) {
    throw new IngestError("Inspection/publication dates cannot be in the future", 422);
  }
  const known = new Set(reviews.flatMap(r => r.items.map(i => canonicalUrl(i.url))));
  const items = payload.items.filter(item => {
    const key = canonicalUrl(item.url);
    if (known.has(key)) return false;
    known.add(key); return true;
  });
  const draftKeys = new Set(reviews.flatMap(r => r.drafts.map(d => canonicalUrl(d.url))));
  const draftTitles = new Set(reviews.flatMap(r => r.drafts.map(d => d.title.trim().toLowerCase())));
  const drafts = payload.drafts.filter(draft => {
    const key = canonicalUrl(draft.url), title = draft.title.trim().toLowerCase();
    if (!known.has(key)) throw new IngestError("Draft reference must exist in the collection", 422);
    if (draftKeys.has(key) || draftTitles.has(title)) return false;
    draftKeys.add(key); draftTitles.add(title); return true;
  });
  if (payload.report?.references.some(url => !known.has(canonicalUrl(url)))) {
    throw new IngestError("Report references must exist in the collection", 422);
  }
  const today = reviews.filter(r => localDay(new Date(r.created)) === localDay(now));
  if (today.reduce((n, r) => n + r.drafts.length, 0) + drafts.length > 2) throw new IngestError("Daily limit: two new drafts (America/Bogota)", 429);
  if (payload.report && today.some(r => r.report)) throw new IngestError("Daily limit: one report (America/Bogota)", 429);
  return { kind: KIND, runId: payload.runId, payloadHash: hash(JSON.stringify(payload)),
    created: now.toISOString(), items, drafts, ...(payload.report ? { report: payload.report } : {}), details: payload.details };
}
