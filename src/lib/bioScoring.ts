// Deterministic scoring for Bioadaptability findings. The LLM proposes
// sub-ratings on a 0-1 scale; this module turns them into a fixed 0-100 scale:
//   evidence 35 / adaptation relevance 30 / actionability 20 / recency 15.
//
// Unlike the collaboration Pain scoring, seniority is NOT a factor: a strong
// research study with no named person should be able to score as highly as an
// attributed executive quote. Evidence strength carries the most weight, and
// ATTRIBUTED findings get a modest evidence bonus for being first-hand.

export function bioEvidenceScore(findingType: "ATTRIBUTED" | "RESEARCH", confidence01: number): number {
  // Attributed first-hand statements and named studies are treated as slightly
  // stronger ceilings than unattributed commentary, but both can score well.
  const base = findingType === "ATTRIBUTED" ? 35 : 30;
  return Math.round(base * clamp01(confidence01));
}

export function bioRelevanceScore(relevance01: number): number {
  return Math.round(30 * clamp01(relevance01));
}

export function bioActionabilityScore(actionability01: number): number {
  return Math.round(20 * clamp01(actionability01));
}

export function bioRecencyScore(sourceDate: Date | null): number {
  if (!sourceDate) return 4; // unknown date: conservative, not zero
  const days = (Date.now() - sourceDate.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 15;
  if (days <= 90) return 12;
  if (days <= 180) return 8;
  if (days <= 365) return 4;
  return 1;
}

export function bioOverallScore(parts: {
  evidenceScore: number;
  relevanceScore: number;
  actionabilityScore: number;
  recencyScore: number;
}): number {
  const total =
    parts.evidenceScore + parts.relevanceScore + parts.actionabilityScore + parts.recencyScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

// Reuse the same 0-100 classification bands as the collaboration radar so the
// shared ScorePill component reads consistently across both domains.
export type BioScoreClassification = "Exceptional" | "Strong" | "Interesting" | "Archive";

export function classifyBioScore(score: number): BioScoreClassification {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Interesting";
  return "Archive";
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
