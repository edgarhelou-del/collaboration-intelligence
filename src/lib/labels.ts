// Spanish display labels for database enum values. The stored enum values stay
// in English (so the schema and agents are untouched); only what the user sees
// is translated here.

export const PAIN_CATEGORY_LABELS: Record<string, string> = {
  COLLABORATION: "Colaboración",
  SILOS: "Silos",
  COMMUNICATION: "Comunicación",
  TRUST: "Confianza",
  ALIGNMENT: "Alineación",
  KNOWLEDGE_SHARING: "Intercambio de conocimiento",
  CULTURE: "Cultura",
  LEADERSHIP: "Liderazgo",
  PSYCHOLOGICAL_SAFETY: "Seguridad psicológica",
  COORDINATION: "Coordinación",
  HUMAN_AI_COLLABORATION: "Colaboración humano-IA",
  OTHER: "Otro",
};

export const SIGNAL_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  INVESTIGATING: "Investigando",
  RELEVANT: "Relevante",
  CONTACTED: "Contactado",
  ARCHIVED: "Archivado",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
  PUBLISHED: "Publicado",
  REJECTED: "Rechazado",
  PARTIAL: "Parcial",
};

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  DIRECT: "Directa",
  INDIRECT: "Indirecta",
};

export const EVIDENCE_KIND_LABELS: Record<string, string> = {
  FACT: "Hecho",
  INTERPRETATION: "Interpretación",
  HYPOTHESIS: "Hipótesis",
};

export const RUN_STATUS_LABELS: Record<string, string> = {
  RUNNING: "En ejecución",
  SUCCESS: "Éxito",
  FAILED: "Fallido",
  PARTIAL: "Parcial",
};

export const SCORE_CLASSIFICATION_LABELS: Record<string, string> = {
  Exceptional: "Excepcional",
  Strong: "Fuerte",
  Interesting: "Interesante",
  Archive: "Archivar",
};

function labelFrom(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "—";
  return map[value] ?? value.replaceAll("_", " ");
}

export const painCategoryLabel = (v: string | null | undefined) => labelFrom(PAIN_CATEGORY_LABELS, v);
export const signalStatusLabel = (v: string | null | undefined) => labelFrom(SIGNAL_STATUS_LABELS, v);
export const contentStatusLabel = (v: string | null | undefined) => labelFrom(CONTENT_STATUS_LABELS, v);
export const evidenceTypeLabel = (v: string | null | undefined) => labelFrom(EVIDENCE_TYPE_LABELS, v);
export const evidenceKindLabel = (v: string | null | undefined) => labelFrom(EVIDENCE_KIND_LABELS, v);
export const runStatusLabel = (v: string | null | undefined) => labelFrom(RUN_STATUS_LABELS, v);
export const scoreClassificationLabel = (v: string | null | undefined) => labelFrom(SCORE_CLASSIFICATION_LABELS, v);
