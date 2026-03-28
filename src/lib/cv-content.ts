import { z } from "zod";

// ── Per-block content schemas ─────────────────────────────────────────────────

export const profileContentSchema = z.object({
  fullName: z.string().default(""),
  jobTitle: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  website: z.string().default(""),
  summary: z.string().default(""),
});

export const experienceEntrySchema = z.object({
  id: z.string(),
  company: z.string().default(""),
  title: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const skillCategorySchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  skills: z.array(z.string()).default([]),
});

export const educationEntrySchema = z.object({
  id: z.string(),
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  gpa: z.string().default(""),
});

export const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  url: z.string().default(""),
  description: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

// Discriminated union keyed on template name
export const blockContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("profile"), data: profileContentSchema }),
  z.object({ type: z.literal("experience"), data: z.array(experienceEntrySchema) }),
  z.object({ type: z.literal("skills"), data: z.array(skillCategorySchema) }),
  z.object({ type: z.literal("education"), data: z.array(educationEntrySchema) }),
  z.object({ type: z.literal("projects"), data: z.array(projectEntrySchema) }),
]);

// ── TypeScript types ──────────────────────────────────────────────────────────

export type ProfileContent = z.infer<typeof profileContentSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type BlockContent = z.infer<typeof blockContentSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function newEntryId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `e-${Math.random().toString(36).slice(2, 11)}`;
}

export function defaultContent(
  template: "profile" | "experience" | "skills" | "projects" | "education",
): BlockContent {
  switch (template) {
    case "profile":
      return {
        type: "profile",
        data: {
          fullName: "",
          jobTitle: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          website: "",
          summary: "",
        },
      };
    case "experience":
      return { type: "experience", data: [] };
    case "skills":
      return { type: "skills", data: [] };
    case "education":
      return { type: "education", data: [] };
    case "projects":
      return { type: "projects", data: [] };
  }
}
