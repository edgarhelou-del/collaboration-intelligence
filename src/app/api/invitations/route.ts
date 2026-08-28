import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/session";
import { emailDomain } from "@/lib/auth";

export async function GET() {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: admin.organizationId },
    orderBy: { invitedAt: "desc" },
  });
  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: admin.organizationId } });
  if (emailDomain(email) !== org?.domain) {
    return NextResponse.json({ error: `El email debe pertenecer al dominio ${org?.domain}.` }, { status: 400 });
  }

  const invitation = await prisma.invitation.create({
    data: { organizationId: admin.organizationId, email },
  });

  // TODO: send an actual email invite once a provider is wired up.
  console.log(`[invitation] ${email} invited to org ${admin.organizationId} -> share /join`);

  return NextResponse.json({ ok: true, invitation });
}
