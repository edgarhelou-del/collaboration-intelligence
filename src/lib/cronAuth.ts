import { NextResponse } from "next/server";
import { env } from "./env";

/**
 * Gates the public /api/agents/* routes, which exist for cron/external
 * triggering (see README "Future scheduling"). The in-app "Run" buttons do
 * NOT go through these — they call server actions (src/app/actions.ts) that
 * invoke the agents in-process, so the dashboard never needs this secret.
 * If CRON_SECRET is unset (local dev default), these routes stay open.
 */
export function assertCronAuthorized(request: Request): NextResponse | null {
  if (!env.CRON_SECRET) return null;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${env.CRON_SECRET}`) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
