import type { CvDocumentPayload } from "./cv-document";
import type { CvBlock } from "@/stores/cv-builder-store";
import type {
  ProfileContent,
  ExperienceEntry,
  SkillCategory,
  EducationEntry,
  ProjectEntry,
} from "./cv-content";

function renderProfile(data: ProfileContent): string {
  const lines: string[] = [];
  if (data.fullName) lines.push(data.fullName);
  if (data.jobTitle) lines.push(data.jobTitle);
  const contact = [data.email, data.phone, data.location].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  if (data.linkedin) lines.push(`LinkedIn: ${data.linkedin}`);
  if (data.website) lines.push(`Website: ${data.website}`);
  if (data.summary) lines.push("", data.summary);
  return lines.join("\n");
}

function renderExperience(entries: ExperienceEntry[]): string {
  return entries
    .map((e) => {
      const header = [e.title, e.company, e.location].filter(Boolean).join(", ");
      const dates = [e.startDate, e.isCurrent ? "Present" : e.endDate]
        .filter(Boolean)
        .join(" – ");
      const bullets = e.bullets.map((b) => `• ${b}`).join("\n");
      return [header, dates, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function renderSkills(categories: SkillCategory[]): string {
  return categories
    .map((c) => `${c.name ? c.name + ": " : ""}${c.skills.join(", ")}`)
    .join("\n");
}

function renderEducation(entries: EducationEntry[]): string {
  return entries
    .map((e) => {
      const degree = [e.degree, e.field].filter(Boolean).join(" in ");
      const dates = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      const gpa = e.gpa ? `GPA: ${e.gpa}` : "";
      return [e.institution, degree, dates, gpa].filter(Boolean).join(", ");
    })
    .join("\n");
}

function renderProjects(entries: ProjectEntry[]): string {
  return entries
    .map((e) => {
      const header = [e.name, e.url].filter(Boolean).join(" | ");
      const bullets = e.bullets.map((b) => `• ${b}`).join("\n");
      return [header, e.description, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

/**
 * Converts a CV document payload into plain text using the actual stored content.
 * Falls back to labelled template placeholders for any blocks with empty content.
 */
export function cvDocumentToText(payload: CvDocumentPayload): string {
  const lines: string[] = [];

  const sectionTitles: Record<string, string> = {
    profile: "PROFILE",
    experience: "WORK EXPERIENCE",
    skills: "SKILLS",
    projects: "PROJECTS",
    education: "EDUCATION",
  };

  const fallbacks: Record<string, string> = {
    profile: "[Your professional summary, contact details, and key links]",
    experience: "[Your roles, companies, dates, and key achievements with metrics]",
    skills: "[Technical skills, tools, frameworks, and competencies]",
    projects: "[Personal or professional projects with links and impact]",
    education: "[Degrees, institutions, dates, and relevant coursework]",
  };

  for (const id of payload.blockIds) {
    const block = payload.blocks[id] as CvBlock | undefined;
    if (!block || block.hidden) continue;

    const title = sectionTitles[block.template];
    if (!title) continue;

    lines.push(title);
    lines.push("-".repeat(title.length));

    let rendered = "";
    const content = block.content;

    if (content) {
      switch (content.type) {
        case "profile":
          rendered = renderProfile(content.data);
          break;
        case "experience":
          rendered = renderExperience(content.data);
          break;
        case "skills":
          rendered = renderSkills(content.data);
          break;
        case "education":
          rendered = renderEducation(content.data);
          break;
        case "projects":
          rendered = renderProjects(content.data);
          break;
      }
    }

    lines.push(rendered || (fallbacks[block.template] ?? ""));
    lines.push("");
  }

  return lines.join("\n").trim();
}
