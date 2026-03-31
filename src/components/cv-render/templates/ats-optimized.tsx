import type { CvDocumentPayload } from "@/lib/cv-document";
import type { CvBlock } from "@/stores/cv-builder-store";
import { defaultContent } from "@/lib/cv-content";
import { formatDates } from "./shared";

/** Pure ATS-safe template: no Google fonts, no colors, no graphics. System fonts only. */
export function AtsOptimized({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { density: "normal" };
  const tight = gs.density === "compact";

  const wrapper = forPrint
    ? "bg-white text-black px-10 py-8 max-w-[720px] mx-auto"
    : "bg-white text-black px-8 py-7 rounded-xl shadow-xl";

  const sectionClass = tight ? "mb-4" : "mb-6";

  return (
    <div className={wrapper} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      {payload.blockIds.map((id) => {
        const block = payload.blocks[id] as CvBlock | undefined;
        if (!block || block.hidden) return null;
        const content = block.content ?? defaultContent(block.template);

        if (block.template === "profile" && content.type === "profile") {
          const p = content.data;
          return (
            <header key={id} className={sectionClass}>
              {p.fullName && <p style={{ fontSize: "18px", fontWeight: "bold" }}>{p.fullName}</p>}
              {p.jobTitle && <p style={{ fontSize: "13px" }}>{p.jobTitle}</p>}
              <p style={{ fontSize: "11px", marginTop: "4px" }}>
                {[p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(" | ")}
              </p>
              {p.summary && <p style={{ marginTop: "6px", lineHeight: "1.5" }}>{p.summary}</p>}
            </header>
          );
        }

        if (block.template === "experience" && content.type === "experience") {
          const entries = content.data;
          return (
            <section key={id} className={sectionClass}>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
                WORK EXPERIENCE
              </p>
              {!entries.length && <p style={{ fontStyle: "italic", color: "#aaa" }}>No entries yet.</p>}
              {entries.map((e) => (
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
          );
        }

        if (block.template === "skills" && content.type === "skills") {
          const cats = content.data;
          return (
            <section key={id} className={sectionClass}>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
                SKILLS
              </p>
              {!cats.length && <p style={{ fontStyle: "italic", color: "#aaa" }}>No skills yet.</p>}
              {cats.map((cat) => (
                <p key={cat.id}>
                  {cat.name ? <strong>{cat.name}: </strong> : null}
                  {cat.skills.join(", ")}
                </p>
              ))}
            </section>
          );
        }

        if (block.template === "education" && content.type === "education") {
          const entries = content.data;
          return (
            <section key={id} className={sectionClass}>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
                EDUCATION
              </p>
              {!entries.length && <p style={{ fontStyle: "italic", color: "#aaa" }}>No entries yet.</p>}
              {entries.map((e) => (
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
          );
        }

        if (block.template === "certifications" && content.type === "certifications") {
          const entries = content.data;
          return (
            <section key={id} className={sectionClass}>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
                CERTIFICATIONS
              </p>
              {!entries.length && <p style={{ fontStyle: "italic", color: "#aaa" }}>No entries yet.</p>}
              {entries.map((e) => (
                <div key={e.id} style={{ marginBottom: "6px" }}>
                  <p style={{ fontWeight: "bold" }}>
                    {e.name}{e.issuer ? ` | ${e.issuer}` : ""}
                    <span style={{ float: "right", fontWeight: "normal" }}>{[e.issueDate, e.expiryDate].filter(Boolean).join(" – ")}</span>
                  </p>
                  {e.credentialId && <p>Credential ID: {e.credentialId}</p>}
                </div>
              ))}
            </section>
          );
        }

        if (block.template === "projects" && content.type === "projects") {
          const entries = content.data;
          return (
            <section key={id} className={sectionClass}>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid black", paddingBottom: "2px", marginBottom: "8px" }}>
                PROJECTS
              </p>
              {!entries.length && <p style={{ fontStyle: "italic", color: "#aaa" }}>No entries yet.</p>}
              {entries.map((pr) => (
                <div key={pr.id} style={{ marginBottom: "8px" }}>
                  <p style={{ fontWeight: "bold" }}>{pr.name}{pr.url ? ` | ${pr.url}` : ""}</p>
                  {pr.description && <p>{pr.description}</p>}
                  {pr.bullets.filter(Boolean).map((b, i) => (
                    <p key={i} style={{ paddingLeft: "16px" }}>• {b}</p>
                  ))}
                </div>
              ))}
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
