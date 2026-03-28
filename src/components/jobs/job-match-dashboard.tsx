"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Globe, Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
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
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-zinc-500";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-zinc-600";
}

export function JobMatchDashboard({ cvName, cvKeywords, initialJobs }: JobMatchDashboardProps) {
  const [jobs, setJobs] = useState<JobWithScore[]>(initialJobs);
  const [selectedJob, setSelectedJob] = useState<JobWithScore | null>(null);

  // Adzuna search state
  const [adzunaLocation, setAdzunaLocation] = useState("");
  const [adzunaCountry, setAdzunaCountry] = useState("gb");
  const [fetchingAdzuna, setFetchingAdzuna] = useState(false);

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

  async function handleAdzunaSearch() {
    setFetchingAdzuna(true);
    try {
      const res = await fetch("/api/jobs/adzuna-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: adzunaLocation, country: adzunaCountry }),
      });
      const data = (await res.json()) as { saved?: number; skipped?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      toast.success(`Found ${data.saved ?? 0} new jobs from Adzuna`);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adzuna search failed");
    } finally {
      setFetchingAdzuna(false);
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
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">AI Job Matching</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Jobs are automatically scored against your saved CV.
        </p>
      </div>

      {/* CV status bar */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Matching against:</span>
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-200">{cvName}</span>
          <span className="mx-1 text-zinc-700">•</span>
          <div className="flex flex-wrap gap-1.5">
            {shownKeywords.map((kw) => (
              <Badge key={kw} variant="blue">{kw}</Badge>
            ))}
            {extraCount > 0 && (
              <Badge variant="outline">+{extraCount} more</Badge>
            )}
          </div>
          <Link href="/cv-builder" className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
            Edit CV
          </Link>
        </div>
      </div>

      {/* Discovery panel */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-4">
        <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">Discover jobs</p>

        {/* Adzuna search */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 gap-2">
            <select
              value={adzunaCountry}
              onChange={(e) => setAdzunaCountry(e.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-900 px-2 text-sm text-slate-600 dark:text-zinc-300 focus:outline-none"
            >
              <option value="gb">UK</option>
              <option value="us">USA</option>
              <option value="au">Australia</option>
              <option value="ca">Canada</option>
              <option value="sg">Singapore</option>
              <option value="de">Germany</option>
              <option value="fr">France</option>
              <option value="nl">Netherlands</option>
              <option value="in">India</option>
              <option value="za">South Africa</option>
            </select>
            <Input
              className="flex-1 h-9 text-sm"
              placeholder="City (optional, e.g. Dubai)"
              value={adzunaLocation}
              onChange={(e) => setAdzunaLocation(e.target.value)}
            />
          </div>
          <Button
            onClick={() => void handleAdzunaSearch()}
            disabled={fetchingAdzuna}
            className="h-9 gap-1.5 shrink-0"
          >
            {fetchingAdzuna ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {fetchingAdzuna ? "Searching…" : "Search Adzuna"}
          </Button>
        </div>

        {/* URL fetch */}
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

        {/* Manual form toggle */}
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
          {sortedJobs.length === 0 ? "No saved jobs yet" : `${sortedJobs.length} saved job${sortedJobs.length === 1 ? "" : "s"}, sorted by match score`}
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
                    {job.source === "adzuna" && (
                      <Badge variant="blue">Adzuna</Badge>
                    )}
                    {job.source === "url" && (
                      <Badge variant="default">URL</Badge>
                    )}
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
                    className={job.score >= 80 ? "[&>div]:bg-emerald-500" : job.score >= 60 ? "[&>div]:bg-blue-500" : job.score >= 40 ? "[&>div]:bg-amber-500" : ""}
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
