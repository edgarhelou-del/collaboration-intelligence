import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * MVP forgot-password: issues a reset token and logs the reset link to the
 * server console instead of sending a real email (no email provider wired
 * up yet). Always returns a generic success message so we don't leak
 * which emails exist in the system.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const generic = NextResponse.json({
    ok: true,
    message: "Si el email existe, enviaremos instrucciones para restablecer la contraseña.",
  });

  if (!email) return generic;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return generic;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  // TODO: wire up a transactional email provider. For the MVP we log the
  // link so the flow is testable end-to-end locally.
  console.log(`[password-reset] ${email} -> /reset-password?token=${token}`);

  return generic;
}
