"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Loader2,
  MoreHorizontal,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AtsScoreBar } from "@/components/optimize/ats-score-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCvAutoSave } from "@/hooks/use-cv-auto-save";
import { cn } from "@/lib/utils";
import { cvDocumentToText } from "@/lib/cv-to-text";
import {
  type BlockTemplate,
  useCvBuilderStore,
} from "@/stores/cv-builder-store";
import type { TemplateId, GlobalStyles, CvDocumentPayload } from "@/lib/cv-document";
import { useShallow } from "zustand/react/shallow";
import { CvDocument } from "@/components/cv-render/cv-document";
import { AiTailorDialog } from "./ai-tailor-dialog";
import { ProfileEditor } from "./block-editors/profile-editor";
import { ExperienceEditor } from "./block-editors/experience-editor";
import { SkillsEditor } from "./block-editors/skills-editor";
import { EducationEditor } from "./block-editors/education-editor";
import { ProjectsEditor } from "./block-editors/projects-editor";
import { CertificationsEditor } from "./block-editors/certifications-editor";
import type { CvBlock } from "@/stores/cv-builder-store";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCK_TITLES: Record<BlockTemplate, string> = {
  profile: "Profile",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
};

const TEMPLATES: { id: TemplateId; label: string; description: string; premium?: boolean }[] = [
  { id: "modern-professional", label: "Modern Professional", description: "Clean sans-serif, accent colors. Best for tech & startups." },
  { id: "classic-executive", label: "Classic Executive", description: "Serif fonts, centered heading. Best for law, finance, academia." },
  { id: "creative-minimalist", label: "Creative Minimalist", description: "Bold headers, generous whitespace. Best for design & media." },
  { id: "ats-optimized", label: "ATS-Optimized", description: "Plain text, zero graphics. Best for enterprise & large corps." },
  { id: "hybrid-sidebar", label: "Hybrid Sidebar", description: "Left sidebar for skills/contact. Versatile all-rounder.", premium: true },
];

const FONT_PAIRS: { value: GlobalStyles["fontPair"]; label: string }[] = [
  { value: "inter-roboto", label: "Inter (Modern)" },
  { value: "merriweather-opensans", label: "Merriweather (Classic)" },
  { value: "playfair-lato", label: "Playfair Display (Premium)" },
];

type Tab = "content" | "design" | "match" | "cvs";

// ── BlockContentPreview ───────────────────────────────────────────────────────
// Shows actual CV data in the collapsed block row (WYSIWYG feel)

