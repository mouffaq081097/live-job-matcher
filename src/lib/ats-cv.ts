import type { CvDocumentPayload } from "./cv-document";

export function computeBuilderAtsScore(doc: CvDocumentPayload): number {
  let score = 42;
  const visible = doc.blockIds.filter((id) => !doc.blocks[id]?.hidden);
  score += Math.min(visible.length * 6, 24);

  const order = doc.blockIds.map((id) => doc.blocks[id]?.template).filter(Boolean);
  const idx = (t: string) => order.indexOf(t as never);

  if (doc.rolePreset === "technical") {
    if (idx("skills") >= 0 && idx("skills") <= 2) score += 12;
    if (idx("education") >= 0 && idx("education") <= 2) score += 8;
  }
  if (doc.rolePreset === "graduate") {
    if (idx("education") >= 0 && idx("education") <= 1) score += 14;
  }
  if (doc.rolePreset === "executive") {
    if (idx("experience") >= 0 && idx("experience") <= 1) score += 12;
    if (idx("profile") === 0) score += 6;
  }

  if (doc.layout === "two-column") score += 4;
  if (doc.stylePreset === "executive") score += 3;
  if (doc.compactSpacing) score += 2;

  return Math.min(98, Math.round(score));
}
