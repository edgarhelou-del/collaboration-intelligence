import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  REMEMBER_ME_DURATION_SECONDS,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const { email, password, rememberMe } = body as { email: string; password: string; rememberMe?: boolean };

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const genericError = NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });

  if (!user) return genericError;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return genericError;

  const token = await createSessionToken(
    { userId: user.id, organizationId: user.organizationId, role: user.role },
    !!rememberMe
  );

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? REMEMBER_ME_DURATION_SECONDS : SESSION_DURATION_SECONDS,
  });
  return response;
}
