import "server-only";
import { prisma } from "./prisma";
import { classifyScore } from "./scoring";
import type { Prisma } from "@prisma/client";

// Centralizing reads here (rather than scattering prisma.* calls across
// pages) is what lets the underlying provider change later without
// touching page components.

export async function getLatestContent() {
  return prisma.contentItem.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function getContentById(id: string) {
  return prisma.contentItem.findUnique({ where: { id } });
}

export async function getContentHistory(take = 15) {
  return prisma.contentItem.findMany({ orderBy: { createdAt: "desc" }, take });
}

export async function getSignalCounts() {
  const signals = await prisma.signal.findMany({ select: { overallScore: true } });
  const counts = { total: signals.length, exceptional: 0, strong: 0, interesting: 0, archive: 0 };
  for (const s of signals) {
    const c = classifyScore(s.overallScore).toLowerCase() as "exceptional" | "strong" | "interesting" | "archive";
    counts[c]++;
  }
  return counts;
}

export type SignalFilters = {
  minScore?: number;
  industry?: string;
  country?: string;
  role?: string;
  painCategory?: string;
  evidenceType?: string;
  status?: string;
  since?: string;
};

export function buildSignalWhere(filters: SignalFilters): Prisma.SignalWhereInput {
  const where: Prisma.SignalWhereInput = {};
  if (filters.minScore) where.overallScore = { gte: filters.minScore };
  if (filters.industry) where.industry = { equals: filters.industry, mode: "insensitive" };
  if (filters.country) where.country = { equals: filters.country, mode: "insensitive" };
  if (filters.role) where.role = { contains: filters.role, mode: "insensitive" };
  if (filters.painCategory) where.painCategory = filters.painCategory as never;
  if (filters.evidenceType) where.evidenceType = filters.evidenceType as never;
  if (filters.status) where.status = filters.status as never;
  if (filters.since) where.discoveredAt = { gte: new Date(filters.since) };
  return where;
}

export async function getSignals(filters: SignalFilters, take = 100) {
  return prisma.signal.findMany({
    where: buildSignalWhere(filters),
    orderBy: { overallScore: "desc" },
    take,
  });
}

export async function getSignalById(id: string) {
  return prisma.signal.findUnique({ where: { id } });
}

export async function getFilterOptions() {
  const [industries, countries, roles] = await Promise.all([
    prisma.signal.findMany({ distinct: ["industry"], select: { industry: true }, where: { industry: { not: null } } }),
    prisma.signal.findMany({ distinct: ["country"], select: { country: true }, where: { country: { not: null } } }),
    prisma.signal.findMany({ distinct: ["role"], select: { role: true }, where: { role: { not: null } } }),
  ]);
  return {
    industries: industries.map((i) => i.industry!).sort(),
    countries: countries.map((c) => c.country!).sort(),
    roles: roles.map((r) => r.role!).sort(),
  };
}

export async function getPatterns(sort: "frequent" | "growing" = "frequent") {
  return prisma.pattern.findMany({
    orderBy: sort === "frequent" ? { signalCount: "desc" } : { growthRate: "desc" },
  });
}

export async function getPatternByKey(key: string) {
  return prisma.pattern.findUnique({ where: { key } });
}

export async function getRepresentativeSignals(pattern: { representativeSignalIds: unknown }) {
  const ids = Array.isArray(pattern.representativeSignalIds) ? (pattern.representativeSignalIds as string[]) : [];
  if (ids.length === 0) return [];
  return prisma.signal.findMany({ where: { id: { in: ids } } });
}

export async function getRelatedContent(patternId: string) {
  const items = await prisma.contentItem.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return items.filter((item) => {
    const ids = Array.isArray(item.relatedPatternIds) ? (item.relatedPatternIds as string[]) : [];
    return ids.includes(patternId);
  });
}

// ---------------------------------------------------------------------------
// Bioadaptability Researcher reads
// ---------------------------------------------------------------------------

export async function getBioFindingCounts() {
  const findings = await prisma.bioFinding.findMany({ select: { overallScore: true, findingType: true } });
  const counts = { total: findings.length, exceptional: 0, strong: 0, interesting: 0, archive: 0, attributed: 0, research: 0 };
  for (const f of findings) {
    const c = classifyScore(f.overallScore).toLowerCase() as "exceptional" | "strong" | "interesting" | "archive";
    counts[c]++;
    if (f.findingType === "ATTRIBUTED") counts.attributed++;
    else counts.research++;
  }
  return counts;
}

export type BioFindingFilters = {
  minScore?: number;
  category?: string;
  level?: string;
  findingType?: string;
  industry?: string;
  country?: string;
  status?: string;
  since?: string;
};

export function buildBioWhere(filters: BioFindingFilters): Prisma.BioFindingWhereInput {
  const where: Prisma.BioFindingWhereInput = {};
  if (filters.minScore) where.overallScore = { gte: filters.minScore };
  if (filters.category) where.category = filters.category as never;
  if (filters.level) where.level = filters.level as never;
  if (filters.findingType) where.findingType = filters.findingType as never;
  if (filters.industry) where.industry = { equals: filters.industry, mode: "insensitive" };
  if (filters.country) where.country = { equals: filters.country, mode: "insensitive" };
  if (filters.status) where.status = filters.status as never;
  if (filters.since) where.discoveredAt = { gte: new Date(filters.since) };
  return where;
}

export async function getBioFindings(filters: BioFindingFilters, take = 200) {
  return prisma.bioFinding.findMany({
    where: buildBioWhere(filters),
    orderBy: { overallScore: "desc" },
    take,
  });
}

export async function getBioFindingById(id: string) {
  return prisma.bioFinding.findUnique({ where: { id } });
}

export async function getBioFilterOptions() {
  const [industries, countries] = await Promise.all([
    prisma.bioFinding.findMany({ distinct: ["industry"], select: { industry: true }, where: { industry: { not: null } } }),
    prisma.bioFinding.findMany({ distinct: ["country"], select: { country: true }, where: { country: { not: null } } }),
  ]);
  return {
    industries: industries.map((i) => i.industry!).sort(),
    countries: countries.map((c) => c.country!).sort(),
  };
}

export async function getBioPatterns(sort: "frequent" | "growing" = "frequent") {
  return prisma.bioPattern.findMany({
    orderBy: sort === "frequent" ? { findingCount: "desc" } : { growthRate: "desc" },
  });
}

export async function getBioPatternByKey(key: string) {
  return prisma.bioPattern.findUnique({ where: { key } });
}

export async function getRepresentativeBioFindings(pattern: { representativeFindingIds: unknown }) {
  const ids = Array.isArray(pattern.representativeFindingIds) ? (pattern.representativeFindingIds as string[]) : [];
  if (ids.length === 0) return [];
  return prisma.bioFinding.findMany({ where: { id: { in: ids } } });
}

export async function getBioFindingsSince(date: Date) {
  return prisma.bioFinding.findMany({ where: { discoveredAt: { gte: date } }, orderBy: { discoveredAt: "desc" } });
}

export async function getRecentAgentRuns(take = 20) {
  return prisma.agentRun.findMany({ orderBy: { startedAt: "desc" }, take });
}

export async function getAgentRunsSince(date: Date) {
  return prisma.agentRun.findMany({ where: { startedAt: { gte: date } }, orderBy: { startedAt: "desc" } });
}

export async function getSignalsSince(date: Date) {
  return prisma.signal.findMany({ where: { discoveredAt: { gte: date } }, orderBy: { discoveredAt: "desc" } });
}

export async function getContentSince(date: Date) {
  return prisma.contentItem.findMany({ where: { createdAt: { gte: date } }, orderBy: { createdAt: "desc" } });
}
