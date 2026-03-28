"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SavedJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
};

export function PersonalizedJobMatches({
  roles,
}: {
  roles: string[];
  workSetup: string;
  salary: number | null;
}) {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/jobs", { cache: "no-store" })
      .then(async (r) =>
        r.ok ? ((await r.json()) as { items: SavedJob[] }) : null,
      )
      .then((data) => {
        if (data?.items) setJobs(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white text-lg">Saved Job Postings</CardTitle>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {roles.length > 0
            ? `Targeting: ${roles.slice(0, 2).join(", ")}${roles.length > 2 ? ` +${roles.length - 2} more` : ""}`
            : "Jobs you've saved for optimization and applications."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-zinc-500">No saved jobs yet.</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/jobs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add a job posting
              </Link>
            </Button>
          </div>
        )}

        {!loading &&
          jobs.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors gap-3"
            >
              <div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
                  {job.company && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="secondary" className="shrink-0" asChild>
                <Link href={`/optimize?job=${job.id}`}>Optimize CV</Link>
              </Button>
            </div>
          ))}

        {!loading && jobs.length > 5 && (
          <p className="text-center text-xs text-zinc-500">
            +{jobs.length - 5} more —{" "}
            <Link href="/jobs" className="text-blue-400 hover:underline">
              view all
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
