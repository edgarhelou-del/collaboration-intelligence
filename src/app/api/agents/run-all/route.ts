import { NextResponse } from "next/server";
import { runBoth } from "@/lib/agents/runner";
import { assertCronAuthorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  const outcome = await runBoth();
  const failed =
    outcome.content.status === "FAILED" &&
    outcome.painResearch.status === "FAILED" &&
    outcome.bioAdaptability.status === "FAILED";
  return NextResponse.json(outcome, { status: failed ? 502 : 200 });
}

// Vercel Cron issues GET requests to the configured path.
export async function GET(request: Request) {
  return POST(request);
}
