"use client";

import { useState } from "react";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { newEntryId, type ExperienceEntry } from "@/lib/cv-content";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

type EnhancingState = {
  entryId: string;
  bulletIdx: number;
  enhanced: string;
} | null;

function newEntry(): ExperienceEntry {
  return { id: newEntryId(), company: "", title: "", location: "", startDate: "", endDate: "", isCurrent: false, bullets: [""] };
}

export function ExperienceEditor({ blockId }: { blockId: string }) {
  const block = useCvBuilderStore((s) => s.blocks[blockId]);
  const updateBlockContent = useCvBuilderStore((s) => s.updateBlockContent);
  const [enhancingKey, setEnhancingKey] = useState<string | null>(null);
  const [enhancingState, setEnhancingState] = useState<EnhancingState>(null);

  if (!block || block.content?.type !== "experience") return null;
  const entries = block.content.data;

  function setEntries(next: ExperienceEntry[]) {
    updateBlockContent(blockId, { type: "experience", data: next });
  }
  function updateEntry(id: string, patch: Partial<ExperienceEntry>) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEntry(id: string) { setEntries(entries.filter((e) => e.id !== id)); }
  function addBullet(entryId: string) {
    updateEntry(entryId, { bullets: [...(entries.find((e) => e.id === entryId)?.bullets ?? []), ""] });
  }
  function updateBullet(entryId: string, idx: number, value: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.map((b, i) => (i === idx ? value : b)) });
  }
  function removeBullet(entryId: string, idx: number) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.filter((_, i) => i !== idx) });
  }

  async function handleEnhanceBullet(entry: ExperienceEntry, idx: number) {
    const bullet = entry.bullets[idx];
    if (!bullet?.trim()) { toast.error("Write a bullet first before enhancing."); return; }
    const key = `${entry.id}-${idx}`;
    setEnhancingKey(key);
    try {
      const res = await fetch("/api/ai/enhance-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet, jobTitle: entry.title, company: entry.company }),
      });
      const json = (await res.json()) as { enhanced?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enhancement failed");
      setEnhancingState({ entryId: entry.id, bulletIdx: idx, enhanced: json.enhanced ?? bullet });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enhance bullet");
    } finally {
      setEnhancingKey(null);
    }
  }

  function acceptEnhancement() {
    if (!enhancingState) return;
    updateBullet(enhancingState.entryId, enhancingState.bulletIdx, enhancingState.enhanced);
    setEnhancingState(null);
  }

  return (
    <div className="mt-3 space-y-5 border-t border-slate-200 dark:border-white/10 pt-3">
      {entries.map((entry, ei) => (
        <div key={entry.id} className="relative rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Position {ei + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={() => removeEntry(entry.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Job title</p>
              <Input className="mt-1 h-8 text-sm" value={entry.title} onChange={(e) => updateEntry(entry.id, { title: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Company</p>
              <Input className="mt-1 h-8 text-sm" value={entry.company} onChange={(e) => updateEntry(entry.id, { company: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Location</p>
              <Input className="mt-1 h-8 text-sm" value={entry.location} onChange={(e) => updateEntry(entry.id, { location: e.target.value })} placeholder="Dubai, UAE" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-zinc-400">Start</p>
                <Input className="mt-1 h-8 text-sm" value={entry.startDate} onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })} placeholder="Jan 2022" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-zinc-400">End</p>
                <Input className="mt-1 h-8 text-sm" value={entry.endDate} onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })} placeholder="Mar 2024" disabled={entry.isCurrent} />
              </div>
            </div>
          </div>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <input type="checkbox" checked={entry.isCurrent} onChange={(e) => updateEntry(entry.id, { isCurrent: e.target.checked })} className="rounded border-zinc-600" />
            Currently working here
          </label>

          <div className="mt-3">
            <p className="text-xs text-slate-500 dark:text-zinc-400">Achievement bullets</p>
            <div className="mt-1 space-y-2">
              {entry.bullets.map((b, bi) => {
                const key = `${entry.id}-${bi}`;
                const isEnhancing = enhancingKey === key;
                const hasSuggestion = enhancingState?.entryId === entry.id && enhancingState.bulletIdx === bi;

                return (
                  <div key={bi} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0 text-zinc-500">•</span>
                      <Input
                        className="h-8 flex-1 text-sm"
                        value={b}
                        onChange={(e) => updateBullet(entry.id, bi, e.target.value)}
                        placeholder="Shipped X, resulting in Y% improvement in Z"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-blue-400/70 hover:text-blue-300"
                        onClick={() => void handleEnhanceBullet(entry, bi)}
                        disabled={isEnhancing || !!enhancingKey}
                        title="AI enhance this bullet"
                      >
                        {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-zinc-500 hover:text-red-400"
                        onClick={() => removeBullet(entry.id, bi)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Inline diff UI */}
                    {hasSuggestion && (
                      <div className="ml-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-xs">
                        <p className="text-zinc-500 line-through">{b}</p>
                        <p className="mt-1 font-medium text-blue-300">{enhancingState.enhanced}</p>
                        <div className="mt-2 flex gap-2">
                          <Button type="button" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={acceptEnhancement}>
                            <Check className="h-3 w-3" /> Accept
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px] text-slate-500 dark:text-zinc-400" onClick={() => setEnhancingState(null)}>
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="ghost" size="sm" className="mt-1.5 h-7 text-xs text-zinc-500 hover:text-zinc-200" onClick={() => addBullet(entry.id)}>
              <Plus className="mr-1 h-3 w-3" /> Add bullet
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setEntries([...entries, newEntry()])}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add position
      </Button>
    </div>
  );
}
