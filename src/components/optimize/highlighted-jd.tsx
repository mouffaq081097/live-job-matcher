"use client";

type Segment = { text: string; kind: "hard" | "soft" | null };

function buildSegments(text: string, hard: string[], soft: string[]): Segment[] {
  const all = [
    ...hard.map((k) => ({ k, kind: "hard" as const })),
    ...soft.map((k) => ({ k, kind: "soft" as const })),
  ].sort((a, b) => b.k.length - a.k.length);

  if (!all.length) return [{ text, kind: null }];

  const escaped = all.map(({ k }) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), kind: null });
    }
    const matched = match[0];
    const entry = all.find(({ k }) => k.toLowerCase() === matched.toLowerCase());
    segments.push({ text: matched, kind: entry?.kind ?? null });
    last = regex.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last), kind: null });
  return segments;
}

export function HighlightedJobDescription({
  text,
  hardKeywords,
  softKeywords,
}: {
  text: string;
  hardKeywords: string[];
  softKeywords: string[];
}) {
  const segments = buildSegments(text, hardKeywords, softKeywords);
  return (
    <div className="min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
      {segments.map((seg, i) => {
        if (seg.kind === "hard") {
          return (
            <span key={i} className="rounded bg-blue-500/15 px-0.5 text-blue-600 dark:text-blue-300">
              {seg.text}
            </span>
          );
        }
        if (seg.kind === "soft") {
          return (
            <span key={i} className="rounded bg-purple-500/15 px-0.5 text-purple-600 dark:text-purple-300">
              {seg.text}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </div>
  );
}
