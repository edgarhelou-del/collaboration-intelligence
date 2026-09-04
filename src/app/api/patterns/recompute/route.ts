import { NextResponse } from "next/server";
import { recomputePatterns } from "@/lib/patterns";
import { prisma } from "@/lib/prisma";
import { assertCronAuthorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Re-aggregates existing signals into patterns WITHOUT running the agents (no
 * AI Gateway calls). Useful after changing the pattern grouping logic or to
 * consolidate historical signals on demand.
 */
export async function POST(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  // Aggregate fast by default; pass ?synthesis=1 to also (best-effort) refresh
  // the AI syntheses, which can be slow/rate-limited.
  const withSynthesis = new URL(request.url).searchParams.get("synthesis") === "1";
  await recomputePatterns({ skipSynthesis: !withSynthesis });
  const patterns = await prisma.pattern.count();
  const signals = await prisma.signal.count();
  return NextResponse.json({ ok: true, patterns, signals });
}

export async function GET(request: Request) {
  return POST(request);
}
