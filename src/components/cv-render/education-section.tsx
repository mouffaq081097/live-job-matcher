import type { EducationEntry } from "@/lib/cv-content";

export function EducationSection({ entries }: { entries: EducationEntry[] }) {
  if (!entries.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b border-gray-300 pb-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
        Education
      </h2>
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="break-inside-avoid">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[14px] font-semibold text-gray-900">
                  {[e.degree, e.field].filter(Boolean).join(" in ") || e.institution}
                </span>
                {(e.degree || e.field) && e.institution && (
                  <span className="ml-2 text-[13px] text-gray-600">
                    {e.institution}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
                {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
              </span>
            </div>
            {e.gpa && (
              <p className="mt-0.5 text-[12px] text-gray-500">GPA: {e.gpa}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
