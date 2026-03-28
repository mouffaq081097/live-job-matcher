import type { CvDocumentPayload } from "@/lib/cv-document";
import { getProfile, getExperience, getSkills, getEducation, getProjects, formatDates } from "./shared";

/** Pure ATS-safe template: no Google fonts, no colors, no graphics. System fonts only. */
export function AtsOptimized({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { density: "normal" };
  const tight = gs.density === "compact";

  const profile = getProfile(payload);
  const experience = getExperience(payload);
  const skills = getSkills(payload);
  const education = getEducation(payload);
  const projects = getProjects(payload);

  const wrapper = forPrint
    ? "bg-white text-black px-10 py-8 max-w-[720px] mx-auto"
    : "bg-white text-black px-8 py-7 rounded-xl shadow-xl";

  const sectionClass = tight ? "mb-4" : "mb-6";

  return (
    <div className={wrapper} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      {profile && (
        <header className={sectionClass}>
          {profile.fullName && <p style={{ fontSize: "18px", fontWeight: "bold" }}>{profile.fullName}</p>}
          {profile.jobTitle && <p style={{ fontSize: "13px" }}>{profile.jobTitle}</p>}
          <p style={{ fontSize: "11px", marginTop: "4px" }}>
            {[profile.email, profile.phone, profile.location, profile.linkedin, profile.website].filter(Boolean).join(" | ")}
          </p>
          {profile.summary && <p style={{ marginTop: "6px", lineHeight: "1.5" }}>{profile.summary}</p>}
        </header>
      )}

      {experience.length > 0 && (
        <section className={sectionClass}>
          <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
            WORK EXPERIENCE
          </p>
          {experience.map((e) => (
            <div key={e.id} style={{ marginBottom: "10px" }}>
              <p style={{ fontWeight: "bold" }}>
                {e.title}{e.company ? ` | ${e.company}` : ""}{e.location ? ` | ${e.location}` : ""}
                <span style={{ float: "right", fontWeight: "normal" }}>{formatDates(e.startDate, e.endDate, e.isCurrent)}</span>
              </p>
              {e.bullets.filter(Boolean).map((b, i) => (
                <p key={i} style={{ paddingLeft: "16px" }}>• {b}</p>
              ))}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className={sectionClass}>
          <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
            EDUCATION
          </p>
          {education.map((e) => (
            <div key={e.id} style={{ marginBottom: "6px" }}>
              <p style={{ fontWeight: "bold" }}>
                {[e.degree, e.field].filter(Boolean).join(" in ") || e.institution}
                {(e.degree || e.field) && e.institution ? ` | ${e.institution}` : ""}
                <span style={{ float: "right", fontWeight: "normal" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </p>
              {e.gpa && <p>GPA: {e.gpa}</p>}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className={sectionClass}>
          <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
            SKILLS
          </p>
          {skills.map((cat) => (
            <p key={cat.id}>
              {cat.name ? <strong>{cat.name}: </strong> : null}
              {cat.skills.join(", ")}
            </p>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className={sectionClass}>
          <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
            PROJECTS
          </p>
          {projects.map((p) => (
            <div key={p.id} style={{ marginBottom: "8px" }}>
              <p style={{ fontWeight: "bold" }}>{p.name}{p.url ? ` | ${p.url}` : ""}</p>
              {p.description && <p>{p.description}</p>}
              {p.bullets.filter(Boolean).map((b, i) => (
                <p key={i} style={{ paddingLeft: "16px" }}>• {b}</p>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
