import "server-only";
import { prisma } from "./prisma";
import { generateText } from "./ai";
import { hasAI } from "./env";
import type { BioCategory, BioLevel } from "@prisma/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Canonical, reusable adaptation themes. Like the collaboration engine, the
// agent tends to coin hyper-specific slugs; we map each free-form key to one of
// a stable set of themes via keyword matching so related findings accumulate
// into the same evolving pattern instead of splitting into singletons.
// Order matters: the FIRST rule whose keyword appears in the key wins.
const THEME_RULES: { key: string; label: string; keywords: string[] }[] = [
  { key: "change-fatigue-burnout", label: "Change fatigue & burnout", keywords: ["fatigue", "exhaust", "burnout", "change-saturation", "overload", "initiative-overload", "too-much-change"] },
  { key: "change-readiness", label: "Change readiness", keywords: ["readiness", "ready-for-change", "prepare", "receptivity", "openness-to-change"] },
  { key: "resilience-building", label: "Resilience building", keywords: ["resilience", "resilient", "bounce-back", "recovery", "wellbeing", "well-being", "coping"] },
  { key: "learning-agility-reskilling", label: "Learning agility & reskilling", keywords: ["learning-agility", "reskill", "upskill", "learn", "skill-building", "adapt-skills", "capability-building"] },
  { key: "reorg-restructuring", label: "Reorg & restructuring", keywords: ["reorg", "restructur", "downsizing", "layoff", "merger", "acquisition", "m-and-a", "integration"] },
  { key: "digital-transformation-adoption", label: "Digital transformation adoption", keywords: ["digital-transformation", "transformation-adoption", "tech-adoption", "erp", "system-adoption", "rollout", "modernization"] },
  { key: "ai-adoption-adaptation", label: "AI adoption & adaptation", keywords: ["ai", "artificial-intelligence", "genai", "copilot", "automation", "augment", "agentic"] },
  { key: "leadership-of-change", label: "Leadership of change", keywords: ["leadership-of-change", "change-leadership", "leading-change", "sponsor", "manager-led", "leader-driven", "change-agent"] },
  { key: "team-adaptability", label: "Team adaptability", keywords: ["team-adapt", "team-agility", "squad", "cross-functional-adapt", "team-resilience", "adaptive-team"] },
  { key: "culture-shift", label: "Culture shift", keywords: ["culture-shift", "culture-change", "cultural", "mindset-shift", "growth-mindset", "values-shift", "behavior-change"] },
  { key: "identity-meaning-in-change", label: "Identity & meaning in change", keywords: ["identity", "meaning", "purpose", "belonging-during", "loss", "grief", "psychological-contract", "sensemaking"] },
  { key: "change-communication", label: "Change communication", keywords: ["change-communication", "communicating-change", "transparency-during", "narrative-of-change", "storytelling-change"] },
  { key: "resistance-to-change", label: "Resistance to change", keywords: ["resistance", "resist", "pushback", "skeptic", "inertia", "status-quo"] },
];

// Fallback theme derived from the category enum when keyword matching fails,
// aligned to the SAME keys above so findings never split into near-duplicates.
const CATEGORY_THEME: Record<string, { key: string; label: string }> = {
  CHANGE_READINESS: { key: "change-readiness", label: "Change readiness" },
  CHANGE_FATIGUE: { key: "change-fatigue-burnout", label: "Change fatigue & burnout" },
  RESILIENCE: { key: "resilience-building", label: "Resilience building" },
  LEARNING_AGILITY: { key: "learning-agility-reskilling", label: "Learning agility & reskilling" },
  REORGANIZATION: { key: "reorg-restructuring", label: "Reorg & restructuring" },
  TRANSFORMATION_ADOPTION: { key: "digital-transformation-adoption", label: "Digital transformation adoption" },
  LEADERSHIP_OF_CHANGE: { key: "leadership-of-change", label: "Leadership of change" },
  TEAM_ADAPTABILITY: { key: "team-adaptability", label: "Team adaptability" },
  CULTURE_SHIFT: { key: "culture-shift", label: "Culture shift" },
  AI_ADOPTION: { key: "ai-adoption-adaptation", label: "AI adoption & adaptation" },
  IDENTITY_AND_MEANING: { key: "identity-meaning-in-change", label: "Identity & meaning in change" },
  OTHER: { key: "other-adaptation-signals", label: "Other adaptation signals" },
};

function canonicalTheme(rawKey: string, category: string): { key: string; label: string } {
  const hay = rawKey.toLowerCase().replace(/[\s_]+/g, "-");
  for (const rule of THEME_RULES) {
    if (rule.keywords.some((kw) => hay.includes(kw))) {
      return { key: rule.key, label: rule.label };
    }
  }
  return CATEGORY_THEME[category] ?? { key: "other-adaptation-signals", label: "Other adaptation signals" };
}

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
 * Re-aggregates every BioFinding into BioPattern rows, grouped by a stable
 * canonical adaptation theme, turning a pile of findings into a legible radar.
 */
