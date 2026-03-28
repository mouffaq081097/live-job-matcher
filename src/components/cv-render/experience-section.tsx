import type { ExperienceEntry } from "@/lib/cv-content";

export function ExperienceSection({ entries }: { entries: ExperienceEntry[] }) {
  if (!entries.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b border-gray-300 pb-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
        Work Experience
      </h2>
      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="break-inside-avoid">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[14px] font-semibold text-gray-900">{e.title}</span>
                {e.company && (
                  <span className="ml-2 text-[13px] text-gray-600">@ {e.company}</span>
                )}
                {e.location && (
                  <span className="ml-2 text-[12px] text-gray-400">· {e.location}</span>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
                {[e.startDate, e.isCurrent ? "Present" : e.endDate]
                  .filter(Boolean)
                  .join(" – ")}
              </span>
            </div>
            {e.bullets.length > 0 && (
              <ul className="mt-1.5 space-y-1 pl-4">
                {e.bullets.map((b, i) => (
                  <li key={i} className="list-disc text-[13px] leading-snug text-gray-700">
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
