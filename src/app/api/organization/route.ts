import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/session";

export async function GET() {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const organization = await prisma.organization.findUnique({ where: { id: admin.organizationId } });
  const users = await prisma.user.findMany({
    where: { organizationId: admin.organizationId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ organization, users });
}

export async function PATCH(request: NextRequest) {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const { minResponsesForResults, showIndividualResults } = (body ?? {}) as {
    minResponsesForResults?: number;
    showIndividualResults?: boolean;
  };

  const organization = await prisma.organization.update({
    where: { id: admin.organizationId },
    data: {
      ...(typeof minResponsesForResults === "number" && minResponsesForResults >= 1
        ? { minResponsesForResults }
        : {}),
      ...(typeof showIndividualResults === "boolean" ? { showIndividualResults } : {}),
    },
  });

  return NextResponse.json({ organization });
}
