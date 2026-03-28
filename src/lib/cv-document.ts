import { z } from "zod";
import { blockContentSchema } from "./cv-content";

export const blockTemplateSchema = z.enum([
  "profile",
  "experience",
  "skills",
  "projects",
  "education",
]);

export const cvBlockSchema = z.object({
  id: z.string(),
  template: blockTemplateSchema,
  hidden: z.boolean(),
  content: blockContentSchema.optional(),
});

export const templateIdSchema = z.enum([
  "modern-professional",
  "classic-executive",
  "creative-minimalist",
  "ats-optimized",
  "hybrid-sidebar",
]);

export const globalStylesSchema = z.object({
  fontPair: z.enum(["inter-roboto", "merriweather-opensans", "playfair-lato"]).default("inter-roboto"),
  accentColor: z.string().default("#1d4ed8"),
  density: z.enum(["compact", "normal", "spacious"]).default("normal"),
});

export const cvDocumentSchema = z.object({
  documentId: z.string().optional(),
  blockIds: z.array(z.string()),
  blocks: z.record(z.string(), cvBlockSchema),
  // Legacy fields — kept for ATS score calculation and backwards compat
  layout: z.enum(["single", "two-column"]).default("single"),
  stylePreset: z.enum(["executive", "creative", "minimal"]).default("executive"),
  rolePreset: z.enum(["technical", "graduate", "executive"]).default("technical"),
  compactSpacing: z.boolean().default(false),
  // New template system
  template: templateIdSchema.default("modern-professional"),
  globalStyles: globalStylesSchema.default({ fontPair: "inter-roboto", accentColor: "#1d4ed8", density: "normal" }),
});

export type CvDocumentPayload = z.infer<typeof cvDocumentSchema>;
export type TemplateId = z.infer<typeof templateIdSchema>;
export type GlobalStyles = z.infer<typeof globalStylesSchema>;
