"use client";

import { create } from "zustand";
import { computeBuilderAtsScore } from "@/lib/ats-cv";
import type { CvDocumentPayload, TemplateId, GlobalStyles } from "@/lib/cv-document";
import { defaultContent, type BlockContent } from "@/lib/cv-content";

export type BlockTemplate =
  | "profile"
  | "experience"
  | "skills"
  | "projects"
  | "education";

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

  getDocumentPayload: () => toPayload(get()),
}));
