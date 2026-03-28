"use client";

import { useState } from "react";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import type { ProfileContent } from "@/lib/cv-content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileEditor({ blockId }: { blockId: string }) {
  const block = useCvBuilderStore((s) => s.blocks[blockId]);
  const blocks = useCvBuilderStore((s) => s.blocks);
  const updateBlockContent = useCvBuilderStore((s) => s.updateBlockContent);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  if (!block || block.content?.type !== "profile") return null;
  const data = block.content.data;

  function update(patch: Partial<ProfileContent>) {
    updateBlockContent(blockId, { type: "profile", data: { ...data, ...patch } });
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    try {
      // Collect experience and skills from other blocks
      const experience: { company: string; title: string; bullets: string[] }[] = [];
      const skills: { name: string; skills: string[] }[] = [];

      for (const b of Object.values(blocks)) {
        if (b.content?.type === "experience") {
          experience.push(...b.content.data.map((e) => ({ company: e.company, title: e.title, bullets: e.bullets })));
        }
        if (b.content?.type === "skills") {
          skills.push(...b.content.data.map((c) => ({ name: c.name, skills: c.skills })));
        }
      }

      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: data.jobTitle, experience, skills }),
      });
      const json = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      update({ summary: json.summary ?? "" });
      toast.success("Summary generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 dark:border-white/10 pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Full name</p>
          <Input className="mt-1" value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder="Jane Smith" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Job title</p>
          <Input className="mt-1" value={data.jobTitle} onChange={(e) => update({ jobTitle: e.target.value })} placeholder="Senior Software Engineer" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Email</p>
          <Input className="mt-1" type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} placeholder="jane@example.com" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Phone</p>
          <Input className="mt-1" type="tel" value={data.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+971 50 000 0000" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Location</p>
          <Input className="mt-1" value={data.location} onChange={(e) => update({ location: e.target.value })} placeholder="Dubai, UAE" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">LinkedIn</p>
          <Input className="mt-1" value={data.linkedin} onChange={(e) => update({ linkedin: e.target.value })} placeholder="linkedin.com/in/janesmith" />
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500 dark:text-zinc-400">Website / Portfolio</p>
          <Input className="mt-1" value={data.website} onChange={(e) => update({ website: e.target.value })} placeholder="https://janesmith.dev" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-zinc-400">Professional summary</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px] text-blue-400 hover:text-blue-300"
            onClick={() => void handleGenerateSummary()}
            disabled={generatingSummary}
          >
            {generatingSummary ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {generatingSummary ? "Generating…" : "AI Generate"}
          </Button>
        </div>
        <Textarea
          className="mt-1 min-h-[90px] resize-y text-sm"
          value={data.summary}
          onChange={(e) => update({ summary: e.target.value })}
          placeholder="2–4 sentences: who you are, your specialisation, and your key value proposition."
        />
      </div>
    </div>
  );
}
