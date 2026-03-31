"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import type { CvDocumentPayload } from "@/lib/cv-document";

type Suggestion = { section: string; tip: string };
type Question = { id: string; question: string; hint: string };

export function AiTailorDialog({
  documentId,
  onCreated,
}: {
  documentId: string | null;
  onCreated: (newDocId: string, cvName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // step 1 = paste JD, step 2 = answer questions, step 3 = tips
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jobDescription, setJobDescription] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [createdCvName, setCreatedCvName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromDocument = useCvBuilderStore((s) => s.hydrateFromDocument);

  const resetState = () => {
    setStep(1);
    setJobDescription("");
    setLoadingQuestions(false);
    setQuestions([]);
    setAnswers({});
    setGenerating(false);
    setSuggestions([]);
    setCreatedCvName(null);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  // Step 1 → Step 2: analyse JD and generate questions
  const handleAnalyseJob = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }
    setError(null);
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = (await res.json()) as { questions?: Question[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate questions");
      setQuestions(data.questions ?? []);
      setAnswers(Object.fromEntries((data.questions ?? []).map((q) => [q.id, ""])));
      setStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Step 2 → Step 3: generate tailored CV using answers
  const handleGenerate = async () => {
    if (!documentId) return;
    setGenerating(true);
    setError(null);
    try {
      const userAnswers = questions.map((q) => ({
        question: q.question,
        answer: answers[q.id] ?? "",
      }));

      const res = await fetch("/api/ai/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, jobDescription, userAnswers }),
      });

      const data = (await res.json()) as {
        newDocumentId?: string;
        cvName?: string;
        tailoredPayload?: CvDocumentPayload;
        suggestions?: Suggestion[];
        error?: string;
      };

      if (!res.ok) throw new Error(data.error ?? "Tailoring failed");

      if (data.tailoredPayload) {
        hydrateFromDocument(data.tailoredPayload);
      }

      const name = data.cvName ?? "Tailored CV";
      setCreatedCvName(name);
      setSuggestions(data.suggestions ?? []);

      if (data.newDocumentId) {
        onCreated(data.newDocumentId, name);
      }

      setStep(3);
      toast.success(`New CV created: "${name}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
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

      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            {step === 1 && "AI CV Tailoring"}
            {step === 2 && "Tell us about your experience"}
            {step === 3 && "Your tailored CV is ready"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Paste the job description — the AI will ask you a few targeted questions before generating your tailored CV."}
            {step === 2 && "Answer these questions so the AI can write experience bullets and skills that match this role."}
            {step === 3 && "Here are actionable tips to further strengthen your CV."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Paste JD ─────────────────────────────────── */}
        {step === 1 && (
          <div className="py-4 space-y-4">
            <textarea
              className="h-52 w-full resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-3 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
              placeholder="Paste the full job description here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClose} disabled={loadingQuestions}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleAnalyseJob()}
                disabled={loadingQuestions || !jobDescription.trim()}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {loadingQuestions ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {loadingQuestions ? "Analysing job…" : "Analyse Job"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Answer Questions ─────────────────────────── */}
        {step === 2 && (
          <div className="py-4 space-y-5">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                  {i + 1}. {q.question}
                </label>
                <Textarea
                  rows={2}
                  className="resize-none text-sm"
                  placeholder={q.hint || "Your answer…"}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between gap-3 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStep(1); setError(null); }}
                disabled={generating}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back
              </Button>
              <Button
                onClick={() => void handleGenerate()}
                disabled={generating}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {generating ? "Generating your CV…" : "Generate My CV"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Tips ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {createdCvName ? `"${createdCvName}" saved.` : "New CV created."}{" "}
              Here are your writing tips:
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
