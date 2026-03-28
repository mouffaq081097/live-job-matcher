import type { ProjectEntry } from "@/lib/cv-content";

export function ProjectsSection({ entries }: { entries: ProjectEntry[] }) {
  if (!entries.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b border-gray-300 pb-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
        Projects
      </h2>
      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="break-inside-avoid">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[14px] font-semibold text-gray-900">{e.name}</span>
              {e.url && (
                <span className="shrink-0 text-[11px] text-gray-400 print:underline">
                  {e.url}
                </span>
              )}
            </div>
            {e.description && (
              <p className="mt-0.5 text-[13px] text-gray-700">{e.description}</p>
            )}
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
