"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runBoth, runContent, runPainResearch, runBioAdaptabilityAgent } from "@/lib/agents/runner";
import type { BioStatus, ContentStatus, SignalStatus } from "@prisma/client";

export async function triggerRunAll() {
  const outcome = await runBoth();
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/signals");
  revalidatePath("/patterns");
  revalidatePath("/adaptability");
  revalidatePath("/adaptability/patterns");
  revalidatePath("/history");
  return outcome;
}

export async function triggerBioAdaptability() {
  const outcome = await runBioAdaptabilityAgent();
  revalidatePath("/");
  revalidatePath("/adaptability");
  revalidatePath("/adaptability/patterns");
  revalidatePath("/history");
  return outcome;
}

export async function triggerContentAgent() {
  const outcome = await runContent();
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/history");
  return outcome;
}

export async function triggerPainResearch() {
  const outcome = await runPainResearch();
  revalidatePath("/");
  revalidatePath("/signals");
  revalidatePath("/patterns");
  revalidatePath("/history");
  return outcome;
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  await prisma.contentItem.update({ where: { id }, data: { status } });
  revalidatePath("/content");
  revalidatePath("/");
}

export async function editContent(
  id: string,
  fields: Partial<{
    mainIdea: string;
    whyItMatters: string;
    businessImplication: string;
    linkedinPost: string;
  }>
) {
  await prisma.contentItem.update({ where: { id }, data: fields });
  revalidatePath("/content");
}

export async function updateSignalStatus(id: string, status: SignalStatus) {
  await prisma.signal.update({ where: { id }, data: { status } });
  revalidatePath("/signals");
  revalidatePath(`/signals/${id}`);
}

export async function updateBioFindingStatus(id: string, status: BioStatus) {
  await prisma.bioFinding.update({ where: { id }, data: { status } });
  revalidatePath("/adaptability");
  revalidatePath(`/adaptability/${id}`);
}
