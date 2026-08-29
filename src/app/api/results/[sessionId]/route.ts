import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/session";
import { detectFrictions, recommendationFor } from "@/lib/scoring";

export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  let admin;
  try {
    admin = await requireOrgAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const session = await prisma.assessmentSession.findUnique({
    where: { id: params.sessionId },
    include: { organization: true },
  });
  if (!session || session.organizationId !== admin.organizationId) {
    return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  }

  const scores = await prisma.score.findMany({
    where: { sessionId: session.id },
    include: { dimension: true },
  });

  const overall = scores.find((s) => s.dimensionId === null) ?? null;
  const dimensionScores = scores
    .filter((s) => s.dimensionId !== null)
    .map((s) => ({
      key: s.dimension!.key,
      name: s.dimension!.name,
      value: s.value,
      responseCount: s.responseCount,
    }))
    .sort((a, b) => b.value - a.value);

  // Se elimina el mínimo de respuestas para mostrar resultados: se muestran
  // en cuanto exista al menos una respuesta agregada. Solo bloqueamos cuando
  // todavía no hay ningún dato calculado para esta sesión.
  if (!overall) {
    return NextResponse.json({
      session: { id: session.id, launchedAt: session.launchedAt, status: session.status },
      belowThreshold: true,
      minResponses: 1,
      currentResponses: 0,
    });
  }

  const scoresByKey = Object.fromEntries(dimensionScores.map((d) => [d.key, d.value]));
  const frictions = detectFrictions(scoresByKey);
  const strengths = dimensionScores.slice(0, 2);
  const opportunities = [...dimensionScores].reverse().slice(0, 2);

  return NextResponse.json({
    session: { id: session.id, launchedAt: session.launchedAt, status: session.status },
    belowThreshold: false,
    overall: overall!.value,
    responseCount: overall!.responseCount,
    dimensions: dimensionScores,
    strengths,
    opportunities: opportunities.map((o) => ({ ...o, recommendation: recommendationFor(o.key) })),
    frictions,
  });
}
