"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Keyword = { label: string; kind: "hard" | "soft"; found: boolean };

export function KeywordHeatmap({ keywords }: { keywords: Keyword[] }) {
  const wasRef = useRef<Record<string, boolean>>({});
  const [pingKey, setPingKey] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    for (const kw of keywords) {
      const was = wasRef.current[kw.label] ?? false;
      wasRef.current[kw.label] = kw.found;
      if (kw.found && !was) {
        const label = kw.label;
        queueMicrotask(() => setPingKey(label));
        timeout = setTimeout(() => setPingKey(null), 480);
      }
    }
    return () => clearTimeout(timeout);
  }, [keywords]);

  return (
    <div className="w-[min(100%,240px)] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120]/95 p-4 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Keyword heatmap
      </p>
      {keywords.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">Run analysis to see keywords.</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {keywords.map((kw) => (
            <li
              key={kw.label}
              className={cn(
                "flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors",
                kw.found
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-red-500/10 text-red-300",
                pingKey === kw.label && kw.found && "animate-keyword-ping",
              )}
            >
              <span>{kw.label}</span>
              <span className="tabular-nums">{kw.found ? "✓" : "·"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
