import { NextResponse } from "next/server";
import { authorize } from "@/lib/observatory/auth";
import { IngestError, payloadSchema, topics } from "@/lib/observatory/schema";
import { ingest } from "@/lib/observatory/store";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  return NextResponse.json({ version: 1, method: "POST", authentication: "Authorization: Bearer <RADAR_INGEST_TOKEN>",
    maxBytes: 200000, maxItems: 8, maxDailyDrafts: 2, maxDailyReports: 1, timezone: "America/Bogota", topics,
    fields: { runId: "Stable ID; identical retry is idempotent, changed payload returns 409",
      items: "url,title,source,channel,topic,published,summary,insight,caveat,evidence,score,method,verified",
      drafts: "url,title,body (<3000 characters),angle", report: "optional title,body,references (existing item URLs)",
      details: "source (max150),topic,status (ok/error/partial),found,error?; required even without new findings" },
    methodLabel: "Síntesis del agente", statePath: "/radar/api/observatory/state",
    note: "Read state first. Disabled topics and paused monitoring are enforced. No publishing or model calls. No daily-quota override supported.",
  }, { headers });
}
export async function POST(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  const reader = request.body?.getReader(); if (!reader) return NextResponse.json({ error: "Missing body" }, { status: 400 });
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 200000) { await reader.cancel(); return NextResponse.json({ error: "Payload too large" }, { status: 413 }); }
    chunks.push(chunk.value);
  }
  let value: unknown;
  try { value = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = payloadSchema.safeParse(value);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review", issues: parsed.error.flatten() }, { status: 422 });
  try { return NextResponse.json(await ingest(parsed.data), { headers }); }
  catch (error) {
    if (error instanceof IngestError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    return NextResponse.json({ error: "Observatory storage unavailable; retry the same runId" }, { status: 503, headers });
  }
}
