"use client";

import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { newEntryId, type EducationEntry } from "@/lib/cv-content";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

function newEntry(): EducationEntry {
  return {
    id: newEntryId(),
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    gpa: "",
  };
}

export function EducationEditor({ blockId }: { blockId: string }) {
  const block = useCvBuilderStore((s) => s.blocks[blockId]);
  const updateBlockContent = useCvBuilderStore((s) => s.updateBlockContent);

  if (!block || block.content?.type !== "education") return null;
  const entries = block.content.data;

  function setEntries(next: EducationEntry[]) {
    updateBlockContent(blockId, { type: "education", data: next });
  }

  function updateEntry(id: string, patch: Partial<EducationEntry>) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEntry(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
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
              Entry {ei + 1}
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
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Institution</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.institution}
                onChange={(e) => updateEntry(entry.id, { institution: e.target.value })}
                placeholder="University of Dubai"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Degree</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.degree}
                onChange={(e) => updateEntry(entry.id, { degree: e.target.value })}
                placeholder="Bachelor of Science"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Field of study</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.field}
                onChange={(e) => updateEntry(entry.id, { field: e.target.value })}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Start year</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.startDate}
                onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                placeholder="2018"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">End year</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.endDate}
                onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                placeholder="2022"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">GPA (optional)</p>
              <Input
                className="mt-1 h-8 text-sm"
                value={entry.gpa}
                onChange={(e) => updateEntry(entry.id, { gpa: e.target.value })}
                placeholder="3.8 / 4.0"
              />
            </div>
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
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add entry
      </Button>
    </div>
  );
}