export async function recomputeBioPatterns(options?: { skipSynthesis?: boolean }): Promise<void> {
  const findings = await prisma.bioFinding.findMany({
    select: {
      id: true,
      patternKey: true,
      patternLabel: true,
      category: true,
      level: true,
      findingType: true,
      industry: true,
      country: true,
      overallScore: true,
      discoveredAt: true,
    },
  });

  const byKey = new Map<string, typeof findings>();
  const labelByKey = new Map<string, string>();
  for (const f of findings) {
    const { key, label } = canonicalTheme(f.patternKey, f.category);
    const arr = byKey.get(key) ?? [];
    arr.push(f);
    byKey.set(key, arr);
    if (!labelByKey.has(key)) labelByKey.set(key, label);
  }

  const now = Date.now();

  const pendingSynthesis: {
    patternId: string;
    label: string;
    findingCount: number;
    growthRate: number;
    topIndustries: { name: string; count: number }[];
    topLevels: { name: string; count: number }[];
    samples: string[];
  }[] = [];

  for (const [key, group] of byKey) {
    const label = labelByKey.get(key) || group[group.length - 1].patternLabel || key;
    const category: BioCategory = (topN(group.map((f) => f.category), 1)[0]?.name as BioCategory) ?? group[0].category;
    const level: BioLevel = (topN(group.map((f) => f.level), 1)[0]?.name as BioLevel) ?? group[0].level;

    const last30 = group.filter((f) => now - f.discoveredAt.getTime() <= THIRTY_DAYS_MS);
    const previous30 = group.filter(
      (f) => now - f.discoveredAt.getTime() > THIRTY_DAYS_MS && now - f.discoveredAt.getTime() <= 2 * THIRTY_DAYS_MS
    );

    const averageScore = group.reduce((sum, f) => sum + f.overallScore, 0) / group.length;
    const growthRate = (last30.length - previous30.length) / Math.max(previous30.length, 1);

    const representative = [...group]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map((f) => f.id);

    const firstAppearance = new Date(Math.min(...group.map((f) => f.discoveredAt.getTime())));
    const latestAppearance = new Date(Math.max(...group.map((f) => f.discoveredAt.getTime())));

    const existing = await prisma.bioPattern.findUnique({ where: { key } });

    const data = {
      label,
      category,
      level,
      findingCount: group.length,
      last30Count: last30.length,
      previous30Count: previous30.length,
      growthRate,
      averageScore,
      attributedCount: group.filter((f) => f.findingType === "ATTRIBUTED").length,
      researchCount: group.filter((f) => f.findingType === "RESEARCH").length,
      topIndustries: topN(group.map((f) => f.industry), 3),
      topCountries: topN(group.map((f) => f.country), 3),
      topLevels: topN(group.map((f) => f.level), 3),
      representativeFindingIds: representative,
      firstAppearance,
      latestAppearance,
    };

    const pattern = await prisma.bioPattern.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });

    const shouldResynthesize = !existing || existing.findingCount !== group.length || !existing.aiSynthesis;
    if (shouldResynthesize) {
      pendingSynthesis.push({
        patternId: pattern.id,
        label,
        findingCount: group.length,
        growthRate,
        topIndustries: data.topIndustries,
        topLevels: data.topLevels,
        samples: group
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, 5)
          .map((f) => f.id),
      });
    }
  }

  const liveKeys = [...byKey.keys()];
  await prisma.bioPattern.deleteMany({ where: { key: { notIn: liveKeys } } });

  if (options?.skipSynthesis || !hasAI()) return;

  for (const item of pendingSynthesis) {
    try {
      const synthesis = await withTimeout(synthesizePattern(item), 15000);
      await prisma.bioPattern.update({
        where: { id: item.patternId },
        data: { aiSynthesis: synthesis, synthesizedAt: new Date() },
      });
    } catch {
      // Rate limit / timeout: stop this run, retry next run. Aggregation persisted.
      break;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function synthesizePattern(input: {
  label: string;
  findingCount: number;
  growthRate: number;
  topIndustries: { name: string; count: number }[];
  topLevels: { name: string; count: number }[];
  samples: string[];
}): Promise<string> {
  const sampleFindings = await prisma.bioFinding.findMany({
    where: { id: { in: input.samples } },
    select: { title: true, summary: true, level: true, industry: true },
  });

  const text = await generateText({
    system:
      "You write a short, precise analyst synthesis (3-5 sentences) of an emerging pattern in how " +
      "organizations, teams and people adapt to change, based only on the aggregated stats and example " +
      "descriptions given. Do not invent numbers beyond what is given. Write in a neutral, editorial tone " +
      "suitable for an executive briefing. Do not use headers or bullet points — plain prose only.",
    prompt: `PATTERN: ${input.label}
FINDING COUNT: ${input.findingCount}
GROWTH RATE (vs prior 30 days): ${(input.growthRate * 100).toFixed(0)}%
TOP INDUSTRIES: ${JSON.stringify(input.topIndustries)}
LEVELS: ${JSON.stringify(input.topLevels)}
EXAMPLE FINDINGS: ${JSON.stringify(sampleFindings)}

Write the synthesis now.`,
    maxTokens: 400,
  });

  return text.trim();
}
