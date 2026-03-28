import type { CvDocumentPayload } from "@/lib/cv-document";
import { getProfile, getExperience, getSkills, getEducation, getProjects, densitySpacing, formatDates } from "./shared";

export function CreativeMinimalist({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { fontPair: "playfair-lato", accentColor: "#1d4ed8", density: "normal" };
  const sectionGap = densitySpacing[gs.density] ?? "mb-5";
  const accent = gs.accentColor;
  const headingFont = "var(--font-playfair), Georgia, serif";
  const bodyFont = "var(--font-lato), ui-sans-serif, system-ui, sans-serif";

  const profile = getProfile(payload);
  const experience = getExperience(payload);
  const skills = getSkills(payload);
  const education = getEducation(payload);
  const projects = getProjects(payload);

  const wrapper = forPrint
    ? "bg-white text-gray-900 px-10 py-8 max-w-[720px] mx-auto"
    : "bg-white text-gray-900 px-8 py-7 rounded-xl shadow-xl";

  return (
    <div className={wrapper} style={{ fontFamily: bodyFont }}>
      {profile && (
        <header className={sectionGap}>
          {profile.fullName && (
            <h1
              className="text-[38px] font-bold leading-none tracking-tight"
              style={{ fontFamily: headingFont, color: accent }}
            >
              {profile.fullName}
            </h1>
          )}
          {profile.jobTitle && (
            <p className="mt-2 text-[14px] font-light uppercase tracking-[0.25em] text-gray-500">{profile.jobTitle}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 text-[12px] text-gray-400">
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && <span>{profile.phone}</span>}
            {profile.location && <span>{profile.location}</span>}
            {profile.linkedin && <span>{profile.linkedin}</span>}
            {profile.website && <span>{profile.website}</span>}
          </div>
          {profile.summary && (
            <p className="mt-4 max-w-xl text-[14px] leading-loose text-gray-600">{profile.summary}</p>
          )}
        </header>
      )}

      {experience.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">Experience</h2>
          <div className="space-y-5">
            {experience.map((e) => (
              <div key={e.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[15px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>{e.title}</span>
                    {e.company && <span className="ml-2 text-[13px] text-gray-500">{e.company}</span>}
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">{formatDates(e.startDate, e.endDate, e.isCurrent)}</span>
                </div>
                {e.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {e.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="relative text-[13px] text-gray-600 before:absolute before:-left-4 before:text-gray-300 before:content-['—']">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">Skills</h2>
          <div className="space-y-2">
            {skills.map((cat) => (
              <div key={cat.id} className="flex flex-wrap gap-1.5">
                {cat.name && <span className="text-[12px] font-semibold text-gray-500 mr-1">{cat.name}:</span>}
                {cat.skills.map((s) => (
                  <span key={s} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${accent}18`, color: accent }}>
                    {s}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">Education</h2>
          <div className="space-y-3">
            {education.map((e) => (
              <div key={e.id} className="break-inside-avoid flex items-baseline justify-between">
                <div>
                  <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>
                    {[e.degree, e.field].filter(Boolean).join(" in ") || e.institution}
                  </span>
                  {(e.degree || e.field) && e.institution && (
                    <span className="ml-2 text-[12px] text-gray-500">{e.institution}</span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-gray-400">{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">Projects</h2>
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>{p.name}</span>
                  {p.url && <span className="text-[11px] text-gray-400">{p.url}</span>}
                </div>
                {p.description && <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{p.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
