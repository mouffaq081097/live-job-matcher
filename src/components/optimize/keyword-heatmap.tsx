"use client";

import { useEffect, useRef, useState } from "react";
import { OPTIMIZE_KEYWORDS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function KeywordHeatmap({ cvText }: { cvText: string }) {
  const lower = cvText.toLowerCase();
  const wasRef = useRef<Record<string, boolean>>(
    Object.fromEntries(OPTIMIZE_KEYWORDS.map((k) => [k, false])),
  );
  const [pingKey, setPingKey] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    for (const k of OPTIMIZE_KEYWORDS) {
      const ok = lower.includes(k.toLowerCase());
      const was = wasRef.current[k];
      wasRef.current[k] = ok;
      if (ok && !was) {
        queueMicrotask(() => setPingKey(k));
        timeout = setTimeout(() => setPingKey(null), 480);
      }
    }
    return () => clearTimeout(timeout);
  }, [cvText, lower]);

  return (
    <div className="w-[min(100%,240px)] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120]/95 p-4 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Keyword heatmap
      </p>
      <ul className="mt-3 space-y-2">
        {OPTIMIZE_KEYWORDS.map((k) => {
          const ok = lower.includes(k.toLowerCase());
          return (
            <li
              key={k}
              className={cn(
                "flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors",
                ok
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-red-500/10 text-red-300",
                pingKey === k && ok && "animate-keyword-ping",
              )}
            >
              <span>{k}</span>
              <span className="tabular-nums">{ok ? "✓" : "·"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
