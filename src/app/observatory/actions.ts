"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, sessionValue, validToken } from "@/lib/observatory/auth";

export async function login(form: FormData) {
  const value = form.get("accessToken");
  if (typeof value !== "string" || !validToken(value)) redirect("/radar/observatory?error=access");
  (await cookies()).set(COOKIE, sessionValue(Date.now() + 8 * 3600_000), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/radar/observatory", maxAge: 8 * 3600,
  });
  redirect("/radar/observatory");
}
export async function logout() {
  (await cookies()).set(COOKIE, "", { path: "/radar/observatory", maxAge: 0 });
  redirect("/radar/observatory");
}
