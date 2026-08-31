import { NextResponse } from "next/server";
import { runPainResearch } from "@/lib/agents/runner";
import { assertCronAuthorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  const outcome = await runPainResearch();
  return NextResponse.json(outcome, { status: outcome.status === "FAILED" ? 502 : 200 });
}
