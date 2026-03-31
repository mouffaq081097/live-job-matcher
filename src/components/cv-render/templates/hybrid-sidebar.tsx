import type { CvDocumentPayload } from "@/lib/cv-document";
import type { CvBlock } from "@/stores/cv-builder-store";
import { defaultContent } from "@/lib/cv-content";
import { fontFamilies, formatDates } from "./shared";

/**
 * Hybrid Sidebar template.
 *
 * Profile always renders as a full-width banner at the top.
 * Skills/Education render in the left sidebar in blockIds order.
 * Experience/Projects render in the right main column in blockIds order.
 */
export function HybridSidebar({ payload, forPrint = false }: { payload: CvDocumentPayload; forPrint?: boolean }) {
  const gs = payload.globalStyles ?? { fontPair: "inter-roboto", accentColor: "#1d4ed8", density: "normal" };
  const fonts = fontFamilies[gs.fontPair] ?? fontFamilies["inter-roboto"];
  const accent = gs.accentColor;

  const wrapper = forPrint
    ? "bg-white text-gray-900 max-w-[720px] mx-auto overflow-hidden"
    : "bg-white text-gray-900 rounded-xl shadow-xl overflow-hidden";

  const sidebarStyle = {
    background: `${accent}0f`,
    borderRight: `3px solid ${accent}30`,
  };

  // Collect profile block for the banner
  let profileBlock: CvBlock | null = null;
  for (const id of payload.blockIds) {
    const b = payload.blocks[id] as CvBlock | undefined;
    if (b && !b.hidden && b.template === "profile") { profileBlock = b; break; }
  }
  const profileContent = profileBlock
    ? (profileBlock.content ?? defaultContent("profile"))
    : null;
  const profile = profileContent?.type === "profile" ? profileContent.data : null;

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

      {/* Two-column body */}
      <div className="flex min-h-0" style={{ alignItems: "stretch" }}>
        {/* LEFT SIDEBAR */}
        <aside className="w-[210px] shrink-0 px-4 py-5 space-y-5" style={{ ...sidebarStyle, order: 1 }}>
          {/* Contact — always shown when profile exists */}
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
          {profile?.summary && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Summary</h3>
              <p className="text-[11px] leading-relaxed text-gray-600">{profile.summary}</p>
            </div>
          )}

          {/* Skills & Education in blockIds order */}
          {payload.blockIds.map((id) => {
            const block = payload.blocks[id] as CvBlock | undefined;
            if (!block || block.hidden) return null;
            const content = block.content ?? defaultContent(block.template);

            if (block.template === "skills" && content.type === "skills") {
              const cats = content.data;
              if (!cats.length) return null;
              return (
                <div key={id}>
                  <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Skills</h3>
                  <div className="space-y-2">
                    {cats.map((cat) => (
                      <div key={cat.id}>
                        {cat.name && <p className="text-[11px] font-semibold text-gray-700">{cat.name}</p>}
                        <p className="text-[11px] text-gray-600">{cat.skills.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (block.template === "certifications" && content.type === "certifications") {
              const entries = content.data;
              if (!entries.length) return null;
              return (
                <div key={id}>
                  <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Certifications</h3>
                  <div className="space-y-2">
                    {entries.map((e) => (
                      <div key={e.id}>
                        <p className="text-[11px] font-semibold text-gray-800">{e.name}</p>
                        {e.issuer && <p className="text-[11px] text-gray-600">{e.issuer}</p>}
                        <p className="text-[10px] text-gray-400">{[e.issueDate, e.expiryDate].filter(Boolean).join(" – ")}</p>
                        {e.credentialId && <p className="text-[10px] text-gray-400">ID: {e.credentialId}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (block.template === "education" && content.type === "education") {
              const entries = content.data;
              if (!entries.length) return null;
              return (
                <div key={id}>
                  <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>Education</h3>
                  <div className="space-y-2">
                    {entries.map((e) => (
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
              );
            }

            return null;
          })}
        </aside>

        {/* RIGHT MAIN — Experience & Projects in blockIds order */}
        <main className="flex-1 min-w-0 px-5 py-5 space-y-5" style={{ order: 2 }}>
          {payload.blockIds.map((id) => {
            const block = payload.blocks[id] as CvBlock | undefined;
            if (!block || block.hidden) return null;
            const content = block.content ?? defaultContent(block.template);

            if (block.template === "experience" && content.type === "experience") {
              const entries = content.data;
              if (!entries.length) return null;
              return (
                <section key={id}>
                  <h2 className="mb-3 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                    Experience
                  </h2>
                  <div className="space-y-4">
                    {entries.map((e) => (
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
              );
            }

            if (block.template === "projects" && content.type === "projects") {
              const entries = content.data;
              if (!entries.length) return null;
              return (
                <section key={id}>
                  <h2 className="mb-3 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: `2px solid ${accent}`, color: accent }}>
                    Projects
                  </h2>
                  <div className="space-y-3">
                    {entries.map((pr) => (
                      <div key={pr.id} className="break-inside-avoid">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[13px] font-bold text-gray-900">{pr.name}</span>
                          {pr.url && <span className="text-[10px] text-gray-400">{pr.url}</span>}
                        </div>
                        {pr.description && <p className="mt-0.5 text-[12px] text-gray-700">{pr.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return null;
          })}
        </main>
      </div>
    </div>
  );
}
