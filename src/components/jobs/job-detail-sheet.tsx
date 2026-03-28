"use client";

import { ExternalLink, MapPin, Building2, Banknote, Clock } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { JobWithScore } from "./job-match-dashboard";

interface JobDetailSheetProps {
  job: JobWithScore | null;
  onClose: () => void;
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent fit";
  if (score >= 60) return "Good fit";
  if (score >= 40) return "Partial fit";
  return "Low fit";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function JobDetailSheet({ job, onClose }: JobDetailSheetProps) {
  return (
    <Sheet open={!!job} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-lg border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1623] p-0">
        {job && (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                  {job.title}
                </h2>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-zinc-400">
                  {job.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  )}
                  {job.salary && (
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5" /> {job.salary}
                    </span>
                  )}
                  {job.experienceYears != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {job.experienceYears}+ yrs
                    </span>
                  )}
                </div>
              </div>

              {/* Match score */}
              <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Match score</p>
                  <span className={`text-2xl font-bold ${scoreColor(job.score)}`}>
                    {job.score}%
                  </span>
                </div>
                <Progress value={job.score} />
                <p className="mt-1.5 text-xs text-zinc-500">{scoreLabel(job.score)}</p>
              </div>

              {/* Matched skills */}
              {job.matched.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-2">
                    Matched skills ({job.matched.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.matched.map((s) => (
                      <Badge key={s} variant="success">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {job.missing.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-2">
                    Missing skills ({job.missing.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missing.map((s) => (
                      <Badge key={s} variant="destructive">{s}</Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Consider adding these to your CV or skills roadmap.
                  </p>
                </div>
              )}

              {/* Job description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-2">
                  Job description
                </p>
                <p className="text-sm text-slate-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 pb-4">
                {job.sourceUrl && (
                  <Button asChild size="sm" variant="secondary" className="gap-1.5">
                    <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> View on site
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await fetch("/api/applications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ jobPostingId: job.id, status: "Applied" }),
                    }).catch(() => {});
                  }}
                >
                  Record Application
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
