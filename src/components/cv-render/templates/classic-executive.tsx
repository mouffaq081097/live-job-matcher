import type { CvDocumentPayload } from "@/lib/cv-document";
import { getProfile, getExperience, getSkills, getEducation, getProjects, densitySpacing, formatDates } from "./shared";

export function ClassicExecutive({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { fontPair: "merriweather-opensans", accentColor: "#1d4ed8", density: "normal" };
  const sectionGap = densitySpacing[gs.density] ?? "mb-5";
  const headingFont = "var(--font-merriweather), Georgia, 'Times New Roman', serif";
  const bodyFont = "var(--font-open-sans), ui-sans-serif, system-ui, sans-serif";

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
      {/* Header — centered */}
      {profile && (
        <header className={`text-center ${sectionGap}`}>
          {profile.fullName && (
            <h1 className="text-[26px] font-bold tracking-wide text-gray-900" style={{ fontFamily: headingFont }}>
              {profile.fullName}
            </h1>
          )}
          {profile.jobTitle && (
            <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500">{profile.jobTitle}</p>
          )}
          <div className="my-3 border-t-2 border-b border-gray-900 pb-2 pt-2">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-[12px] text-gray-600">
              {profile.email && <span>{profile.email}</span>}
              {profile.phone && <span>{profile.phone}</span>}
              {profile.location && <span>{profile.location}</span>}
              {profile.linkedin && <span>{profile.linkedin}</span>}
              {profile.website && <span>{profile.website}</span>}
            </div>
          </div>
          {profile.summary && (
            <p className="mt-2 text-[13px] leading-relaxed text-gray-700">{profile.summary}</p>
          )}
        </header>
      )}

      {/* Section helper */}
      {experience.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>
            Professional Experience
          </h2>
          <div className="space-y-4">
            {experience.map((e) => (
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
      )}

      {education.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>Education</h2>
          <div className="space-y-3">
            {education.map((e) => (
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
      )}

      {skills.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>Skills</h2>
          <div className="space-y-1.5">
            {skills.map((cat) => (
              <div key={cat.id} className="flex gap-2 text-[13px]">
                {cat.name && <span className="shrink-0 font-semibold text-gray-700">{cat.name}:</span>}
                <span className="text-gray-600">{cat.skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className={sectionGap}>
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-900" style={{ fontFamily: headingFont }}>Projects</h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: headingFont }}>{p.name}</span>
                  {p.url && <span className="text-[11px] italic text-gray-500">{p.url}</span>}
                </div>
                {p.description && <p className="mt-0.5 text-[13px] text-gray-700">{p.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
