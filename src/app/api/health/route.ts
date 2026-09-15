import { NextResponse } from "next/server";
import { env, hasAI, hasGateway, hasSearch, aiProvider } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const body = {
    status: database && hasAI() && hasSearch() ? "ok" : "degraded",
    database,
    providers: {
      groq: Boolean(env.GROQ_API_KEY),
      gateway: hasGateway(),
      activeAI: aiProvider(),
      tavily: Boolean(env.TAVILY_API_KEY),
      searchReady: hasSearch(),
      freeOnly: env.FREE_ONLY,
    },
    cronProtected: Boolean(env.CRON_SECRET),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: database && hasAI() && hasSearch() ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
