"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisAdCard } from "@/components/ads/analysis-ad-card";
import { AtsScoreBar } from "@/components/optimize/ats-score-bar";
import { HighlightedJobDescription } from "@/components/optimize/highlighted-jd";
import { KeywordHeatmap } from "@/components/optimize/keyword-heatmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link2, BookOpen, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { cvDocumentToText } from "@/lib/cv-to-text";
import Link from "next/link";

type AtsResult = {
  score: number;
  hardSkillsFound: string[];
  hardSkillsMissing: string[];
  softSkillsFound: string[];
  softSkillsMissing: string[];
  topSuggestions: string[];
};

type JobsListResponse = { items: { id: string; title: string }[] };
type JobDetailResponse = { item: { id: string; title: string; description: string } };
type ApplicationsResponse = {
  items: { id: string; jobPosting: { id: string } }[];
};

function OptimizePageInner() {
  const searchParams = useSearchParams();
  const [jd, setJd] = useState("");
  const [jdView, setJdView] = useState<"edit" | "highlight">("edit");
  const [cv, setCv] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsError, setAtsError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string>("Pasted job");

  // URL scraper state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Save score state
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const score = atsResult?.score ?? 0;
  const getDocumentPayload = useCvBuilderStore((s) => s.getDocumentPayload);

  async function runAnalysis() {
    if (!cv.trim() || !jd.trim()) return;
    setShowOverlay(true);
    setAnalysing(true);
    setAtsError(null);
    setScoreSaved(false);
    try {
      const res = await fetch("/api/ai/ats-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, jd }),
      });
      const data = (await res.json()) as AtsResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAtsResult(data);
      setJdView("highlight");
    } catch (err) {
      setAtsError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalysing(false);
      setShowOverlay(false);
    }
  }

  async function handleScrapeUrl() {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/ai/scrape-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = (await res.json()) as {
        title?: string;
        company?: string;
        description?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not fetch that URL");
      setJd(data.description ?? "");
      if (data.title) setJobTitle(data.title);
      setScrapeUrl("");
      toast.success("Job description extracted!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      setScrapeError(msg);
    } finally {
      setScraping(false);
    }
  }

  function handleLoadCv() {
    const payload = getDocumentPayload();
    const text = cvDocumentToText(payload);
    setCv(text);
    toast.success("CV structure loaded from CV Builder.");
  }

  async function handleSaveScore() {
    if (!atsResult || !selectedJobId) return;
    setSavingScore(true);
    try {
      // Find the application for this job
      const appRes = await fetch("/api/applications", { cache: "no-store" });
      if (!appRes.ok) throw new Error("Could not load applications");
      const appData = (await appRes.json()) as ApplicationsResponse;
      const application = appData.items.find(
        (a) => a.jobPosting.id === selectedJobId,
      );

      if (!application) {
        toast.error("No application found for this job. Apply first from the Jobs page.");
        return;
      }

      const patchRes = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atsScore: atsResult.score }),
      });
      if (!patchRes.ok) throw new Error("Failed to save score");

      setScoreSaved(true);
      toast.success(`ATS score ${atsResult.score}% saved to your application.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save score");
    } finally {
      setSavingScore(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void fetch("/api/jobs", { cache: "no-store" })
        .then(async (r) => (r.ok ? ((await r.json()) as JobsListResponse) : null))
        .then((data) => {
          if (!data?.items) return;
          setJobs(data.items.map((j) => ({ id: j.id, title: j.title })));
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const job = searchParams.get("job");
    if (!job) return;
    setSelectedJobId(job);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedJobId) return;
    setScoreSaved(false);
    const t = setTimeout(() => {
      void fetch(`/api/jobs/${selectedJobId}`, { cache: "no-store" })
        .then(async (r) => (r.ok ? ((await r.json()) as JobDetailResponse) : null))
        .then((data) => {
          if (!data?.item) return;
          setJobTitle(data.item.title ?? "Saved job");
          setJd(data.item.description ?? "");
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [selectedJobId]);

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/90">
            Optimization engine
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
            Tailor your CV to the role
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-zinc-400">
            Paste or fetch a job description, load your CV, and get a Gemini-powered ATS score.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={analysing || !cv.trim() || !jd.trim()}
          >
            {analysing ? "Analysing…" : "Run analysis"}
          </Button>
          {atsResult && selectedJobId && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSaveScore()}
              disabled={savingScore || scoreSaved}
              className={scoreSaved ? "text-emerald-400 border-emerald-500/30" : ""}
            >
              {savingScore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : scoreSaved ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {scoreSaved ? "Score saved" : "Save score"}
            </Button>
          )}
          <Button type="button" variant="secondary" asChild>
            <Link href="/export-success">Export PDF</Link>
          </Button>
        </div>
      </div>

      {/* Job selector + label */}
      <div className="grid gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 md:grid-cols-[260px_1fr] md:items-end">
        <div>
          <p className="text-xs font-medium text-zinc-500">Saved job</p>
          <select
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
            value={selectedJobId ?? ""}
            onChange={(e) => setSelectedJobId(e.target.value || null)}
          >
            <option value="">(Paste job or choose saved)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Job label</p>
          <Input
            className="mt-2"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Job label"
          />
        </div>
      </div>

      {/* URL scraper */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 space-y-2">
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-200 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-400" />
          Fetch job description from URL
        </p>
        <p className="text-xs text-zinc-500">
          Paste a job posting URL (Greenhouse, Lever, company career pages). LinkedIn is not supported — paste manually instead.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://jobs.example.com/posting/123"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleScrapeUrl(); }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleScrapeUrl()}
            disabled={scraping || !scrapeUrl.trim()}
            className="shrink-0"
          >
            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
          </Button>
        </div>
        {scrapeError && (
          <p className="text-xs text-red-400">{scrapeError}</p>
        )}
      </div>

      <AtsScoreBar score={score} />

      {atsError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {atsError}
        </div>
      )}

      {atsResult && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Hard skills found</p>
            <div className="flex flex-wrap gap-1.5">
              {atsResult.hardSkillsFound.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{s}</span>
              ))}
              {atsResult.hardSkillsFound.length === 0 && <span className="text-xs text-zinc-500">None detected</span>}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 mt-3">Hard skills missing</p>
            <div className="flex flex-wrap gap-1.5">
              {atsResult.hardSkillsMissing.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20">{s}</span>
              ))}
              {atsResult.hardSkillsMissing.length === 0 && <span className="text-xs text-zinc-500">None missing</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Soft skills found</p>
            <div className="flex flex-wrap gap-1.5">
              {atsResult.softSkillsFound.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">{s}</span>
              ))}
              {atsResult.softSkillsFound.length === 0 && <span className="text-xs text-zinc-500">None detected</span>}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 mt-3">Soft skills missing</p>
            <div className="flex flex-wrap gap-1.5">
              {atsResult.softSkillsMissing.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">{s}</span>
              ))}
              {atsResult.softSkillsMissing.length === 0 && <span className="text-xs text-zinc-500">None missing</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Top suggestions</p>
            <ul className="space-y-2">
              {atsResult.topSuggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-zinc-300">
                  <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Job description</p>
            {atsResult && (
              <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setJdView("edit")}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${jdView === "edit" ? "bg-blue-600 text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setJdView("highlight")}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${jdView === "highlight" ? "bg-blue-600 text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"}`}
                >
                  Highlight
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {atsResult
              ? "Hard skills in blue · soft skills in purple."
              : "Paste job description here, or use the URL fetcher above."}
          </p>
          {jdView === "highlight" && atsResult ? (
            <div className="mt-4 min-h-[min(60vh,480px)] overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10 p-3">
              <HighlightedJobDescription
                text={jd}
                hardKeywords={[...atsResult.hardSkillsFound, ...atsResult.hardSkillsMissing]}
                softKeywords={[...atsResult.softSkillsFound, ...atsResult.softSkillsMissing]}
              />
            </div>
          ) : (
            <Textarea
              className="mt-4 min-h-[min(60vh,480px)] resize-y font-mono text-sm"
              value={jd}
              onChange={(e) => { setJd(e.target.value); setAtsResult(null); setJdView("edit"); }}
              placeholder="Paste job description here, or use the URL fetcher above…"
              spellCheck={false}
            />
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Your CV</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLoadCv}
              className="text-xs text-blue-400 hover:text-blue-300 h-7 px-2"
            >
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Load from CV Builder
            </Button>
          </div>
          <Textarea
            className="mt-4 min-h-[min(60vh,480px)] resize-y font-mono text-sm"
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder="Paste your CV text here, or click 'Load from CV Builder' above…"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40 md:bottom-10 md:right-10">
        <div className="pointer-events-auto">
          <KeywordHeatmap keywords={atsResult ? [
            ...atsResult.hardSkillsFound.map((k) => ({ label: k, kind: "hard" as const, found: true })),
            ...atsResult.hardSkillsMissing.map((k) => ({ label: k, kind: "hard" as const, found: false })),
            ...atsResult.softSkillsFound.map((k) => ({ label: k, kind: "soft" as const, found: true })),
            ...atsResult.softSkillsMissing.map((k) => ({ label: k, kind: "soft" as const, found: false })),
          ] : []} />
        </div>
      </div>

      {showOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="analysis-title"
        >
          <div className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0b1120]/95 p-8 shadow-2xl">
            <div>
              <p id="analysis-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Gemini is analysing your CV
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                Mapping keywords, skills, and structure against the job description…
              </p>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <AnalysisAdCard />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OptimizePage() {
  return (
    <Suspense fallback={null}>
      <OptimizePageInner />
    </Suspense>
  );
}
