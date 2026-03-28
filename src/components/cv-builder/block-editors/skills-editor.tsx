"use client";

import { useState } from "react";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { newEntryId, type SkillCategory } from "@/lib/cv-content";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";

function newCategory(): SkillCategory {
  return { id: newEntryId(), name: "", skills: [] };
}

export function SkillsEditor({ blockId }: { blockId: string }) {
  const block = useCvBuilderStore((s) => s.blocks[blockId]);
  const updateBlockContent = useCvBuilderStore((s) => s.updateBlockContent);
  const [chipInputs, setChipInputs] = useState<Record<string, string>>({});

  if (!block || block.content?.type !== "skills") return null;
  const categories = block.content.data;

  function setCategories(next: SkillCategory[]) {
    updateBlockContent(blockId, { type: "skills", data: next });
  }

  function updateCategory(id: string, patch: Partial<SkillCategory>) {
    setCategories(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCategory(id: string) {
    setCategories(categories.filter((c) => c.id !== id));
  }

  function addSkill(catId: string) {
    const raw = (chipInputs[catId] ?? "").trim();
    if (!raw) return;
    const newSkills = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    updateCategory(catId, { skills: [...cat.skills, ...newSkills] });
    setChipInputs((p) => ({ ...p, [catId]: "" }));
  }

  function removeSkill(catId: string, skill: string) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    updateCategory(catId, { skills: cat.skills.filter((s) => s !== skill) });
  }

  return (
    <div className="mt-3 space-y-4 border-t border-slate-200 dark:border-white/10 pt-3">
      {categories.map((cat, ci) => (
        <div
          key={cat.id}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Category {ci + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-red-400"
              onClick={() => removeCategory(cat.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Category name</p>
            <Input
              className="mt-1 h-8 text-sm"
              value={cat.name}
              onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
              placeholder="Languages, Frameworks, Tools…"
            />
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-500 dark:text-zinc-400">Skills</p>
            {cat.skills.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cat.skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/25"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(cat.id, skill)}
                      className="ml-0.5 text-blue-400 hover:text-blue-200"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1.5 flex gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                value={chipInputs[cat.id] ?? ""}
                onChange={(e) =>
                  setChipInputs((p) => ({ ...p, [cat.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkill(cat.id);
                  }
                }}
                placeholder="Type skill, press Enter or comma…"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => addSkill(cat.id)}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => setCategories([...categories, newCategory()])}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add category
      </Button>
    </div>
  );
}
