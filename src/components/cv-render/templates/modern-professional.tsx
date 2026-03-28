import type { CvDocumentPayload } from "@/lib/cv-document";
import {
  getProfile, getExperience, getSkills, getEducation, getProjects,
  fontFamilies, densitySpacing, formatDates,
} from "./shared";

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

  const profile = getProfile(payload);
  const experience = getExperience(payload);
  const skills = getSkills(payload);
  const education = getEducation(payload);
  const projects = getProjects(payload);

  const wrapper = forPrint
    ? "bg-white text-gray-900 px-10 py-8 max-w-[720px] mx-auto"
    : "bg-white text-gray-900 px-8 py-7 rounded-xl shadow-xl";

  return (
    <div className={wrapper} style={{ fontFamily: fonts.body }}>
      {/* Header */}
      {profile && (
        <header className={sectionGap}>
          {profile.fullName && (
            <h1
              className="text-[28px] font-bold leading-tight tracking-tight"
              style={{ fontFamily: fonts.heading, color: accent }}
            >
              {profile.fullName}
            </h1>
          )}
          {profile.jobTitle && (
            <p className="mt-0.5 text-[15px] font-medium text-gray-600">{profile.jobTitle}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-gray-500">
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && <span>{profile.phone}</span>}
            {profile.location && <span>{profile.location}</span>}
            {profile.linkedin && <span>{profile.linkedin}</span>}
            {profile.website && <span>{profile.website}</span>}
          </div>
          {profile.summary && (
            <p className="mt-3 text-[13px] leading-relaxed text-gray-700">{profile.summary}</p>
          )}
        </header>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className={sectionGap}>
          <h2
            className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ borderBottom: `2px solid ${accent}`, color: accent }}
          >
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((e) => (
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
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className={sectionGap}>
          <h2
            className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ borderBottom: `2px solid ${accent}`, color: accent }}
          >
            Skills
          </h2>
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

      {/* Education */}
      {education.length > 0 && (
        <section className={sectionGap}>
          <h2
            className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ borderBottom: `2px solid ${accent}`, color: accent }}
          >
            Education
          </h2>
          <div className="space-y-3">
            {education.map((e) => (
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
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className={sectionGap}>
          <h2
            className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ borderBottom: `2px solid ${accent}`, color: accent }}
          >
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold text-gray-900">{p.name}</span>
                  {p.url && <span className="shrink-0 text-[11px] text-gray-400">{p.url}</span>}
                </div>
                {p.description && <p className="mt-0.5 text-[13px] text-gray-700">{p.description}</p>}
                {p.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {p.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="list-disc text-[13px] text-gray-700">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
