// Deterministic scoring so the same evidence always yields the same score —
// the LLM proposes sub-ratings, this module turns them into the 0-100 scale
// defined by the product spec (evidence 30 / seniority 20 / org relevance 20
// / recency 15 / commercial 15).

export type SeniorityLevel = "C_LEVEL" | "VP" | "DIRECTOR" | "MANAGER" | "OTHER";

const SENIORITY_POINTS: Record<SeniorityLevel, number> = {
  C_LEVEL: 20,
  VP: 15,
  DIRECTOR: 10,
  MANAGER: 6,
  OTHER: 3,
};

export function seniorityScoreFromLevel(level: SeniorityLevel): number {
  return SENIORITY_POINTS[level] ?? SENIORITY_POINTS.OTHER;
}

export function inferSeniorityLevel(role: string | null | undefined): SeniorityLevel {
  const r = (role ?? "").toLowerCase();
  if (/\b(ceo|cfo|coo|cto|chro|cio|cpo|cmo|founder|co-founder|president|chief)\b/.test(r)) return "C_LEVEL";
  if (/\bvp\b|vice president/.test(r)) return "VP";
  if (/\bdirector\b|\bhead of\b/.test(r)) return "DIRECTOR";
  if (/\bmanager\b|\blead\b/.test(r)) return "MANAGER";
  return "OTHER";
}

export function evidenceScore(evidenceType: "DIRECT" | "INDIRECT", confidence01: number): number {
  const base = evidenceType === "DIRECT" ? 30 : 18;
  return Math.round(base * clamp01(confidence01));
}

export function recencyScore(sourceDate: Date | null): number {
  if (!sourceDate) return 4; // unknown date: treat conservatively, not zero
  const days = (Date.now() - sourceDate.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) return 15;
  if (days <= 30) return 12;
  if (days <= 90) return 8;
  if (days <= 180) return 4;
  return 1;
}

export function organizationalRelevanceScore(relevance01: number): number {
  return Math.round(20 * clamp01(relevance01));
}

export function commercialRelevanceScore(relevance01: number): number {
  return Math.round(15 * clamp01(relevance01));
}

export function overallScore(parts: {
  confidenceScore: number;
  seniorityScore: number;
  organizationalRelevanceScore: number;
  recencyScore: number;
  commercialRelevanceScore: number;
}): number {
  const total =
    parts.confidenceScore +
    parts.seniorityScore +
    parts.organizationalRelevanceScore +
    parts.recencyScore +
    parts.commercialRelevanceScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

export type ScoreClassification = "Exceptional" | "Strong" | "Interesting" | "Archive";

export function classifyScore(score: number): ScoreClassification {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Interesting";
  return "Archive";
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
