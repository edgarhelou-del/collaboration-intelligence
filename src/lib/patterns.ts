import "server-only";
import { prisma } from "./prisma";
import { generateText } from "./ai";
import { hasAI } from "./env";
import type { PainCategory } from "@prisma/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function topN(values: (string | null)[], n: number): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Re-aggregates every Signal into Pattern rows, grouped by the fine-grained
 * `patternKey` the Pain Researcher assigns (e.g. "cross-functional-silos"),
 * which is what turns a pile of signals into a legible, evolving radar.
 */
export async function recomputePatterns(): Promise<void> {
  const signals = await prisma.signal.findMany({
    select: {
      id: true,
      patternKey: true,
      patternLabel: true,
      painCategory: true,
      industry: true,
      country: true,
      role: true,
      overallScore: true,
      discoveredAt: true,
    },
  });

  const byKey = new Map<string, typeof signals>();
  for (const s of signals) {
    const arr = byKey.get(s.patternKey) ?? [];
    arr.push(s);
    byKey.set(s.patternKey, arr);
  }

  const now = Date.now();

  for (const [key, group] of byKey) {
    const label = group[group.length - 1].patternLabel || key;
    const painCategory: PainCategory = group[0].painCategory;

    const last30 = group.filter((s) => now - s.discoveredAt.getTime() <= THIRTY_DAYS_MS);
    const previous30 = group.filter(
      (s) => now - s.discoveredAt.getTime() > THIRTY_DAYS_MS && now - s.discoveredAt.getTime() <= 2 * THIRTY_DAYS_MS
    );

    const averageScore = group.reduce((sum, s) => sum + s.overallScore, 0) / group.length;
    const growthRate = (last30.length - previous30.length) / Math.max(previous30.length, 1);

    const representative = [...group]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map((s) => s.id);

    const firstAppearance = new Date(Math.min(...group.map((s) => s.discoveredAt.getTime())));
    const latestAppearance = new Date(Math.max(...group.map((s) => s.discoveredAt.getTime())));

    const existing = await prisma.pattern.findUnique({ where: { key } });

    const data = {
      label,
      painCategory,
      signalCount: group.length,
      last30Count: last30.length,
      previous30Count: previous30.length,
      growthRate,
      averageScore,
      topIndustries: topN(group.map((s) => s.industry), 3),
      topCountries: topN(group.map((s) => s.country), 3),
      topRoles: topN(group.map((s) => s.role), 3),
      representativeSignalIds: representative,
      firstAppearance,
      latestAppearance,
    };

    const pattern = await prisma.pattern.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });

    const shouldResynthesize = !existing || existing.signalCount !== group.length;
    if (shouldResynthesize && hasAI()) {
      try {
        const synthesis = await synthesizePattern({
          label,
          signalCount: group.length,
          growthRate,
          topIndustries: data.topIndustries,
          topRoles: data.topRoles,
          samples: group
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 5)
            .map((s) => s.id),
        });
        await prisma.pattern.update({
          where: { id: pattern.id },
          data: { aiSynthesis: synthesis, synthesizedAt: new Date() },
        });
      } catch {
        // Synthesis is a nice-to-have; leave the previous synthesis (or null) in place.
      }
    }
  }
}

async function synthesizePattern(input: {
  label: string;
  signalCount: number;
  growthRate: number;
  topIndustries: { name: string; count: number }[];
  topRoles: { name: string; count: number }[];
  samples: string[];
}): Promise<string> {
  const sampleSignals = await prisma.signal.findMany({
    where: { id: { in: input.samples } },
    select: { painDescription: true, role: true, company_: true, industry: true },
  });

  const text = await generateText({
    system:
      "You write a short, precise analyst synthesis (3-5 sentences) of an emerging organizational " +
      "collaboration pattern, based only on the aggregated stats and example descriptions given. " +
      "Do not invent numbers beyond what is given. Write in a neutral, editorial tone suitable for " +
      "an executive briefing. Do not use headers or bullet points — plain prose only.",
    prompt: `PATTERN: ${input.label}
SIGNAL COUNT: ${input.signalCount}
GROWTH RATE (vs prior 30 days): ${(input.growthRate * 100).toFixed(0)}%
TOP INDUSTRIES: ${JSON.stringify(input.topIndustries)}
TOP ROLES: ${JSON.stringify(input.topRoles)}
EXAMPLE SIGNALS: ${JSON.stringify(sampleSignals)}

Write the synthesis now.`,
    maxTokens: 400,
  });

  return text.trim();
}
