"use client";

import { create } from "zustand";
import { computeBuilderAtsScore } from "@/lib/ats-cv";
import type { CvDocumentPayload, TemplateId, GlobalStyles } from "@/lib/cv-document";
import { defaultContent, type BlockContent, type EducationEntry, type CertificationEntry, type ExperienceEntry, type SkillCategory } from "@/lib/cv-content";

export type BlockTemplate =
  | "profile"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "certifications";

export interface CvBlock {
  id: string;
  template: BlockTemplate;
  hidden: boolean;
  content?: BlockContent;
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b-${Math.random().toString(36).slice(2, 11)}`;
}

function defaultBlocks(): { blockIds: string[]; blocks: Record<string, CvBlock> } {
  const templates: BlockTemplate[] = ["profile", "experience", "skills", "education"];
  const blockIds: string[] = [];
  const blocks: Record<string, CvBlock> = {};
  for (const t of templates) {
    const id = newId();
    blockIds.push(id);
    blocks[id] = { id, template: t, hidden: false, content: defaultContent(t) };
  }
  return { blockIds, blocks };
}

const seed = defaultBlocks();

const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  fontPair: "inter-roboto",
  accentColor: "#1d4ed8",
  density: "normal",
};

function toPayload(
  state: Pick<
    CvBuilderState,
    | "documentId"
    | "blockIds"
    | "blocks"
    | "layout"
    | "stylePreset"
    | "rolePreset"
    | "compactSpacing"
    | "template"
    | "globalStyles"
  >,
): CvDocumentPayload {
  return {
    documentId: state.documentId ?? undefined,
    blockIds: state.blockIds,
    blocks: state.blocks,
    layout: state.layout,
    stylePreset: state.stylePreset,
    rolePreset: state.rolePreset,
    compactSpacing: state.compactSpacing,
    template: state.template,
    globalStyles: state.globalStyles,
  };
}

export interface CvBuilderState extends Omit<CvDocumentPayload, "documentId"> {
  documentId: string | null;
  atsScore: number;
  // Actions
  setLayout: (layout: CvDocumentPayload["layout"]) => void;
  setStylePreset: (p: CvDocumentPayload["stylePreset"]) => void;
  setRolePreset: (p: CvDocumentPayload["rolePreset"]) => void;
  setCompactSpacing: (v: boolean) => void;
  setDocumentId: (id: string | null) => void;
  setTemplate: (t: TemplateId) => void;
  setGlobalStyles: (patch: Partial<GlobalStyles>) => void;
  toggleHidden: (id: string) => void;
  reorderBlocks: (ids: string[]) => void;
  addBlock: (template: BlockTemplate, index?: number) => void;
  removeBlock: (id: string) => void;
  updateBlockContent: (id: string, content: BlockContent) => void;
  hydrateFromDocument: (doc: CvDocumentPayload) => void;
  seedFromProfile: (profile: {
    fullName?: string | null;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    website?: string | null;
    education?: EducationEntry[];
    certifications?: CertificationEntry[];
    experience?: ExperienceEntry[];
    skills?: SkillCategory[];
  }) => void;
  resetToNew: () => void;
  getDocumentPayload: () => CvDocumentPayload;
}

const initialPayload = toPayload({
  documentId: null,
  blockIds: seed.blockIds,
  blocks: seed.blocks,
  layout: "single",
  stylePreset: "executive",
  rolePreset: "technical",
  compactSpacing: false,
  template: "modern-professional",
  globalStyles: DEFAULT_GLOBAL_STYLES,
});

export const useCvBuilderStore = create<CvBuilderState>((set, get) => ({
  documentId: null,
  blockIds: seed.blockIds,
  blocks: seed.blocks,
  layout: "single",
  stylePreset: "executive",
  rolePreset: "technical",
  compactSpacing: false,
  template: "modern-professional",
  globalStyles: DEFAULT_GLOBAL_STYLES,
  atsScore: computeBuilderAtsScore(initialPayload),

  setLayout: (layout) =>
    set((s) => {
      const next = { ...s, layout };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),
  setStylePreset: (stylePreset) =>
    set((s) => {
      const next = { ...s, stylePreset };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),
  setRolePreset: (rolePreset) =>
    set((s) => {
      const next = { ...s, rolePreset };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),
  setCompactSpacing: (compactSpacing) =>
    set((s) => {
      const next = { ...s, compactSpacing };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),
  setDocumentId: (documentId) => set({ documentId }),

  setTemplate: (template) => set({ template }),

  setGlobalStyles: (patch) =>
    set((s) => ({ globalStyles: { ...s.globalStyles, ...patch } })),

  toggleHidden: (id) =>
    set((s) => {
      const b = s.blocks[id];
      if (!b) return s;
      const blocks = { ...s.blocks, [id]: { ...b, hidden: !b.hidden } };
      const next = { ...s, blocks };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),

  reorderBlocks: (blockIds) =>
    set((s) => {
      const next = { ...s, blockIds };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),

  addBlock: (template, index) =>
    set((s) => {
      const id = newId();
      const block: CvBlock = { id, template, hidden: false, content: defaultContent(template) };
      const blockIds = [...s.blockIds];
      const i = index ?? blockIds.length;
      blockIds.splice(i, 0, id);
      const blocks = { ...s.blocks, [id]: block };
      const next = { ...s, blockIds, blocks };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),

  removeBlock: (id) =>
    set((s) => {
      const blockIds = s.blockIds.filter((bid) => bid !== id);
      const { [id]: _removed, ...blocks } = s.blocks;
      const next = { ...s, blockIds, blocks };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),

  updateBlockContent: (id, content) =>
    set((s) => {
      const b = s.blocks[id];
      if (!b) return s;
      return { blocks: { ...s.blocks, [id]: { ...b, content } } };
    }),

  hydrateFromDocument: (doc) =>
    set(() => {
      const blocks: Record<string, CvBlock> = {};
      for (const [bid, block] of Object.entries(doc.blocks)) {
        const b = block as CvBlock;
        blocks[bid] = { ...b, content: b.content ?? defaultContent(b.template) };
      }
      return {
        documentId: doc.documentId ?? null,
        blockIds: doc.blockIds,
        blocks,
        layout: doc.layout,
        stylePreset: doc.stylePreset,
        rolePreset: doc.rolePreset,
        compactSpacing: doc.compactSpacing,
        template: doc.template ?? "modern-professional",
        globalStyles: doc.globalStyles ?? DEFAULT_GLOBAL_STYLES,
        atsScore: computeBuilderAtsScore(doc),
      };
    }),

  seedFromProfile: (profile) =>
    set((s) => {
      const blocks = { ...s.blocks };
      for (const id of s.blockIds) {
        const block = blocks[id];
        if (!block) continue;

        // Profile block — only fill fields that are currently empty in this CV
        if (block.template === "profile" && block.content?.type === "profile") {
          const d = block.content.data;
          blocks[id] = {
            ...block,
            content: {
              type: "profile",
              data: {
                ...d,
                ...(!d.fullName && profile.fullName ? { fullName: profile.fullName } : {}),
                ...(!d.jobTitle && profile.jobTitle ? { jobTitle: profile.jobTitle } : {}),
                ...(!d.email && profile.email ? { email: profile.email } : {}),
                ...(!d.phone && profile.phone ? { phone: profile.phone } : {}),
                ...(!d.location && profile.location ? { location: profile.location } : {}),
                ...(!d.linkedin && profile.linkedin ? { linkedin: profile.linkedin } : {}),
                ...(!d.website && profile.website ? { website: profile.website } : {}),
              },
            },
          };
        }

        // Education block — only seed if the CV block has no entries
        if (
          block.template === "education" &&
          block.content?.type === "education" &&
          block.content.data.length === 0 &&
          Array.isArray(profile.education) &&
          profile.education.length > 0
        ) {
          blocks[id] = { ...block, content: { type: "education", data: profile.education } };
        }

        // Certifications block — only seed if the CV block has no entries
        if (
          block.template === "certifications" &&
          block.content?.type === "certifications" &&
          block.content.data.length === 0 &&
          Array.isArray(profile.certifications) &&
          profile.certifications.length > 0
        ) {
          blocks[id] = { ...block, content: { type: "certifications", data: profile.certifications } };
        }

        // Experience block — only seed if the CV block has no entries
        if (
          block.template === "experience" &&
          block.content?.type === "experience" &&
          block.content.data.length === 0 &&
          Array.isArray(profile.experience) &&
          profile.experience.length > 0
        ) {
          blocks[id] = { ...block, content: { type: "experience", data: profile.experience } };
        }

        // Skills block — only seed if the CV block has no categories
        if (
          block.template === "skills" &&
          block.content?.type === "skills" &&
          block.content.data.length === 0 &&
          Array.isArray(profile.skills) &&
          profile.skills.length > 0
        ) {
          blocks[id] = { ...block, content: { type: "skills", data: profile.skills } };
        }
      }
      const next = { ...s, blocks };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),

  resetToNew: () =>
    set(() => {
      const { blockIds, blocks } = defaultBlocks();
      const next = {
        documentId: null,
        blockIds,
        blocks,
        layout: "single" as CvDocumentPayload["layout"],
        stylePreset: "executive" as CvDocumentPayload["stylePreset"],
        rolePreset: "technical" as CvDocumentPayload["rolePreset"],
        compactSpacing: false,
        template: "modern-professional" as TemplateId,
        globalStyles: DEFAULT_GLOBAL_STYLES,
      };
      return { ...next, atsScore: computeBuilderAtsScore(toPayload(next)) };
    }),

  getDocumentPayload: () => toPayload(get()),
}));
