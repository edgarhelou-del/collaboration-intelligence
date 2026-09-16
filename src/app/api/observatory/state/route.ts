import { NextResponse } from "next/server";
import { authorize } from "@/lib/observatory/auth";
import { state } from "@/lib/observatory/store";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  try { return NextResponse.json(await state(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ error: "Observatory storage unavailable" }, { status: 503 }); }
}
