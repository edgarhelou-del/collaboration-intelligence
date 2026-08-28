import { prisma } from "@/lib/prisma";

/** Converts a raw 1-5 Likert value to its dimension-scale contribution, applying reverse-scoring. */
export function adjustedValue(rawValue: number, reverseScored: boolean): number {
  return reverseScored ? 6 - rawValue : rawValue;
}

/** Maps an average 1-5 item score to a 0-100 dimension/overall score. */
export function toHundredScale(average1to5: number): number {
  return Math.round(((average1to5 - 1) / 4) * 100 * 10) / 10;
}

/**
 * Recomputes and persists Score rows (per dimension + overall) for a
 * session, from the raw Response rows. This is the only place raw
 * responses are read for aggregation — admin-facing code should always
 * read from Score, never Response, to keep individual answers private.
 */
export async function recomputeSessionScores(sessionId: string) {
  const responses = await prisma.response.findMany({
    where: { sessionId },
    include: { question: { include: { dimension: true } } },
  });

  const byDimension = new Map<string, { name: string; values: number[]; users: Set<string> }>();
  const overallUsers = new Set<string>();
  const overallValues: number[] = [];

  for (const r of responses) {
    const adjusted = adjustedValue(r.value, r.question.reverseScored);
    overallValues.push(adjusted);
    overallUsers.add(r.userId);

    const dim = r.question.dimension;
    if (!byDimension.has(dim.id)) {
      byDimension.set(dim.id, { name: dim.name, values: [], users: new Set() });
    }
    const entry = byDimension.get(dim.id)!;
    entry.values.push(adjusted);
    entry.users.add(r.userId);
  }

  const results: { dimensionId: string | null; value: number; responseCount: number }[] = [];

  if (overallValues.length > 0) {
    const avg = overallValues.reduce((a, b) => a + b, 0) / overallValues.length;
    results.push({ dimensionId: null, value: toHundredScale(avg), responseCount: overallUsers.size });
  }

  for (const [dimensionId, entry] of byDimension) {
    const avg = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
    results.push({ dimensionId, value: toHundredScale(avg), responseCount: entry.users.size });
  }

  // Postgres unique constraints don't treat NULL as a matchable value, so
  // the "overall" row (dimensionId = null) can't go through a composite-key
  // upsert like the per-dimension rows can — find-then-write instead.
  await prisma.$transaction(async (tx) => {
    for (const r of results) {
      const existing = await tx.score.findFirst({ where: { sessionId, dimensionId: r.dimensionId } });
      if (existing) {
        await tx.score.update({
          where: { id: existing.id },
          data: { value: r.value, responseCount: r.responseCount, computedAt: new Date() },
        });
      } else {
        await tx.score.create({
          data: { sessionId, dimensionId: r.dimensionId, value: r.value, responseCount: r.responseCount },
        });
      }
    }
  });

  return results;
}

export type DimensionInsight = {
  dimensionId: string;
  name: string;
  value: number;
};

/** Simple rule-based friction heuristics between pairs of dimension scores. */
export function detectFrictions(scoresByKey: Record<string, number>): string[] {
  const frictions: string[] = [];

  if (scoresByKey.autonomy - scoresByKey.decision_making > 20) {
    frictions.push(
      "Autonomía alta pero decisiones poco claras: las personas actúan solas pero no siempre saben cómo se coordina lo que deciden."
    );
  }
  if (scoresByKey.trust - scoresByKey.knowledge_sharing > 20) {
    frictions.push(
      "Hay confianza interpersonal, pero el conocimiento no se comparte al mismo ritmo: probablemente falten hábitos o espacios, no voluntad."
    );
  }
  if (scoresByKey.psychological_safety - scoresByKey.conversation_quality > 20) {
    frictions.push(
      "La gente se siente segura para hablar, pero las conversaciones no siempre convergen en algo útil."
    );
  }
  if (scoresByKey.information_flow < 50 && scoresByKey.cross_functional < 50) {
    frictions.push(
      "La colaboración entre áreas se ve limitada por un flujo de información débil: el problema puede ser más estructural que interpersonal."
    );
  }

  return frictions;
}

const RECOMMENDATIONS: Record<string, string> = {
  trust: "Haz visibles los compromisos entre personas y equipos: qué se promete y qué se cumple.",
  psychological_safety: "Modela vulnerabilidad desde el liderazgo: admitir errores primero abre la puerta a que otros lo hagan.",
  information_flow: "Mapea dónde se atasca la información: ¿en qué punto deja de moverse?",
  knowledge_sharing: "Crea un ritual ligero y recurrente para compartir aprendizajes entre equipos.",
  cross_functional: "Identifica los 2-3 puntos de fricción más frecuentes entre áreas y resuélvelos con las personas correctas en la sala.",
  conversation_quality: "Revisa el propósito y la duración de tus reuniones recurrentes; menos reuniones, mejor diseñadas.",
  decision_making: "Haz explícito quién decide qué, y comunica las decisiones a quienes las necesitan, no solo a quienes participaron.",
  autonomy: "Reduce las aprobaciones innecesarias para decisiones de bajo riesgo.",
  collective_learning: "Cierra el ciclo de los errores con un cambio concreto y visible, no solo con una conversación.",
  adaptability: "Normaliza probar y cambiar de rumbo: celebra los ajustes rápidos, no solo los planes cumplidos.",
};

export function recommendationFor(dimensionKey: string): string {
  return RECOMMENDATIONS[dimensionKey] ?? "Explora esta dimensión con tu equipo en más profundidad.";
}
