"use client";

import { useEffect, useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
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
import type { TemplateId, GlobalStyles } from "@/lib/cv-document";
import { CvDocument } from "@/components/cv-render/cv-document";
import { AiTailorDialog } from "./ai-tailor-dialog";
import { ProfileEditor } from "./block-editors/profile-editor";
import { ExperienceEditor } from "./block-editors/experience-editor";
import { SkillsEditor } from "./block-editors/skills-editor";
import { EducationEditor } from "./block-editors/education-editor";
import { ProjectsEditor } from "./block-editors/projects-editor";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCK_TITLES: Record<BlockTemplate, string> = {
  profile: "Profile",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  education: "Education & certifications",
};

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: "modern-professional", label: "Modern Professional", description: "Clean sans-serif, accent colors. Best for tech & startups." },
  { id: "classic-executive", label: "Classic Executive", description: "Serif fonts, centered heading. Best for law, finance, academia." },
  { id: "creative-minimalist", label: "Creative Minimalist", description: "Bold headers, generous whitespace. Best for design & media." },
  { id: "ats-optimized", label: "ATS-Optimized", description: "Plain text, zero graphics. Best for enterprise & large corps." },
  { id: "hybrid-sidebar", label: "Hybrid Sidebar", description: "Left sidebar for skills/contact. Versatile all-rounder." },
];

const FONT_PAIRS: { value: GlobalStyles["fontPair"]; label: string }[] = [
  { value: "inter-roboto", label: "Inter (Modern)" },
  { value: "merriweather-opensans", label: "Merriweather (Classic)" },
  { value: "playfair-lato", label: "Playfair Display (Premium)" },
];

type Tab = "content" | "design" | "match";

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

      {expanded && !block.hidden && (
        <>
          {block.template === "profile" && <ProfileEditor blockId={id} />}
          {block.template === "experience" && <ExperienceEditor blockId={id} />}
          {block.template === "skills" && <SkillsEditor blockId={id} />}
          {block.template === "education" && <EducationEditor blockId={id} />}
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

  // Template & styles
  const template = useCvBuilderStore((s) => s.template);
  const globalStyles = useCvBuilderStore((s) => s.globalStyles);
  const setTemplate = useCvBuilderStore((s) => s.setTemplate);
  const setGlobalStyles = useCvBuilderStore((s) => s.setGlobalStyles);

  useCvAutoSave();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ id: string; name: string; updatedAt: string }[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState("Master CV");
  const [busy, setBusy] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("content");

  // Job Match state
  const [jdText, setJdText] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ matched: string[]; missing: string[] } | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Live preview payload (reactive — reads entire store on each render)
  const livePayload = useCvBuilderStore((s) => s.getDocumentPayload)();

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

  async function refreshDocs(nextSelectId?: string) {
    const res = await fetch("/api/cv", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: { id: string; name: string; updatedAt: string }[] };
    setDocs(data.items);
    const stored = typeof window !== "undefined" ? localStorage.getItem("cv-document-id") : null;
    const candidate = nextSelectId ?? stored ?? data.items[0]?.id ?? null;
    if (candidate) setSelectedDocId(candidate);
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
  }

  useEffect(() => { void refreshDocs(); }, []);
  useEffect(() => {
    if (!selectedDocId) return;
    if (selectedDocId === documentId && loadedOnce) return;
    void loadDoc(selectedDocId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId]);

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
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
          <select
            className="h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
            value={selectedDocId ?? ""}
            onChange={(e) => setSelectedDocId(e.target.value)}
            disabled={!docs.length}
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <Input value={docName} onChange={(e) => setDocName(e.target.value)} className="h-9 w-[180px]" placeholder="CV name" />
          <Button type="button" variant="secondary" size="sm" disabled={busy || !selectedDocId} onClick={async () => {
            if (!selectedDocId) return;
            setBusy(true);
            await fetch(`/api/cv/${selectedDocId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: docName, document: getDocumentPayload() }) }).catch(() => {});
            await refreshDocs(selectedDocId);
            setBusy(false);
          }}>Save</Button>
          {selectedDocId ? (
            <Button variant="secondary" size="sm" asChild>
              <a href={`/cv/${selectedDocId}/print`} target="_blank" rel="noreferrer">Export / Print</a>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled>Export / Print</Button>
          )}
          <AiTailorDialog documentId={selectedDocId} />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={async () => {
            setBusy(true);
            const res = await fetch("/api/cv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "New CV", document: getDocumentPayload() }) }).catch(() => null);
            if (res && (res as Response).ok) {
              const data = (await (res as Response).json()) as { documentId: string };
              await refreshDocs(data.documentId);
              await loadDoc(data.documentId);
            } else { await refreshDocs(); }
            setBusy(false);
          }}>New</Button>
          <Button type="button" variant="ghost" size="sm" disabled={busy || !selectedDocId} onClick={async () => {
            if (!selectedDocId) return;
            setBusy(true);
            await fetch(`/api/cv/${selectedDocId}`, { method: "DELETE" }).catch(() => {});
            localStorage.removeItem("cv-document-id");
            await refreshDocs();
            setBusy(false);
          }}>Delete</Button>
          <div className="ml-auto">
            <AtsScoreBar score={atsScore} label="CV Strength" />
          </div>
        </div>

        {/* ── Dual Pane ── */}
        <div className="flex gap-5 lg:items-start">
          {/* Left pane */}
          <div className="w-full shrink-0 lg:w-[420px] lg:overflow-y-auto lg:max-h-[calc(100vh-160px)]">
            {/* Tabs */}
            <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-1 mb-4">
              {(["content", "design", "match"] as Tab[]).map((t) => (
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
                  {t === "match" ? "Job Match" : t.charAt(0).toUpperCase() + t.slice(1)}
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
                        {t.id === "hybrid-sidebar" && (
                          <p className="mt-1 text-[10px] text-amber-400">⚠ ATS parsers may misread two-column layouts</p>
                        )}
                      </button>
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
