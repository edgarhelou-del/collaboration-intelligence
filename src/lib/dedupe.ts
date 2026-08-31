import { prisma } from "./prisma";

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenSet(s: string): Set<string> {
  return new Set(
    normalize(s)
      .replace(/[^a-z0-9\s]/g, "")
      .split(" ")
      .filter((t) => t.length > 2)
  );
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** True if a signal for this exact source URL, or this person+company+pain
 * combination, already exists. */
export async function isDuplicateSignal(candidate: {
  sourceUrl: string;
  personName: string;
  company: string;
  painCategory: string;
}): Promise<boolean> {
  const bySource = await prisma.signal.findFirst({ where: { sourceUrl: candidate.sourceUrl } });
  if (bySource) return true;

  const byPersonCompany = await prisma.signal.findFirst({
    where: {
      personName: { equals: candidate.personName, mode: "insensitive" },
      company_: { equals: candidate.company, mode: "insensitive" },
      painCategory: candidate.painCategory as never,
    },
  });
  return Boolean(byPersonCompany);
}

/** True if a very similar content idea was published/drafted recently. */
export async function isDuplicateContentIdea(idea: string, lookback = 25): Promise<boolean> {
  const recent = await prisma.contentItem.findMany({
    orderBy: { createdAt: "desc" },
    take: lookback,
    select: { mainIdea: true },
  });
  return recent.some((r) => jaccardSimilarity(r.mainIdea, idea) > 0.55);
}
