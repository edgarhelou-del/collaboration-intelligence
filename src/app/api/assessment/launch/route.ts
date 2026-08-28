import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/session";

export async function POST() {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const existingActive = await prisma.assessmentSession.findFirst({
    where: { organizationId: admin.organizationId, status: "ACTIVE" },
  });
  if (existingActive) {
    return NextResponse.json({ ok: true, sessionId: existingActive.id, alreadyActive: true });
  }

  const assessment = await prisma.assessment.findFirst({ where: { isActive: true } });
  if (!assessment) {
    return NextResponse.json({ error: "No hay un cuestionario configurado." }, { status: 500 });
  }

  const session = await prisma.assessmentSession.create({
    data: { organizationId: admin.organizationId, assessmentId: assessment.id, status: "ACTIVE" },
  });

  return NextResponse.json({ ok: true, sessionId: session.id, alreadyActive: false });
}
