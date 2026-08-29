import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  emailDomain,
  isLikelyCorporateDomain,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { organizationName, domain, adminName, email, password, confirmPassword } = body as Record<string, string>;

  if (!organizationName?.trim() || !domain?.trim() || !adminName?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!isLikelyCorporateDomain(normalizedDomain)) {
    return NextResponse.json({ error: "Usa un dominio corporativo válido (ej. acme.com)." }, { status: 400 });
  }

  const userDomain = emailDomain(email);
  if (userDomain !== normalizedDomain) {
    return NextResponse.json(
      { error: `El email debe pertenecer al dominio ${normalizedDomain}.` },
      { status: 400 }
    );
  }

  try {
    const existingOrg = await prisma.organization.findUnique({ where: { domain: normalizedDomain } });
    if (existingOrg) {
      return NextResponse.json({ error: "Ya existe una organización con ese dominio." }, { status: 409 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { organization, user } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName.trim(), domain: normalizedDomain },
      });
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: adminName.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: "ORG_ADMIN",
        },
      });
      return { organization, user };
    });

    const token = await createSessionToken({
      userId: user.id,
      organizationId: organization.id,
      role: user.role,
    });

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
    console.error("[v0] register error:", error);
    return NextResponse.json(
      { error: "No pudimos crear la organización. Intenta de nuevo en unos segundos." },
      { status: 500 }
    );
  }
}
