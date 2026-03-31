import type { CvDocumentPayload } from "@/lib/cv-document";
import type { CvBlock } from "@/stores/cv-builder-store";
import { defaultContent } from "@/lib/cv-content";
import { fontFamilies, densitySpacing, formatDates } from "./shared";


export function ModernProfessional({
  payload,
  forPrint = false,
}: {
  payload: CvDocumentPayload;
  forPrint?: boolean;
}) {
  const gs = payload.globalStyles ?? { fontPair: "inter-roboto", accentColor: "#1d4ed8", density: "normal" };
  const fonts = fontFamilies[gs.fontPair] ?? fontFamilies["inter-roboto"];
  const sectionGap = densitySpacing[gs.density] ?? "mb-5";
  const accent = gs.accentColor;

  const wrapper = forPrint
    ? "bg-white text-gray-900 px-10 py-8 max-w-[720px] mx-auto"
    : "bg-white text-gray-900 px-8 py-7 rounded-xl shadow-xl";

  return (
    <div className={wrapper} style={{ fontFamily: fonts.body }}>
      {payload.blockIds.map((id) => {
        const block = payload.blocks[id] as CvBlock | undefined;
        if (!block || block.hidden) return null;
        const content = block.content ?? defaultContent(block.template);

        if (block.template === "profile" && content.type === "profile") {
          const p = content.data;
          return (
            <header key={id} className={sectionGap}>
              {p.fullName && (
                <h1 className="text-[28px] font-bold leading-tight tracking-tight" style={{ fontFamily: fonts.heading, color: accent }}>
                  {p.fullName}
                </h1>
              )}
              {p.jobTitle && <p className="mt-0.5 text-[15px] font-medium text-gray-600">{p.jobTitle}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-gray-500">
                {p.email && <span>{p.email}</span>}
                {p.phone && <span>{p.phone}</span>}
                {p.location && <span>{p.location}</span>}
                {p.linkedin && <span>{p.linkedin}</span>}
                {p.website && <span>{p.website}</span>}
              </div>
              {p.summary && <p className="mt-3 text-[13px] leading-relaxed text-gray-700">{p.summary}</p>}
            </header>
          );
        }

        if (block.template === "experience" && content.type === "experience") {
          const entries = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Experience
              </h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet — expand this section to add experience.</p>}
              <div className="space-y-4">
                {entries.map((e) => (
                  <div key={e.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[14px] font-semibold text-gray-900">{e.title}</span>
                        {e.company && <span className="ml-2 text-[13px] text-gray-600">· {e.company}</span>}
                        {e.location && <span className="ml-2 text-[12px] text-gray-400">· {e.location}</span>}
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-400">{formatDates(e.startDate, e.endDate, e.isCurrent)}</span>
                    </div>
                    {e.bullets.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 pl-4">
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
              <h2 className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Skills
              </h2>
              {!cats.length
                ? <p className="text-[12px] italic text-gray-300">No skills yet — expand to add skills.</p>
                : <div className="space-y-1.5">
                    {cats.map((cat) => (
                      <div key={cat.id} className="flex gap-2 text-[13px]">
                        {cat.name && <span className="shrink-0 font-semibold text-gray-700">{cat.name}:</span>}
                        <span className="text-gray-600">{cat.skills.join(", ")}</span>
                      </div>
                    ))}
                  </div>
              }
            </section>
          );
        }

        if (block.template === "education" && content.type === "education") {
          const entries = content.data;
          return (
            <section key={id} className={sectionGap}>
              <h2 className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Education
              </h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet — expand to add education.</p>}
              <div className="space-y-3">
                {entries.map((e) => (
                  <div key={e.id} className="break-inside-avoid flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[14px] font-semibold text-gray-900">
                        {[e.degree, e.field].filter(Boolean).join(" in ") || e.institution}
                      </span>
                      {(e.degree || e.field) && e.institution && (
                        <span className="ml-2 text-[13px] text-gray-600">· {e.institution}</span>
                      )}
                      {e.gpa && <span className="ml-2 text-[12px] text-gray-400">· GPA {e.gpa}</span>}
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
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
              <h2 className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Certifications
              </h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No certifications yet — expand to add one.</p>}
              <div className="space-y-2">
                {entries.map((e) => (
                  <div key={e.id} className="break-inside-avoid flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[13px] font-semibold text-gray-900">{e.name}</span>
                      {e.issuer && <span className="ml-2 text-[12px] text-gray-600">· {e.issuer}</span>}
                      {e.credentialId && <span className="ml-2 text-[11px] text-gray-400">· ID: {e.credentialId}</span>}
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">{[e.issueDate, e.expiryDate].filter(Boolean).join(" – ")}</span>
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
              <h2 className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Projects
              </h2>
              {!entries.length && <p className="text-[12px] italic text-gray-300">No entries yet — expand to add projects.</p>}
              <div className="space-y-3">
                {entries.map((pr) => (
                  <div key={pr.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-semibold text-gray-900">{pr.name}</span>
                      {pr.url && <span className="shrink-0 text-[11px] text-gray-400">{pr.url}</span>}
                    </div>
                    {pr.description && <p className="mt-0.5 text-[13px] text-gray-700">{pr.description}</p>}
                    {pr.bullets.filter(Boolean).length > 0 && (
                      <ul className="mt-1 space-y-0.5 pl-4">
                        {pr.bullets.filter(Boolean).map((b, i) => (
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

        return null;
      })}
    </div>
  );
}
