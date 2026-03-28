"use client";

import { cn } from "@/lib/utils";

export function AtsScoreBar({
  score,
  label = "ATS score",
  className,
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));
  const color =
    pct >= 80 ? "from-emerald-500 to-emerald-400" : "from-blue-500 to-blue-400";

  return (
    <div className={cn("rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{pct}</p>
        </div>
        <div className="h-2 flex-1 max-w-[200px] overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
