import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const session = await prisma.assessmentSession.findFirst({
    where: { organizationId: user.organizationId, status: "ACTIVE" },
    orderBy: { launchedAt: "desc" },
  });

  if (!session) {
    return NextResponse.json({ session: null });
  }

  const questions = await prisma.question.findMany({
    where: { assessmentId: session.assessmentId },
    include: { dimension: true },
    orderBy: [{ dimension: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const existingResponses = await prisma.response.findMany({
    where: { sessionId: session.id, userId: user.id },
  });

  return NextResponse.json({
    session: { id: session.id },
    questions: questions.map((q) => ({
      id: q.id,
      code: q.code,
      text: q.text,
      dimensionName: q.dimension.name,
    })),
    responses: Object.fromEntries(existingResponses.map((r) => [r.questionId, r.value])),
  });
}
