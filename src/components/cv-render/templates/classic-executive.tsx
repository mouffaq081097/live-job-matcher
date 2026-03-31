import type { CvDocumentPayload } from "@/lib/cv-document";
import type { CvBlock } from "@/stores/cv-builder-store";
import { defaultContent } from "@/lib/cv-content";
import { densitySpacing, formatDates } from "./shared";

export function ClassicExecutive({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { fontPair: "merriweather-opensans", accentColor: "#1d4ed8", density: "normal" };
  const sectionGap = densitySpacing[gs.density] ?? "mb-5";
  const headingFont = "var(--font-merriweather), Georgia, 'Times New Roman', serif";
  const bodyFont = "var(--font-open-sans), ui-sans-serif, system-ui, sans-serif";

  const wrapper = forPrint
    ? "bg-white text-gray-900 px-10 py-8 max-w-[720px] mx-auto"
    : "bg-white text-gray-900 px-8 py-7 rounded-xl shadow-xl";

  return (
    <div className={wrapper} style={{ fontFamily: bodyFont }}>
      {payload.blockIds.map((id) => {
        const block = payload.blocks[id] as CvBlock | undefined;
        if (!block || block.hidden) return null;
        const content = block.content ?? defaultContent(block.template);

        if (block.template === "profile" && content.type === "profile") {
          const p = content.data;
          return (
            <header key={id} className={`text-center ${sectionGap}`}>
              {p.fullName && (
                <h1 className="text-[26px] font-bold tracking-wide text-gray-900" style={{ fontFamily: headingFont }}>
                  {p.fullName}
                </h1>
              )}
              {p.jobTitle && (
                <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500">{p.jobTitle}</p>
              )}
              <div className="my-3 border-t-2 border-b border-gray-900 pb-2 pt-2">
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-[12px] text-gray-600">
                  {p.email && <span>{p.email}</span>}
                  {p.phone && <span>{p.phone}</span>}
                  {p.location && <span>{p.location}</span>}
                  {p.linkedin && <span>{p.linkedin}</span>}
                  {p.website && <span>{p.website}</span>}
                </div>
              </div>
              {p.summary && <p className="mt-2 text-[13px] leading-relaxed text-gray-700">{p.summary}</p>}
            </header>
          );
        }

        if (block.template === "experience" && content.type === "experience") {
          const entries = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>
                Professional Experience
              </h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet.</p>}
              <div className="space-y-4">
                {entries.map((e) => (
                  <div key={e.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>{e.title}</span>
                        {e.company && <span className="ml-2 text-[13px] font-semibold text-gray-700">{e.company}</span>}
                        {e.location && <span className="ml-2 text-[12px] italic text-gray-500">{e.location}</span>}
                      </div>
                      <span className="shrink-0 text-[11px] italic text-gray-500">{formatDates(e.startDate, e.endDate, e.isCurrent)}</span>
                    </div>
                    {e.bullets.filter(Boolean).length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 pl-5">
                        {e.bullets.filter(Boolean).map((b, i) => (
                          <li key={i} className="list-disc text-[13px] text-gray-700">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.template === "skills" && content.type === "skills") {
          const cats = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>Skills</h2>
              {!cats.length && <p className="text-[12px] italic text-gray-300">No skills yet.</p>}
              <div className="space-y-1.5">
                {cats.map((cat) => (
                  <div key={cat.id} className="flex gap-2 text-[13px]">
                    {cat.name && <span className="shrink-0 font-semibold text-gray-700">{cat.name}:</span>}
                    <span className="text-gray-600">{cat.skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.template === "education" && content.type === "education") {
          const entries = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>Education</h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet.</p>}
              <div className="space-y-3">
                {entries.map((e) => (
                  <div key={e.id} className="break-inside-avoid flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>
                        {[e.degree, e.field].filter(Boolean).join(" in ") || e.institution}
                      </span>
                      {(e.degree || e.field) && e.institution && (
                        <span className="ml-2 text-[13px] text-gray-600">{e.institution}</span>
                      )}
                      {e.gpa && <span className="ml-2 text-[12px] italic text-gray-500">GPA: {e.gpa}</span>}
                    </div>
                    <span className="shrink-0 text-[11px] italic text-gray-500">{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.template === "certifications" && content.type === "certifications") {
          const entries = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>
                Certifications
              </h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet.</p>}
              <div className="space-y-2">
                {entries.map((e) => (
                  <div key={e.id} className="break-inside-avoid flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[13px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>{e.name}</span>
                      {e.issuer && <span className="ml-2 text-[12px] text-gray-700">{e.issuer}</span>}
                      {e.credentialId && <span className="ml-2 text-[11px] italic text-gray-500">ID: {e.credentialId}</span>}
                    </div>
                    <span className="shrink-0 text-[11px] italic text-gray-500">{[e.issueDate, e.expiryDate].filter(Boolean).join(" – ")}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.template === "projects" && content.type === "projects") {
          const entries = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>Projects</h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet.</p>}
              <div className="space-y-3">
                {entries.map((pr) => (
                  <div key={pr.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>{pr.name}</span>
                      {pr.url && <span className="text-[11px] italic text-gray-500">{pr.url}</span>}
                    </div>
                    {pr.description && <p className="mt-0.5 text-[13px] text-gray-700">{pr.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
