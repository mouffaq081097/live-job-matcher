"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Globe, ChevronDown, ChevronUp, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobDetailSheet } from "./job-detail-sheet";
import { toast } from "sonner";
import Link from "next/link";

export type JobWithScore = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string;
  sourceUrl: string | null;
  requirements: string[];
  salary: string | null;
  experienceYears: number | null;
  source: string;
  score: number;
  matched: string[];
  missing: string[];
};

interface JobMatchDashboardProps {
  cvName: string;
  cvKeywords: string[];
  initialJobs: JobWithScore[];
  hasProfile: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-zinc-500";
}

export function JobMatchDashboard({ cvName, cvKeywords, initialJobs, hasProfile }: JobMatchDashboardProps) {
  const [jobs, setJobs] = useState<JobWithScore[]>(initialJobs);
  const [selectedJob, setSelectedJob] = useState<JobWithScore | null>(null);

  // AI search state
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [lastQueries, setLastQueries] = useState<string[]>([]);

  // URL fetch state
  const [urlInput, setUrlInput] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  // Manual form state
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto-discover jobs on first visit when profile is set but no jobs saved yet
  useEffect(() => {
    if (initialJobs.length === 0 && hasProfile) {
      void handleAiSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAiSearch() {
    setSearching(true);
    setLastQueries([]);
    try {
      const res = await fetch("/api/jobs/serpapi-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });
      const data = (await res.json()) as {
        saved?: number;
        skipped?: number;
        total?: number;
        queries?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      if (data.queries) setLastQueries(data.queries);
      if ((data.saved ?? 0) > 0) {
        toast.success(`Found ${data.saved} new jobs matching your profile`);
        window.location.reload();
      } else if ((data.total ?? 0) > 0) {
        toast.info("No new jobs found — you already have the latest results");
      } else {
        toast.info("No jobs found for your profile. Try updating your target roles.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleUrlFetch() {
    if (!urlInput.trim()) return;
    setFetchingUrl(true);
    setShowUrlFallback(false);
    try {
      const res = await fetch("/api/jobs/ai-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string; message?: string };
      if (data.error === "fetch_blocked") {
        toast.error(data.message ?? "Could not fetch URL");
        setShowUrlFallback(true);
        setShowManual(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      toast.success("Job fetched and saved!");
      setUrlInput("");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "URL fetch failed");
    } finally {
      setFetchingUrl(false);
    }
  }

  async function handleManualSave() {
    if (manualTitle.trim().length < 2 || manualDescription.trim().length < 50) return;
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          company: manualCompany || undefined,
          location: manualLocation || undefined,
          description: manualDescription,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Job posting saved!");
      setManualTitle("");
      setManualCompany("");
      setManualLocation("");
      setManualDescription("");
      setShowManual(false);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" }).catch(() => {});
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  const sortedJobs = [...jobs].sort((a, b) => b.score - a.score);
  const shownKeywords = cvKeywords.slice(0, 8);
  const extraCount = cvKeywords.length - shownKeywords.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/90">Jobs</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">Live Job Matches</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Jobs are automatically matched to your profile — ranked by how well they fit your CV.
        </p>
      </div>

      {/* CV status bar */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Matching against:</span>
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-200">{cvName}</span>
          {shownKeywords.length > 0 && (
            <>
              <span className="mx-1 text-zinc-700">•</span>
              <div className="flex flex-wrap gap-1.5">
                {shownKeywords.map((kw) => (
                  <Badge key={kw} variant="blue">{kw}</Badge>
                ))}
                {extraCount > 0 && <Badge variant="outline">+{extraCount} more</Badge>}
              </div>
            </>
          )}
          <Link href="/cv-builder" className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
            Edit CV
          </Link>
        </div>
      </div>

      {/* No profile warning */}
      {!hasProfile && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Complete your{" "}
          <Link href="/profile" className="underline underline-offset-2 hover:text-amber-200">
            Profile
          </Link>{" "}
          with target roles and skills to get better job matches.
        </div>
      )}

      {/* AI Discovery panel */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
            Find Jobs For Me
          </p>
          <span className="text-xs text-slate-400 dark:text-zinc-500">— powered by Gemini + Google Jobs</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="flex-1 h-9 text-sm"
            placeholder="Location (optional, e.g. London, Dubai, Remote)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleAiSearch(); }}
          />
          <Button
            onClick={() => void handleAiSearch()}
            disabled={searching}
            className="h-9 gap-1.5 shrink-0"
          >
            {searching
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : jobs.length > 0
                ? <RefreshCw className="h-3.5 w-3.5" />
                : <Sparkles className="h-3.5 w-3.5" />
            }
            {searching ? "Finding jobs…" : jobs.length > 0 ? "Refresh jobs" : "Find jobs for me"}
          </Button>
        </div>

        {lastQueries.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Searched:{" "}
            {lastQueries.map((q, i) => (
              <span key={q}>
                <span className="text-slate-600 dark:text-zinc-300 font-medium">&ldquo;{q}&rdquo;</span>
                {i < lastQueries.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}

        {/* URL fetch */}
        <div className="border-t border-slate-200 dark:border-white/5 pt-3 space-y-2">
          <p className="text-xs text-slate-400 dark:text-zinc-500">Or add a specific job by URL:</p>
          <div className="flex gap-2">
            <Input
              className="flex-1 h-9 text-sm"
              placeholder="https://linkedin.com/jobs/view/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleUrlFetch(); }}
            />
            <Button
              variant="secondary"
              className="h-9 gap-1.5 shrink-0"
              onClick={() => void handleUrlFetch()}
              disabled={fetchingUrl || !urlInput.trim()}
            >
              {fetchingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              {fetchingUrl ? "Fetching…" : "Fetch URL"}
            </Button>
          </div>
          {showUrlFallback && (
            <p className="text-xs text-amber-400">
              URL was blocked — paste the job description manually below instead.
            </p>
          )}
        </div>

        {/* Manual toggle */}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          onClick={() => setShowManual((v) => !v)}
        >
          {showManual ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showManual ? "Hide" : "Paste job description manually"}
        </button>

        {showManual && (
          <div className="space-y-2 pt-1">
            <Input
              className="h-8 text-sm"
              placeholder="Job title *"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="h-8 text-sm"
                placeholder="Company (optional)"
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
              />
              <Input
                className="h-8 text-sm"
                placeholder="Location (optional)"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
              />
            </div>
            <Textarea
              className="min-h-[160px] text-sm"
              placeholder="Paste the full job description here…"
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
            />
            <Button
              size="sm"
              className="w-full"
              disabled={saving || manualTitle.trim().length < 2 || manualDescription.trim().length < 50}
              onClick={() => void handleManualSave()}
            >
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
              Save job posting
            </Button>
          </div>
        )}
      </div>

      {/* Jobs feed */}
      <div>
        <p className="text-xs text-zinc-500 mb-3">
          {sortedJobs.length === 0
            ? "No jobs yet — click \"Find jobs for me\" to get started"
            : `${sortedJobs.length} job${sortedJobs.length === 1 ? "" : "s"}, sorted by match score`}
        </p>
        <div className="space-y-3">
          {sortedJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 transition-colors hover:border-slate-300 dark:hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 dark:text-zinc-100 truncate">{job.title}</p>
                    {job.source === "serpapi" && <Badge variant="blue">Google Jobs</Badge>}
                    {job.source === "url" && <Badge variant="default">URL</Badge>}
                    {job.source === "manual" && <Badge variant="outline">Manual</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {[job.company, job.location].filter(Boolean).join(" • ") || "—"}
                    {job.salary && ` • ${job.salary}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {job.sourceUrl && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-300" asChild>
                      <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" title="View original posting">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-red-400"
                    onClick={() => void handleDelete(job.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <Progress
                    value={job.score}
                    className={
                      job.score >= 80
                        ? "[&>div]:bg-emerald-500"
                        : job.score >= 60
                          ? "[&>div]:bg-blue-500"
                          : job.score >= 40
                            ? "[&>div]:bg-amber-500"
                            : ""
                    }
                  />
                </div>
                <span className={`text-sm font-semibold tabular-nums ${scoreColor(job.score)}`}>
                  {job.score}%
                </span>
              </div>

              {/* Skill chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.matched.slice(0, 5).map((s) => (
                  <Badge key={s} variant="success">{s}</Badge>
                ))}
                {job.missing.slice(0, 3).map((s) => (
                  <Badge key={s} variant="destructive">{s}</Badge>
                ))}
                {(job.matched.length > 5 || job.missing.length > 3) && (
                  <Badge variant="outline">
                    +{Math.max(0, job.matched.length - 5) + Math.max(0, job.missing.length - 3)} more
                  </Badge>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs text-slate-500 dark:text-zinc-400 hover:text-zinc-200"
                onClick={() => setSelectedJob(job)}
              >
                View details
              </Button>
            </div>
          ))}
        </div>
      </div>

      <JobDetailSheet job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
