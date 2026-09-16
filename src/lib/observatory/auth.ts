import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const COOKIE = "kolab_observatory";
const token = () => process.env.RADAR_INGEST_TOKEN ?? "";
export function accessConfigured() { return token().length >= 32; }
function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function validToken(value: string) { return accessConfigured() && equal(value, token()); }
export function authorize(request: Request) {
  if (!accessConfigured()) return NextResponse.json({ error: "Observatory access is not configured" }, { status: 503 });
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ") || !validToken(header.slice(7))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
export function sessionValue(expires: number) {
  return `${expires}.${createHmac("sha256", token()).update(`observatory:${expires}`).digest("hex")}`;
}
export function validSession(value: string | undefined) {
  if (!accessConfigured() || !value) return false;
  const expires = Number(value.split(".")[0]);
  return Number.isSafeInteger(expires) && expires > Date.now() && equal(value, sessionValue(expires));
}
