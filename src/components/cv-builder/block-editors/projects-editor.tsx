"use client";

import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { newEntryId, type ProjectEntry } from "@/lib/cv-content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

function newEntry(): ProjectEntry {
  return {
    id: newEntryId(),
    name: "",
    url: "",
    description: "",
    bullets: [""],
  };
}

export function ProjectsEditor({ blockId }: { blockId: string }) {
  const block = useCvBuilderStore((s) => s.blocks[blockId]);
  const updateBlockContent = useCvBuilderStore((s) => s.updateBlockContent);

  if (!block || block.content?.type !== "projects") return null;
  const entries = block.content.data;

  function setEntries(next: ProjectEntry[]) {
    updateBlockContent(blockId, { type: "projects", data: next });
  }

  function updateEntry(id: string, patch: Partial<ProjectEntry>) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEntry(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
  }

  function addBullet(entryId: string) {
    updateEntry(entryId, {
      bullets: [...(entries.find((e) => e.id === entryId)?.bullets ?? []), ""],
    });
  }

  function updateBullet(entryId: string, idx: number, value: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, {
      bullets: entry.bullets.map((b, i) => (i === idx ? value : b)),
    });
  }

  function removeBullet(entryId: string, idx: number) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.filter((_, i) => i !== idx) });
  }

  return (
    <div className="mt-3 space-y-4 border-t border-slate-200 dark:border-white/10 pt-3">
      {entries.map((entry, ei) => (
        <div
          key={entry.id}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Project {ei + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-red-400"
              onClick={() => removeEntry(entry.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Project name</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.name}
                onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">URL (optional)</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.url}
                onChange={(e) => updateEntry(entry.id, { url: e.target.value })}
                placeholder="https://github.com/you/project"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Description</p>
              <Textarea
                className="mt-1 min-h-[60px] resize-none text-sm"
                value={entry.description}
                onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                placeholder="One-line description of what this project does."
              />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-500 dark:text-zinc-400">Bullet points (optional)</p>
            <div className="mt-1 space-y-1.5">
              {entry.bullets.map((b, bi) => (
                <div key={bi} className="flex items-center gap-1.5">
                  <span className="shrink-0 text-zinc-500">•</span>
                  <Input
                    className="h-8 flex-1 text-sm"
                    value={b}
                    onChange={(e) => updateBullet(entry.id, bi, e.target.value)}
                    placeholder="Key achievement or technology used"
                  />
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
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1.5 h-7 text-xs text-zinc-500 hover:text-zinc-200"
              onClick={() => addBullet(entry.id)}
            >
              <Plus className="mr-1 h-3 w-3" /> Add bullet
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => setEntries([...entries, newEntry()])}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add project
      </Button>
    </div>
  );
}
