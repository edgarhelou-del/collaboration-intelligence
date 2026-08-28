import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/session";

export async function GET() {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [organization, totalUsers, sessions] = await Promise.all([
    prisma.organization.findUnique({ where: { id: admin.organizationId } }),
    prisma.user.count({ where: { organizationId: admin.organizationId } }),
    prisma.assessmentSession.findMany({
      where: { organizationId: admin.organizationId },
      orderBy: { launchedAt: "desc" },
      include: { scores: { where: { dimensionId: null } } },
    }),
  ]);

  const sessionsWithParticipation = sessions.map((s) => {
    const overall = s.scores[0];
    return {
      id: s.id,
      status: s.status,
      launchedAt: s.launchedAt,
      overallScore: overall?.value ?? null,
      responseCount: overall?.responseCount ?? 0,
      participationPct: totalUsers > 0 ? Math.round(((overall?.responseCount ?? 0) / totalUsers) * 100) : 0,
    };
  });

  return NextResponse.json({
    organization: { name: organization?.name, domain: organization?.domain },
    totalUsers,
    sessions: sessionsWithParticipation,
    activeSession: sessionsWithParticipation.find((s) => s.status === "ACTIVE") ?? null,
  });
}
