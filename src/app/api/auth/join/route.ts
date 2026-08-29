import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, emailDomain, SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

/**
 * Self-serve join for participants: the corporate email domain is what
 * binds a person to an existing organization (see privacy/domain model),
 * no separate invite token required for the MVP.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { name, email, password, confirmPassword } = (body ?? {}) as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  const domain = emailDomain(email);

  try {
    const organization = await prisma.organization.findUnique({ where: { domain } });
    if (!organization) {
      return NextResponse.json(
        { error: "No encontramos una organización para ese dominio. Pide a tu administrador que la cree primero." },
        { status: 404 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "PARTICIPANT",
      },
    });

    await prisma.invitation.updateMany({
      where: { organizationId: organization.id, email: user.email, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });

    const token = await createSessionToken({ userId: user.id, organizationId: organization.id, role: user.role });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("[v0] join error:", error);
    return NextResponse.json(
      { error: "No pudimos completar el registro. Intenta de nuevo en unos segundos." },
      { status: 500 }
    );
  }
}
