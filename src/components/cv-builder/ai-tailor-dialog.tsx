"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import type { CvDocumentPayload } from "@/lib/cv-document";

type Suggestion = { section: string; tip: string };

export function AiTailorDialog({ documentId }: { documentId: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromDocument = useCvBuilderStore((s) => s.hydrateFromDocument);

  const handleOptimize = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description.");
      return;
    }
    if (!documentId) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const res = await fetch("/api/ai/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, jobDescription }),
      });

      const data = (await res.json()) as {
        tailoredPayload?: CvDocumentPayload;
        suggestions?: Suggestion[];
        error?: string;
      };

      if (!res.ok) throw new Error(data.error ?? "Tailoring failed");

      if (data.tailoredPayload) {
        hydrateFromDocument(data.tailoredPayload);
      }

      setSuggestions(data.suggestions ?? []);
      toast.success("CV structure optimised for this role.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSuggestions([]);
    setError(null);
    setJobDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          disabled={!documentId}
          className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 border border-blue-500/30"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          AI Tailor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">AI CV Tailoring</DialogTitle>
          <DialogDescription>
            Paste the job description. Gemini will reorder and optimise your CV
            structure and give you section-by-section writing tips.
          </DialogDescription>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="py-4 space-y-4">
            <textarea
              className="h-44 w-full resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-3 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleOptimize()}
                disabled={loading || !jobDescription.trim()}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {loading ? "Analysing…" : "Optimise CV"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              CV structure updated. Here are your writing tips:
            </div>
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                    {s.section}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-zinc-300">{s.tip}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
