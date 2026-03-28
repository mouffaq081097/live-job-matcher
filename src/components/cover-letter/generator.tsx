"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, FileText, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { cvDocumentToText } from "@/lib/cv-to-text";

export function CoverLetterGenerator() {
  const [jobDescription, setJobDescription] = useState("");
  const [cvText, setCvText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocumentPayload = useCvBuilderStore((s) => s.getDocumentPayload);

  const handleLoadFromCvBuilder = () => {
    const payload = getDocumentPayload();
    const text = cvDocumentToText(payload);
    setCvText(text);
    toast.success("CV structure loaded. Add your details to the sections.");
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description.");
      return;
    }
    if (!cvText.trim()) {
      toast.error("Please enter your CV / background.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobDescription,
          jobTitle: jobTitle || undefined,
          company: company || undefined,
        }),
      });

      const data = (await res.json()) as { coverLetter?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setCoverLetter(data.coverLetter ?? "");
      toast.success("Cover letter generated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter${company ? `-${company.toLowerCase().replace(/\s+/g, "-")}` : ""}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left panel — inputs */}
      <div className="space-y-4">
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Role Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Job Title</label>
              <Input
                className="mt-1"
                placeholder="e.g. Senior Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Company</label>
              <Input
                className="mt-1"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-base">Job Description</CardTitle>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Paste the job requirements to personalise your letter.</p>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-44 resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-4 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-white text-base">Your CV / Background</CardTitle>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Paste your CV text or load from the CV Builder.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadFromCvBuilder}
                className="shrink-0 text-xs"
              >
                Load from CV Builder
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full h-44 resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-4 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
              placeholder="Paste your CV or experience here..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          onClick={() => void handleGenerate()}
          disabled={loading || !jobDescription.trim() || !cvText.trim()}
          className="w-full bg-blue-600 text-white hover:bg-blue-500"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Generating with Gemini…" : "Generate Cover Letter"}
        </Button>
      </div>

      {/* Right panel — output */}
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-white">Generated Output</CardTitle>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Review and edit your personalised cover letter.</p>
          </div>
          {coverLetter && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                Copy
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1.5" />
                .txt
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1">
          {coverLetter ? (
            <textarea
              className="w-full h-full min-h-[28rem] resize-none rounded-xl border border-transparent bg-transparent p-0 text-sm leading-relaxed text-slate-700 dark:text-zinc-200 focus-visible:outline-none"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          ) : (
            <div className="h-full min-h-[28rem] flex items-center justify-center text-zinc-500 text-sm border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              Your personalised cover letter will appear here…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
