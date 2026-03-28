"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SkillGapResult = {
  matched: string[];
  missing: string[];
  summary: string;
};

export function SkillGapAnalysis({
  currentSkills,
  targetRoles,
}: {
  currentSkills: string[];
  targetRoles: string[];
}) {
  const [data, setData] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(null);
    if (targetRoles.length === 0) return;

    setLoading(true);
    void fetch("/api/ai/skill-gap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSkills, targetRoles }),
    })
      .then(async (r) => (r.ok ? ((await r.json()) as SkillGapResult) : null))
      .then((result) => {
        if (result) setData(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentSkills.join(","), targetRoles.join(",")]);

  return (
    <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white text-lg">Skill Gap Analysis</CardTitle>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {targetRoles.length > 0
            ? `AI analysis for: ${targetRoles.join(", ")}`
            : "Add target roles in your profile to see your skill gap."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!loading && targetRoles.length === 0 && (
          <p className="text-sm text-zinc-500">
            Go to your{" "}
            <a href="/profile" className="text-blue-400 hover:underline">
              Profile
            </a>{" "}
            and add target roles to unlock this analysis.
          </p>
        )}

        {!loading && data && (
          <>
            {data.summary && (
              <p className="text-sm text-slate-500 dark:text-zinc-400 italic">{data.summary}</p>
            )}
            <div>
              <h4 className="text-sm font-medium text-slate-600 dark:text-zinc-300 mb-2">
                Matched Skills ({data.matched.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.matched.length > 0 ? (
                  data.matched.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">No matched skills yet.</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-600 dark:text-zinc-300 mb-2">
                Skills to Acquire ({data.missing.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.missing.length > 0 ? (
                  data.missing.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/5"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">You have all the core skills!</span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
