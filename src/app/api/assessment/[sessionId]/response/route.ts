import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { recomputeSessionScores } from "@/lib/scoring";

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { questionId, value } = (body ?? {}) as { questionId?: string; value?: number };

  if (!questionId || typeof value !== "number" || value < 1 || value > 5) {
    return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
  }

  const session = await prisma.assessmentSession.findUnique({ where: { id: params.sessionId } });
  if (!session || session.organizationId !== user.organizationId || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Sesión de diagnóstico no válida." }, { status: 404 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question || question.assessmentId !== session.assessmentId) {
    return NextResponse.json({ error: "Pregunta no válida para esta sesión." }, { status: 400 });
  }

  await prisma.response.upsert({
    where: { sessionId_userId_questionId: { sessionId: session.id, userId: user.id, questionId } },
    update: { value, status: "COMPLETED" },
    create: { sessionId: session.id, userId: user.id, questionId, value, status: "COMPLETED" },
  });

  const [answeredCount, totalQuestions] = await Promise.all([
    prisma.response.count({ where: { sessionId: session.id, userId: user.id } }),
    prisma.question.count({ where: { assessmentId: session.assessmentId } }),
  ]);

  const justCompleted = answeredCount === totalQuestions;
  if (justCompleted) {
    // Recompute aggregate scores now that a participant finished the full
    // instrument — cheap at MVP scale, keeps Score always fresh.
    await recomputeSessionScores(session.id);
  }

  return NextResponse.json({ ok: true, answeredCount, totalQuestions, justCompleted });
}
