import type { CvDocumentPayload } from "@/lib/cv-document";
import { getProfile, getExperience, getSkills, getEducation, getProjects, fontFamilies, formatDates } from "./shared";

/**
 * Hybrid Sidebar template.
 *
 * ATS-safe DOM order: Profile → Skills → Education → Experience → Projects
 * Visual layout uses CSS `order` to place Skills/Contact in the left column
 * and Experience/Projects in the right column, WITHOUT reordering the DOM.
 */
export function HybridSidebar({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { fontPair: "inter-roboto", accentColor: "#1d4ed8", density: "normal" };
  const fonts = fontFamilies[gs.fontPair] ?? fontFamilies["inter-roboto"];
  const accent = gs.accentColor;

  const profile = getProfile(payload);
  const experience = getExperience(payload);
  const skills = getSkills(payload);
  const education = getEducation(payload);
  const projects = getProjects(payload);

  const wrapper = forPrint
    ? "bg-white text-gray-900 max-w-[720px] mx-auto overflow-hidden"
    : "bg-white text-gray-900 rounded-xl shadow-xl overflow-hidden";

  const sidebarStyle = {
    background: `${accent}0f`,
    borderRight: `3px solid ${accent}30`,
  };

  return (
    <div className={wrapper} style={{ fontFamily: fonts.body }}>
      {/* Name banner — full width */}
      {profile && (
        <div className="px-6 py-5" style={{ borderBottom: `2px solid ${accent}` }}>
          {profile.fullName && (
            <h1 className="text-[24px] font-bold leading-tight" style={{ fontFamily: fonts.heading, color: accent }}>
              {profile.fullName}
            </h1>
          )}
          {profile.jobTitle && (
            <p className="mt-0.5 text-[13px] font-medium text-gray-500">{profile.jobTitle}</p>
          )}
        </div>
      )}

      {/* Two-column body — DOM order: sidebar content first, then main */}
      <div className="flex min-h-0" style={{ alignItems: "stretch" }}>
        {/* LEFT SIDEBAR — order:1 visually */}
        <aside className="w-[210px] shrink-0 px-4 py-5 space-y-5" style={{ ...sidebarStyle, order: 1 }}>
          {/* Contact */}
          {profile && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Contact</h3>
              <div className="space-y-1 text-[11px] text-gray-600">
                {profile.email && <p>{profile.email}</p>}
                {profile.phone && <p>{profile.phone}</p>}
                {profile.location && <p>{profile.location}</p>}
                {profile.linkedin && <p className="break-all">{profile.linkedin}</p>}
                {profile.website && <p className="break-all">{profile.website}</p>}
              </div>
            </div>
          )}

          {/* Summary */}
          {profile?.summary && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Summary</h3>
              <p className="text-[11px] leading-relaxed text-gray-600">{profile.summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Skills</h3>
              <div className="space-y-2">
                {skills.map((cat) => (
                  <div key={cat.id}>
                    {cat.name && <p className="text-[11px] font-semibold text-gray-700">{cat.name}</p>}
                    <p className="text-[11px] text-gray-600">{cat.skills.join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Education</h3>
              <div className="space-y-2">
                {education.map((e) => (
                  <div key={e.id}>
                    <p className="text-[11px] font-semibold text-gray-800">
                      {[e.degree, e.field].filter(Boolean).join(" in ") || e.institution}
                    </p>
                    {(e.degree || e.field) && e.institution && (
                      <p className="text-[11px] text-gray-600">{e.institution}</p>
                    )}
                    <p className="text-[10px] text-gray-400">{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</p>
                    {e.gpa && <p className="text-[10px] text-gray-400">GPA: {e.gpa}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN — order:2 visually */}
        <main className="flex-1 min-w-0 px-5 py-5 space-y-5" style={{ order: 2 }}>
          {experience.length > 0 && (
            <section>
              <h2 className="mb-3 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Experience
              </h2>
              <div className="space-y-4">
                {experience.map((e) => (
                  <div key={e.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[13px] font-bold text-gray-900">{e.title}</span>
                        {e.company && <span className="ml-1.5 text-[12px] text-gray-600">· {e.company}</span>}
                      </div>
                      <span className="shrink-0 text-[10px] text-gray-400">{formatDates(e.startDate, e.endDate, e.isCurrent)}</span>
                    </div>
                    {e.location && <p className="text-[11px] text-gray-400">{e.location}</p>}
                    {e.bullets.filter(Boolean).length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 pl-3.5">
                        {e.bullets.filter(Boolean).map((b, i) => (
                          <li key={i} className="list-disc text-[12px] text-gray-700">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h2 className="mb-3 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                Projects
              </h2>
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-bold text-gray-900">{p.name}</span>
                      {p.url && <span className="text-[10px] text-gray-400">{p.url}</span>}
                    </div>
                    {p.description && <p className="mt-0.5 text-[12px] text-gray-700">{p.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
