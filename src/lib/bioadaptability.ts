import "server-only";
import { getPatterns } from "./data";
import type { Pattern } from "@prisma/client";

// ---------------------------------------------------------------------------
// Bioadaptability lens
//
// This is a *reading* layer, not a new data source. It re-interprets the same
// Pattern rows the radar already computes, through the frame of organizational
// bioadaptability: the capacity of a living system — a person, a team, an
// organization — to sense change and reorganize in response to it.
//
// Every collaboration pain the Pain Researcher surfaces is, from this angle,
// a point of adaptive strain: friction that tells us where the system's
// ability to absorb change is being tested. We route each pattern to the level
// where that strain lives and derive an interpretive "adaptive pressure"
// reading. Nothing here is stored; it is recomputed on read from live patterns.
// ---------------------------------------------------------------------------

export type AdaptabilityLevel = "COLLABORATOR" | "TEAM" | "ORGANIZATION";

export type LevelDefinition = {
  level: AdaptabilityLevel;
  title: string;
  subtitle: string;
  facet: string;
  description: string;
};

export const LEVEL_ORDER: AdaptabilityLevel[] = ["COLLABORATOR", "TEAM", "ORGANIZATION"];

export const LEVEL_DEFINITIONS: Record<AdaptabilityLevel, LevelDefinition> = {
  COLLABORATOR: {
    level: "COLLABORATOR",
    title: "Colaborador",
    subtitle: "Adaptabilidad individual",
    facet: "Agilidad de aprendizaje y resiliencia personal",
    description:
      "La capacidad de cada persona para desaprender, aprender de nuevo y sostener su energía frente al cambio. " +
      "Aquí viven las señales sobre desarrollo de liderazgo, colaboración con IA y las prácticas experienciales que " +
      "expanden el repertorio adaptativo del individuo.",
  },
  TEAM: {
    level: "TEAM",
    title: "Equipo de trabajo",
    subtitle: "Adaptabilidad del equipo",
    facet: "Cohesión, confianza y velocidad de respuesta",
    description:
      "Un equipo se adapta cuando la seguridad psicológica, la confianza y sus ritmos de coordinación le permiten " +
      "reorganizarse sin fracturarse. Estas señales revelan dónde la comunicación, los rituales y la confianza " +
      "amplían o limitan la respuesta colectiva al cambio.",
  },
  ORGANIZATION: {
    level: "ORGANIZATION",
    title: "Organización",
    subtitle: "Adaptabilidad estructural y cultural",
    facet: "Estructura, cultura y gestión del cambio",
    description:
      "A escala organizacional la adaptabilidad depende de la alineación, la fluidez entre áreas y la cultura para " +
      "atravesar transformaciones. Estas señales muestran cómo los silos, la desalineación y la fricción del cambio " +
      "condicionan la capacidad del sistema completo para evolucionar.",
  },
};

// Canonical theme keys (from patterns.ts) routed to the adaptability level where
// the strain primarily lives. Keys not listed fall back to painCategory below.
const KEY_TO_LEVEL: Record<string, AdaptabilityLevel> = {
  "human-ai-collaboration": "COLLABORATOR",
  "applied-improv-experiential-learning": "COLLABORATOR",
  "leadership-development": "COLLABORATOR",
  "corporate-storytelling": "COLLABORATOR",

  "psychological-safety-gap": "TEAM",
  "trust-erosion": "TEAM",
  "communication-breakdown": "TEAM",
  "team-rituals-cadence": "TEAM",
  "talking-circles-dialogue": "TEAM",
  "hybrid-remote-coordination": "TEAM",

  "cross-functional-silos": "ORGANIZATION",
  "knowledge-sharing-gaps": "ORGANIZATION",
  "leadership-alignment-gap": "ORGANIZATION",
  "culture-transformation": "ORGANIZATION",
  "change-management-friction": "ORGANIZATION",
};

const CATEGORY_TO_LEVEL: Record<string, AdaptabilityLevel> = {
  HUMAN_AI_COLLABORATION: "COLLABORATOR",
  LEADERSHIP: "COLLABORATOR",

  TRUST: "TEAM",
  COMMUNICATION: "TEAM",
  PSYCHOLOGICAL_SAFETY: "TEAM",
  COORDINATION: "TEAM",
  COLLABORATION: "TEAM",

  SILOS: "ORGANIZATION",
  ALIGNMENT: "ORGANIZATION",
  KNOWLEDGE_SHARING: "ORGANIZATION",
  CULTURE: "ORGANIZATION",
  OTHER: "ORGANIZATION",
};

function levelFor(pattern: Pattern): AdaptabilityLevel {
  return KEY_TO_LEVEL[pattern.key] ?? CATEGORY_TO_LEVEL[pattern.painCategory] ?? "ORGANIZATION";
}

export type LevelReading = LevelDefinition & {
  patterns: Pattern[];
  patternCount: number;
  totalSignals: number;
  averageScore: number;
  growthRate: number;
  // Interpretive 0-100 reading of where adaptive strain concentrates. Higher =
  // more pressure on this level's capacity to adapt. Derived, not measured.
  pressureIndex: number;
};

export type BioadaptabilityReading = {
  levels: LevelReading[];
  totalSignals: number;
  hasData: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export async function getBioadaptabilityReading(): Promise<BioadaptabilityReading> {
  const patterns = await getPatterns("frequent");

  const groups = new Map<AdaptabilityLevel, Pattern[]>();
  for (const level of LEVEL_ORDER) groups.set(level, []);
  for (const p of patterns) groups.get(levelFor(p))!.push(p);

  // Pre-compute per-level totals so pressure can be normalized across levels.
  const totals = LEVEL_ORDER.map((level) => {
    const ps = groups.get(level)!;
    const totalSignals = ps.reduce((s, p) => s + p.signalCount, 0);
    const last30 = ps.reduce((s, p) => s + p.last30Count, 0);
    const previous30 = ps.reduce((s, p) => s + p.previous30Count, 0);
    const growthRate = (last30 - previous30) / Math.max(previous30, 1);
    const weightedScore = ps.reduce((s, p) => s + p.averageScore * p.signalCount, 0);
    const averageScore = totalSignals > 0 ? weightedScore / totalSignals : 0;
    return { level, ps, totalSignals, growthRate, averageScore };
  });

  const maxSignals = Math.max(1, ...totals.map((t) => t.totalSignals));
  const totalSignals = totals.reduce((s, t) => s + t.totalSignals, 0);

  const levels: LevelReading[] = totals.map((t) => {
    // Two thirds of the reading is the concentration of strain (signal volume
    // relative to the busiest level); one third is upward momentum (recent
    // growth), so a level heating up reads as rising adaptive pressure.
    const volumeComponent = (t.totalSignals / maxSignals) * 70;
    const growthComponent = clamp(t.growthRate, 0, 1) * 30;
    const pressureIndex = t.totalSignals === 0 ? 0 : Math.round(clamp(volumeComponent + growthComponent, 0, 100));

    return {
      ...LEVEL_DEFINITIONS[t.level],
      patterns: t.ps,
      patternCount: t.ps.length,
      totalSignals: t.totalSignals,
      averageScore: t.averageScore,
      growthRate: t.growthRate,
      pressureIndex,
    };
  });

  return { levels, totalSignals, hasData: totalSignals > 0 };
}

export function pressureLabel(index: number): string {
  if (index >= 66) return "Presión alta";
  if (index >= 33) return "Presión media";
  if (index > 0) return "Presión baja";
  return "Sin señales";
}
