"use client";

import { classifyToken } from "@/lib/ats-optimize";

function tokenize(text: string): string[] {
  return text.split(/(\s+)/);
}

export function HighlightedJobDescription({ text }: { text: string }) {
  const parts = tokenize(text);
  return (
    <div className="min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
      {parts.map((part, i) => {
        const kind = classifyToken(part);
        if (kind === "hard") {
          return (
            <span
              key={i}
              className="rounded bg-blue-500/15 px-0.5 text-blue-300"
            >
              {part}
            </span>
          );
        }
        if (kind === "soft") {
          return (
            <span
              key={i}
              className="rounded bg-purple-500/15 px-0.5 text-purple-300"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
