import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const bodySchema = z.object({
  documentId: z.string().min(1),
  jobDescription: z.string().min(1).max(20000),
  userAnswers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

// Loose types for the stored payload — content can be any shape
type StoredBlock = {
  id: string;
  template: string;
  hidden: boolean;
  content?: {
    type: string;
    data: unknown;
  };
};

type StoredPayload = {
  blockIds: string[];
  blocks: Record<string, StoredBlock>;
  layout: string;
  stylePreset: string;
  rolePreset: string;
  compactSpacing: boolean;
  template?: string;
  globalStyles?: unknown;
};

type ProfileData = { fullName?: string; jobTitle?: string; summary?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string };
type ExperienceEntry = { id: string; title?: string; company?: string; location?: string; startDate?: string; endDate?: string; isCurrent?: boolean; bullets?: string[] };
type SkillCategory = { id: string; name?: string; skills?: string[] };

function buildCvText(payload: StoredPayload): string {
  const lines: string[] = [];
  for (const id of payload.blockIds) {
    const block = payload.blocks[id];
    if (!block || block.hidden || !block.content) continue;
    const { type, data } = block.content;

    if (type === "profile") {
      const p = data as ProfileData;
      lines.push(`PROFILE: ${p.fullName ?? ""} — ${p.jobTitle ?? ""}`);
      if (p.summary) lines.push(`Summary: ${p.summary}`);
    } else if (type === "experience") {
      lines.push("EXPERIENCE:");
      for (const e of (data as ExperienceEntry[])) {
        const dates = [e.startDate, e.isCurrent ? "Present" : e.endDate].filter(Boolean).join("–");
        lines.push(`- ${e.title ?? ""} at ${e.company ?? ""} (${dates})`);
        for (const b of (e.bullets ?? []).filter(Boolean)) {
          lines.push(`  • ${b}`);
        }
      }
    } else if (type === "skills") {
      const cats = data as SkillCategory[];
      lines.push("SKILLS: " + cats.flatMap((c) => c.skills ?? []).join(", "));
    } else if (type === "education") {
      lines.push("EDUCATION:");
      for (const e of (data as Array<{ degree?: string; field?: string; institution?: string; endDate?: string }>)) {
        lines.push(`- ${([e.degree, e.field].filter(Boolean).join(" in ") || e.institution) ?? ""} at ${e.institution ?? ""} (${e.endDate ?? ""})`);
      }
    } else if (type === "projects") {
      lines.push("PROJECTS:");
      for (const p of (data as Array<{ name?: string; description?: string; bullets?: string[] }>)) {
        lines.push(`- ${p.name ?? ""}: ${p.description ?? ""}`);
        for (const b of (p.bullets ?? []).filter(Boolean)) lines.push(`  • ${b}`);
      }
    }
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { documentId, jobDescription, userAnswers = [] } = parsed.data;

  const doc = await prisma.cvDocument.findFirst({
    where: { id: documentId, userId: session.user.id },
    select: { payload: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const payload = doc.payload as StoredPayload;

  const visibleBlocks = payload.blockIds
    .map((id) => payload.blocks[id])
    .filter(Boolean)
    .map((b) => b.template);

  const cvText = buildCvText(payload);

  // Build experience IDs list so Gemini can reference them
  const experienceIds: { id: string; title: string }[] = [];
  for (const id of payload.blockIds) {
    const block = payload.blocks[id];
    if (block?.content?.type === "experience") {
      for (const e of (block.content.data as ExperienceEntry[])) {
        if (e.id) experienceIds.push({ id: e.id, title: e.title ?? "" });
      }
    }
  }

  // Build skills category IDs so Gemini can update them
  const skillCategoryIds: { id: string; name: string }[] = [];
  for (const id of payload.blockIds) {
    const block = payload.blocks[id];
    if (block?.content?.type === "skills") {
      for (const c of (block.content.data as SkillCategory[])) {
        if (c.id) skillCategoryIds.push({ id: c.id, name: c.name ?? "" });
      }
    }
  }

  // Format user answers for the prompt
  const answersSection = userAnswers.length > 0
    ? `\nCANDIDATE'S ANSWERS TO TARGETED QUESTIONS:\n${userAnswers
        .map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}`)
        .join("\n\n")}`
    : "";

  const prompt = `You are an expert CV/resume advisor and ATS optimisation specialist. Analyse this job description and the candidate's CV, then:
1. Recommend how to restructure the CV sections for this role
2. Rewrite the profile summary to target this specific job (keep it factual, first person, 2-4 sentences, include key role-specific terms)
3. Rewrite experience bullet points using strong action verbs + quantifiable impact phrasing. Embed exact keyword phrases from the JD into every bullet.
4. Update the skills section to include exact skill names and technologies mentioned in the JD that the candidate has confirmed.
5. Suggest a concise CV name: job title + company extracted from the JD (e.g. "Senior Engineer at Acme Corp")

JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}

CANDIDATE'S CV:
${cvText}
${answersSection}

Current sections (in order): ${visibleBlocks.join(", ")}
Experience entry IDs: ${JSON.stringify(experienceIds)}
Skill category IDs: ${JSON.stringify(skillCategoryIds)}

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "cvName": "Job Title at Company",
  "updatedPayload": {
    "layout": "single",
    "stylePreset": "minimal",
    "rolePreset": "technical",
    "compactSpacing": false,
    "blockOrder": ["profile", "experience", "skills", "education", "projects"],
    "hiddenBlocks": []
  },
  "updatedContent": {
    "profile": {
      "summary": "Rewritten summary targeting this specific role..."
    },
    "experience": [
      { "id": "ENTRY_ID_HERE", "bullets": ["Rewritten bullet 1", "Rewritten bullet 2"] }
    ],
    "skills": [
      { "id": "SKILL_CATEGORY_ID_HERE", "name": "Category name", "skills": ["Skill 1", "Skill 2"] }
    ]
  },
  "suggestions": [
    { "section": "Profile", "tip": "Actionable tip for this section based on the JD" }
  ]
}

ATS OPTIMISATION RULES (critical — follow these exactly):
- Extract the 15–20 most important skill/technology/tool keywords from the JD. Use EXACT phrasing from the JD (e.g. "React.js" not "React" if the JD says "React.js").
- EXPERIENCE BULLETS: Every bullet must start with a strong past-tense action verb (e.g. Led, Built, Reduced, Increased, Designed). Each bullet must weave in at least one exact JD keyword phrase. Use metric-based phrasing where the candidate's answers provide data (e.g. "Reduced load time by 40%"). Do NOT invent facts not in the CV or answers.
- SKILLS: Update each existing skill category to include confirmed skills using exact JD terminology. Add new categories only if justified by the candidate's answers. Do not include skills the candidate has not confirmed.
- PROFILE SUMMARY: Open with the candidate's target job title from the JD. Include 2–3 of the most important JD keywords naturally.
- BLOCK ORDER: Lead with the most relevant sections for this role (e.g. put skills before education for technical roles).

Additional rules:
- cvName: extract from JD, max 60 chars
- blockOrder: only use templates from: ${visibleBlocks.join(", ")}
- hiddenBlocks: templates to hide because they are not relevant to this role
- updatedContent.profile.summary: rewrite ONLY the summary field, do NOT return other profile fields
- updatedContent.experience: include ALL experience entries with their original IDs
- updatedContent.skills: include ALL existing skill category IDs — update their skills lists
- suggestions: 3–5 concise, actionable tips (one per relevant section)`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let data: {
    cvName?: string;
    updatedPayload?: {
      layout?: string;
      stylePreset?: string;
      rolePreset?: string;
      compactSpacing?: boolean;
      blockOrder?: string[];
      hiddenBlocks?: string[];
    };
    updatedContent?: {
      profile?: { summary?: string };
      experience?: { id: string; bullets: string[] }[];
      skills?: { id: string; name: string; skills: string[] }[];
    };
    suggestions?: { section: string; tip: string }[];
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  const cvName = (data.cvName ?? "Tailored CV").slice(0, 80);
  const recommendedOrder = data.updatedPayload?.blockOrder ?? visibleBlocks;
  const hiddenSet = new Set(data.updatedPayload?.hiddenBlocks ?? []);

  // Map template names to block IDs
  const templateToId: Record<string, string> = {};
  for (const [id, block] of Object.entries(payload.blocks)) {
    templateToId[block.template] = id;
  }

  const newBlockIds: string[] = [];
  const newBlocks: Record<string, StoredBlock> = { ...payload.blocks };

  // Apply structural reordering + hidden
  for (const template of recommendedOrder) {
    const id = templateToId[template];
    if (id) {
      newBlockIds.push(id);
      newBlocks[id] = { ...newBlocks[id], hidden: hiddenSet.has(template) };
    }
  }
  for (const id of payload.blockIds) {
    if (!newBlockIds.includes(id)) {
      newBlockIds.push(id);
      newBlocks[id] = { ...newBlocks[id], hidden: true };
    }
  }

  // Apply profile summary rewrite
  if (data.updatedContent?.profile?.summary) {
    const profileId = templateToId["profile"];
    if (profileId && newBlocks[profileId]?.content?.type === "profile") {
      const block = newBlocks[profileId];
      newBlocks[profileId] = {
        ...block,
        content: {
          ...block.content!,
          data: {
            ...(block.content!.data as ProfileData),
            summary: data.updatedContent.profile.summary,
          },
        },
      };
    }
  }

  // Apply experience bullet rewrites
  if (data.updatedContent?.experience?.length) {
    const expId = templateToId["experience"];
    if (expId && newBlocks[expId]?.content?.type === "experience") {
      const block = newBlocks[expId];
      const entries = [...(block.content!.data as ExperienceEntry[])];
      const bulletMap = new Map(data.updatedContent.experience.map((e) => [e.id, e.bullets]));
      const updatedEntries = entries.map((e) => {
        const newBullets = bulletMap.get(e.id);
        return newBullets ? { ...e, bullets: newBullets } : e;
      });
      newBlocks[expId] = {
        ...block,
        content: { ...block.content!, data: updatedEntries },
      };
    }
  }

  // Apply skills updates
  if (data.updatedContent?.skills?.length) {
    const skillsId = templateToId["skills"];
    if (skillsId && newBlocks[skillsId]?.content?.type === "skills") {
      const block = newBlocks[skillsId];
      const existingCategories = [...(block.content!.data as SkillCategory[])];
      const skillMap = new Map(data.updatedContent.skills.map((c) => [c.id, c]));
      const updatedCategories = existingCategories.map((cat) => {
        const updated = skillMap.get(cat.id);
        return updated ? { ...cat, name: updated.name, skills: updated.skills } : cat;
      });
      newBlocks[skillsId] = {
        ...block,
        content: { ...block.content!, data: updatedCategories },
      };
    }
  }

  const tailoredPayload = {
    ...payload,
    blockIds: newBlockIds,
    blocks: newBlocks,
    layout: (data.updatedPayload?.layout ?? payload.layout) as "single" | "two-column",
    stylePreset: (data.updatedPayload?.stylePreset ?? payload.stylePreset) as "executive" | "creative" | "minimal",
    rolePreset: (data.updatedPayload?.rolePreset ?? payload.rolePreset) as "technical" | "graduate" | "executive",
    compactSpacing: data.updatedPayload?.compactSpacing ?? payload.compactSpacing,
  };

  // Save as a new CV document
  const newDoc = await prisma.cvDocument.create({
    data: {
      userId: session.user.id,
      name: cvName,
      payload: tailoredPayload as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    newDocumentId: newDoc.id,
    cvName,
    tailoredPayload,
    suggestions: data.suggestions ?? [],
  });
}