function BlockContentPreview({ block }: { block: CvBlock }) {
  const c = block.content;
  if (!c) return null;

  if (c.type === "profile") {
    const p = c.data;
    const name = p.fullName || null;
    const sub = [p.jobTitle, p.email, p.location].filter(Boolean).join(" · ");
    if (!name && !sub) return null;
    return (
      <div className="mt-1 pl-7">
        {name && <p className="text-[12px] font-semibold text-slate-700 dark:text-zinc-200 leading-tight">{name}</p>}
        {sub && <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{sub}</p>}
      </div>
    );
  }

  if (c.type === "experience") {
    const entries = c.data;
    if (!entries.length) return <p className="mt-1 pl-7 text-[11px] text-zinc-500 italic">No positions yet</p>;
    return (
      <div className="mt-1 pl-7 space-y-0.5">
        {entries.slice(0, 2).map((e) => (
          <div key={e.id} className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] text-zinc-300 truncate">{[e.title, e.company].filter(Boolean).join(" · ") || "Untitled"}</span>
            {(e.startDate || e.endDate) && <span className="shrink-0 text-[10px] text-zinc-500">{e.startDate}{(e.endDate || e.isCurrent) ? `–${e.isCurrent ? "Now" : e.endDate}` : ""}</span>}
          </div>
        ))}
        {entries.length > 2 && <p className="text-[10px] text-zinc-500">+{entries.length - 2} more</p>}
      </div>
    );
  }

  if (c.type === "skills") {
    const allSkills = c.data.flatMap((cat) => cat.skills).slice(0, 7);
    if (!allSkills.length) return <p className="mt-1 pl-7 text-[11px] text-zinc-500 italic">No skills yet</p>;
    return (
      <div className="mt-1 pl-7 flex flex-wrap gap-1">
        {allSkills.map((s) => (
          <span key={s} className="rounded-full bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-[10px] text-slate-600 dark:text-zinc-300">{s}</span>
        ))}
        {c.data.flatMap((cat) => cat.skills).length > 7 && <span className="text-[10px] text-zinc-500">+more</span>}
      </div>
    );
  }

  if (c.type === "education") {
    const entries = c.data;
    if (!entries.length) return <p className="mt-1 pl-7 text-[11px] text-zinc-500 italic">No entries yet</p>;
    return (
      <div className="mt-1 pl-7 space-y-0.5">
        {entries.slice(0, 2).map((e) => (
          <div key={e.id} className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] text-zinc-300 truncate">{[e.degree, e.field].filter(Boolean).join(" in ") || e.institution || "Untitled"}</span>
            {(e.endDate || e.startDate) && <span className="shrink-0 text-[10px] text-zinc-500">{e.endDate || e.startDate}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (c.type === "certifications") {
    const entries = c.data;
    if (!entries.length) return <p className="mt-1 pl-7 text-[11px] text-zinc-500 italic">No certifications yet</p>;
    return (
      <div className="mt-1 pl-7 space-y-0.5">
        {entries.slice(0, 2).map((e) => (
          <div key={e.id} className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] text-zinc-300 truncate">{e.name || "Untitled"}</span>
            {e.issuer && <span className="shrink-0 text-[10px] text-zinc-500">{e.issuer}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (c.type === "projects") {
    const entries = c.data;
    if (!entries.length) return <p className="mt-1 pl-7 text-[11px] text-zinc-500 italic">No projects yet</p>;
    return (
      <div className="mt-1 pl-7 space-y-0.5">
        {entries.slice(0, 2).map((e) => (
          <p key={e.id} className="text-[11px] text-zinc-300 truncate">{e.name || "Untitled"}</p>
        ))}
      </div>
    );
  }

  return null;
}

// ── SortableBlockRow ──────────────────────────────────────────────────────────

function SortableBlockRow({ id }: { id: string }) {
  const block = useCvBuilderStore((s) => s.blocks[id]);
  const toggleHidden = useCvBuilderStore((s) => s.toggleHidden);
  const removeBlock = useCvBuilderStore((s) => s.removeBlock);
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  if (!block) return null;

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] p-3",
        isDragging && "z-10 opacity-90 ring-2 ring-blue-500/40",
        block.hidden && "opacity-40",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="shrink-0 rounded-lg p-1 text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((v) => !v)}>
          <p className="font-medium text-slate-800 dark:text-zinc-100">{BLOCK_TITLES[block.template]}</p>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Collapse" : "Edit"}>
            {expanded ? <ChevronUp className="h-4 w-4 text-slate-500 dark:text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-slate-500 dark:text-zinc-400" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleHidden(id)} aria-label={block.hidden ? "Show" : "Hide"}>
            {block.hidden ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-slate-500 dark:text-zinc-400" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-red-400" onClick={() => removeBlock(id)} aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!expanded && !block.hidden && <BlockContentPreview block={block} />}

      {expanded && !block.hidden && (
        <>
          {block.template === "profile" && <ProfileEditor blockId={id} />}
          {block.template === "experience" && <ExperienceEditor blockId={id} />}
          {block.template === "skills" && <SkillsEditor blockId={id} />}
          {block.template === "education" && <EducationEditor blockId={id} />}
          {block.template === "certifications" && <CertificationsEditor blockId={id} />}
          {block.template === "projects" && <ProjectsEditor blockId={id} />}
        </>
      )}
      {expanded && block.hidden && (
        <p className="mt-2 text-xs text-zinc-500">Unhide this section to edit its content.</p>
      )}
    </div>
  );
}

// ── AddSectionMenu ────────────────────────────────────────────────────────────

const LIBRARY: { template: BlockTemplate; label: string }[] = [
  { template: "profile", label: "Profile" },
  { template: "experience", label: "Experience" },
  { template: "skills", label: "Skills" },
  { template: "projects", label: "Projects" },
  { template: "education", label: "Education" },
  { template: "certifications", label: "Certifications" },
];

function AddSectionMenu() {
  const addBlock = useCvBuilderStore((s) => s.addBlock);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setOpen((v) => !v)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add section
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 z-20 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1929] shadow-xl p-1">
          {LIBRARY.map((item) => (
            <button
              key={item.template}
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={() => { addBlock(item.template); setOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Workspace ────────────────────────────────────────────────────────────

export function CvBuilderWorkspace() {
  const documentId = useCvBuilderStore((s) => s.documentId);
  const setDocumentId = useCvBuilderStore((s) => s.setDocumentId);
  const hydrateFromDocument = useCvBuilderStore((s) => s.hydrateFromDocument);
  const getDocumentPayload = useCvBuilderStore((s) => s.getDocumentPayload);
  const blockIds = useCvBuilderStore((s) => s.blockIds);
  const atsScore = useCvBuilderStore((s) => s.atsScore);
  const reorderBlocks = useCvBuilderStore((s) => s.reorderBlocks);
  const seedFromProfile = useCvBuilderStore((s) => s.seedFromProfile);
  const resetToNew = useCvBuilderStore((s) => s.resetToNew);

  // Template & styles
  const template = useCvBuilderStore((s) => s.template);
  const globalStyles = useCvBuilderStore((s) => s.globalStyles);
  const setTemplate = useCvBuilderStore((s) => s.setTemplate);
  const setGlobalStyles = useCvBuilderStore((s) => s.setGlobalStyles);

  useCvAutoSave();

  // Cached user profile for pre-populating new CVs
  const savedProfileRef = useRef<Parameters<typeof seedFromProfile>[0] | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ id: string; name: string; updatedAt: string }[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState("Master CV");
  const [busy, setBusy] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  useEffect(() => {
    if (!showMoreMenu) return;
    const handler = () => setShowMoreMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showMoreMenu]);

  // Job Match state
  const [jdText, setJdText] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ matched: string[]; missing: string[] } | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // AI CV quality analysis
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Live preview payload — useShallow memoises the result so the reference is
  // stable when nothing changed, avoiding useSyncExternalStore infinite loops.
  const livePayload = useCvBuilderStore(
    useShallow((s): CvDocumentPayload => ({
      documentId: s.documentId ?? undefined,
      blockIds: s.blockIds,
      blocks: s.blocks,
      layout: s.layout,
      stylePreset: s.stylePreset,
      rolePreset: s.rolePreset,
      compactSpacing: s.compactSpacing,
      template: s.template,
      globalStyles: s.globalStyles,
    })),
  );

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blockIds.indexOf(String(active.id));
    const newIndex = blockIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderBlocks(arrayMove(blockIds, oldIndex, newIndex));
  }

  async function refreshDocs(nextSelectId?: string): Promise<number> {
    const res = await fetch("/api/cv", { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { items: { id: string; name: string; updatedAt: string }[] };
    setDocs(data.items);
    const stored = typeof window !== "undefined" ? localStorage.getItem("cv-document-id") : null;
    const candidate = nextSelectId ?? stored ?? data.items[0]?.id ?? null;
    if (candidate) setSelectedDocId(candidate);
    return data.items.length;
  }

  async function loadDoc(id: string) {
    const res = await fetch(`/api/cv/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { item: { id: string; name: string; payload: unknown } };
    hydrateFromDocument(data.item.payload as Parameters<typeof hydrateFromDocument>[0]);
    setDocumentId(data.item.id);
    setSelectedDocId(data.item.id);
    setDocName(data.item.name);
    localStorage.setItem("cv-document-id", data.item.id);
    setLoadedOnce(true);
    // After hydrating, fill any empty blocks from the saved profile
    if (savedProfileRef.current) seedFromProfile(savedProfileRef.current);
  }

  useEffect(() => {
    void (async () => {
      const [count, profileRes] = await Promise.all([
        refreshDocs(),
        fetch("/api/profile").then((r) => r.json()).catch(() => null) as Promise<{ profile: Parameters<typeof seedFromProfile>[0] | null } | null>,
      ]);
      if (profileRes?.profile) {
        savedProfileRef.current = profileRes.profile;
        // Seed into blank default state (no docs) OR will be applied after loadDoc fires
        if (count === 0) seedFromProfile(profileRes.profile);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDocId) return;
    if (selectedDocId === documentId && loadedOnce) return;
    void loadDoc(selectedDocId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId]);

  async function handleNewCv() {
    setBusy(true);
    // Start with fresh defaults seeded with saved profile data
    resetToNew();
    if (savedProfileRef.current) seedFromProfile(savedProfileRef.current);
    const res = await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New CV", document: getDocumentPayload() }),
    }).catch(() => null);
    if (res && (res as Response).ok) {
      const data = (await (res as Response).json()) as { documentId: string };
      await refreshDocs(data.documentId);
      await loadDoc(data.documentId);
    } else { await refreshDocs(); }
    setBusy(false);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const cvText = cvDocumentToText(getDocumentPayload());
      const res = await fetch("/api/ai/cv-strength", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });
      const data = (await res.json()) as { score?: number; suggestions?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAiScore(data.score ?? 0);
      setAiSuggestions(data.suggestions ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleMatchKeywords() {
    if (!jdText.trim()) return;
    setMatchLoading(true);
    setMatchResult(null);
    setMatchError(null);
    try {
      const cvText = cvDocumentToText(getDocumentPayload());
      const res = await fetch("/api/ai/match-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jobDescription: jdText }),
      });
      const data = (await res.json()) as { matched?: string[]; missing?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setMatchResult({ matched: data.matched ?? [], missing: data.missing ?? [] });
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Failed");
    } finally {
      setMatchLoading(false);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4">
        {/* ── Top Toolbar ── */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3 space-y-2">
          {/* Row 1 — document identity + primary actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* CV selector + rename */}
            <select
              className="h-9 max-w-[160px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
              value={selectedDocId ?? ""}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={!docs.length}
              title="Switch CV"
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="h-9 w-[140px] text-sm"
              placeholder="CV name"
              title="Rename this CV"
            />

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10" />

            {/* Save */}
            <Button
              type="button"
              size="sm"
              disabled={busy || !selectedDocId}
              onClick={async () => {
                if (!selectedDocId) return;
                setBusy(true);
                await fetch(`/api/cv/${selectedDocId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: docName, document: getDocumentPayload() }) }).catch(() => {});
                await refreshDocs(selectedDocId);
                setBusy(false);
                toast.success("CV saved");
              }}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              Save
            </Button>

            {/* Export / Print */}
            {selectedDocId ? (
              <Button variant="secondary" size="sm" asChild>
                <a href={`/cv/${selectedDocId}/print`} target="_blank" rel="noreferrer">
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Export / Print
                </a>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Export / Print
              </Button>
            )}

            {/* AI Tailor */}
            <AiTailorDialog
              documentId={selectedDocId}
              onCreated={(newDocId, cvName) => {
                setDocumentId(newDocId);
                setSelectedDocId(newDocId);
                setDocName(cvName);
                void refreshDocs(newDocId);
              }}
            />

            {/* More: New CV / Delete CV */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                title="More options"
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu((v) => !v); }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMoreMenu && (
                <div className="absolute top-full left-0 mt-1 z-30 w-44 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1929] shadow-xl p-1">
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2"
                    onClick={() => { setShowMoreMenu(false); void handleNewCv(); }}
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-400" />
                    New CV
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDocId || busy}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 disabled:opacity-40"
                    onClick={async () => {
                      if (!selectedDocId) return;
                      setShowMoreMenu(false);
                      setBusy(true);
                      await fetch(`/api/cv/${selectedDocId}`, { method: "DELETE" }).catch(() => {});
                      localStorage.removeItem("cv-document-id");
                      await refreshDocs();
                      setBusy(false);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete this CV
                  </button>
                </div>
              )}
            </div>

            {/* AI score — right-aligned */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                disabled={analyzing}
                onClick={() => void handleAnalyze()}
              >
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {analyzing ? "Analysing…" : aiScore !== null ? "Re-analyse" : "AI Score"}
              </Button>
              <AtsScoreBar
                score={aiScore ?? atsScore}
                label={aiScore !== null ? "AI Quality" : "CV Strength"}
              />
            </div>
          </div>
        </div>

        {/* ── Dual Pane ── */}
        <div className="flex gap-5 lg:items-start">
          {/* Left pane */}
          <div className="w-full shrink-0 lg:w-[420px] lg:overflow-y-auto lg:max-h-[calc(100vh-160px)]">
            {/* Tabs */}
            <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-1 mb-4">
              {(["content", "design", "match", "cvs"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors",
                    activeTab === t
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200",
                  )}
                >
                  {t === "match" ? "Job Match" : t === "cvs" ? "My CVs" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Content Tab ── */}
            {activeTab === "content" && (
              <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {blockIds.map((id) => (
                    <SortableBlockRow key={id} id={id} />
                  ))}
                  {blockIds.length === 0 && (
                    <p className="py-8 text-center text-sm text-zinc-500">No sections yet. Add one below.</p>
                  )}
                  <AddSectionMenu />
                  {aiSuggestions.length > 0 && (
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> AI Suggestions
                      </p>
                      <ul className="space-y-1">
                        {aiSuggestions.map((s, i) => (
                          <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-zinc-300">
                            <span className="mt-0.5 shrink-0 text-blue-400">·</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="text-[10px] text-zinc-500 hover:text-zinc-400"
                        onClick={() => { setAiSuggestions([]); setAiScore(null); }}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </SortableContext>
            )}

            {/* ── Design Tab ── */}
            {activeTab === "design" && (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Template</p>
                  <div className="space-y-2">
                    {TEMPLATES.map((t) => (
                      t.premium ? (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toast("Upgrade to Pro to unlock this template")}
                          className="w-full rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-left relative overflow-hidden cursor-default"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">{t.label}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>
                              <p className="mt-1 text-[10px] text-amber-400">⚠ ATS parsers may misread two-column layouts</p>
                            </div>
                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-400/30">
                              <Lock className="h-2.5 w-2.5" /> PRO
                            </span>
                          </div>
                        </button>
                      ) : (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTemplate(t.id)}
                          className={cn(
                            "w-full rounded-xl border p-3 text-left transition-colors",
                            template === t.id
                              ? "border-blue-500/60 bg-blue-500/10"
                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06]",
                          )}
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">{t.label}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>
                        </button>
                      )
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Font pair</p>
                  <select
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none"
                    value={globalStyles.fontPair}
                    onChange={(e) => setGlobalStyles({ fontPair: e.target.value as GlobalStyles["fontPair"] })}
                  >
                    {FONT_PAIRS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Accent color</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={globalStyles.accentColor}
                      onChange={(e) => setGlobalStyles({ accentColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 bg-transparent p-0.5"
                    />
                    <Input
                      value={globalStyles.accentColor}
                      onChange={(e) => setGlobalStyles({ accentColor: e.target.value })}
                      className="h-9 w-32 font-mono text-sm"
                      placeholder="#1d4ed8"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Density</p>
                  <div className="flex gap-2">
                    {(["compact", "normal", "spacious"] as GlobalStyles["density"][]).map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={globalStyles.density === d ? "default" : "outline"}
                        className="flex-1 text-xs capitalize"
                        onClick={() => setGlobalStyles({ density: d })}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── My CVs Tab ── */}
            {activeTab === "cvs" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Your saved CVs</p>
                {docs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">No CVs saved yet. Use "Save" to save your first CV.</p>
                ) : (
                  docs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDocId(d.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        selectedDocId === d.id
                          ? "border-blue-500/60 bg-blue-500/10"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06]",
                      )}
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">{d.name}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        Last updated {new Date(d.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </button>
                  ))
                )}
                <button
                  type="button"
                  className="w-full rounded-xl border border-dashed border-slate-300 dark:border-white/10 py-3 text-xs text-zinc-500 hover:border-blue-400 hover:text-blue-400 transition-colors"
                  onClick={() => void handleNewCv()}
                >
                  + New CV
                </button>
              </div>
            )}

            {/* ── Job Match Tab ── */}
            {activeTab === "match" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Paste job description</p>
                  <Textarea
                    className="min-h-[180px] resize-y text-sm"
                    placeholder="Paste the full job description here…"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void handleMatchKeywords()}
                  disabled={matchLoading || !jdText.trim()}
                >
                  {matchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {matchLoading ? "Analysing…" : "Analyse keywords"}
                </Button>

                {matchError && (
                  <p className="text-xs text-red-400">{matchError}</p>
                )}

                {matchResult && (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-emerald-400">Found in your CV ({matchResult.matched.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.matched.map((k) => (
                          <span key={k} className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/25">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-red-400">Missing from your CV ({matchResult.missing.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.missing.map((k) => (
                          <span key={k} className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-medium text-red-300 ring-1 ring-red-500/25">{k}</span>
                        ))}
                      </div>
                    </div>
                    <Button type="button" variant="secondary" size="sm" className="w-full text-xs" asChild>
                      <Link href="/optimize">Open full ATS optimizer →</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right pane — Live Preview */}
          <div className="hidden lg:block flex-1 overflow-y-auto max-h-[calc(100vh-160px)] rounded-xl bg-slate-200 dark:bg-zinc-950 p-4">
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Live Preview</p>
            <CvDocument payload={livePayload} />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0b1120]/95 p-3 shadow-xl">
            <p className="text-xs text-slate-500 dark:text-zinc-400">Moving section…</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
