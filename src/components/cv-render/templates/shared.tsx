/**
 * Shared helpers used by all CV templates.
 * Keeps each template file focused on layout/style only.
 */
import type { CvDocumentPayload } from "@/lib/cv-document";
import type { CvBlock } from "@/stores/cv-builder-store";
import { defaultContent } from "@/lib/cv-content";
import type {
  ProfileContent,
  ExperienceEntry,
  SkillCategory,
  EducationEntry,
  ProjectEntry,
} from "@/lib/cv-content";

// ── Data extraction helpers ───────────────────────────────────────────────────

export function getProfile(payload: CvDocumentPayload): ProfileContent | null {
  for (const id of payload.blockIds) {
    const block = payload.blocks[id] as CvBlock | undefined;
    if (!block || block.hidden || block.template !== "profile") continue;
    const content = block.content ?? defaultContent("profile");
    if (content.type === "profile") return content.data;
  }
  return null;
}

export function getExperience(payload: CvDocumentPayload): ExperienceEntry[] {
  for (const id of payload.blockIds) {
    const block = payload.blocks[id] as CvBlock | undefined;
    if (!block || block.hidden || block.template !== "experience") continue;
    const content = block.content ?? defaultContent("experience");
    if (content.type === "experience") return content.data;
  }
  return [];
}

export function getSkills(payload: CvDocumentPayload): SkillCategory[] {
  for (const id of payload.blockIds) {
    const block = payload.blocks[id] as CvBlock | undefined;
    if (!block || block.hidden || block.template !== "skills") continue;
    const content = block.content ?? defaultContent("skills");
    if (content.type === "skills") return content.data;
  }
  return [];
}

export function getEducation(payload: CvDocumentPayload): EducationEntry[] {
  for (const id of payload.blockIds) {
    const block = payload.blocks[id] as CvBlock | undefined;
    if (!block || block.hidden || block.template !== "education") continue;
    const content = block.content ?? defaultContent("education");
    if (content.type === "education") return content.data;
  }
  return [];
}

export function getProjects(payload: CvDocumentPayload): ProjectEntry[] {
  for (const id of payload.blockIds) {
    const block = payload.blocks[id] as CvBlock | undefined;
    if (!block || block.hidden || block.template !== "projects") continue;
    const content = block.content ?? defaultContent("projects");
    if (content.type === "projects") return content.data;
  }
  return [];
}

export function formatDates(start: string, end: string, isCurrent: boolean) {
  return [start, isCurrent ? "Present" : end].filter(Boolean).join(" – ");
}

// Font family strings for inline styles
export const fontFamilies: Record<string, { heading: string; body: string }> = {
  "inter-roboto": {
    heading: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    body: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  "merriweather-opensans": {
    heading: "var(--font-merriweather), Georgia, serif",
    body: "var(--font-open-sans), ui-sans-serif, system-ui, sans-serif",
  },
  "playfair-lato": {
    heading: "var(--font-playfair), Georgia, serif",
    body: "var(--font-lato), ui-sans-serif, system-ui, sans-serif",
  },
};

export const densityClasses: Record<string, string> = {
  compact: "leading-snug",
  normal: "leading-normal",
  spacious: "leading-relaxed",
};

export const densitySpacing: Record<string, string> = {
  compact: "mb-3",
  normal: "mb-5",
  spacious: "mb-7",
};
