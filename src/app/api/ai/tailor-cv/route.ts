import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  documentId: z.string().min(1),
  jobDescription: z.string().min(1).max(20000),
});

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

  const { documentId, jobDescription } = parsed.data;

  const doc = await prisma.cvDocument.findFirst({
    where: { id: documentId, userId: session.user.id },
    select: { payload: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const payload = doc.payload as {
    blockIds: string[];
    blocks: Record<string, { id: string; template: string; hidden: boolean }>;
    layout: string;
    stylePreset: string;
    rolePreset: string;
    compactSpacing: boolean;
  };

  const visibleBlocks = payload.blockIds
    .map((id) => payload.blocks[id])
    .filter(Boolean)
    .map((b) => b.template);

  const prompt = `You are an expert CV/resume advisor. Analyse this job description and the candidate's CV structure, then recommend how to optimise the CV.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S CV STRUCTURE:
- Current sections (in order): ${visibleBlocks.join(", ")}
- Layout: ${payload.layout}
- Style: ${payload.stylePreset}
- Role preset: ${payload.rolePreset}

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "updatedPayload": {
    "layout": "single" | "two-column",
    "stylePreset": "executive" | "creative" | "minimal",
    "rolePreset": "technical" | "graduate" | "executive",
    "compactSpacing": true | false,
    "blockOrder": ["profile", "experience", "skills", "education", "projects"],
    "hiddenBlocks": []
  },
  "suggestions": [
    {
      "section": "Profile",
      "tip": "Concise actionable advice for this section based on the JD"
    }
  ]
}

blockOrder: ordered list of block templates that should be visible (only use templates from: profile, experience, skills, projects, education)
hiddenBlocks: templates that should be hidden because they're not relevant to this role
suggestions: 3-5 tips, one per relevant section, based specifically on the job description keywords and requirements`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let data: {
    updatedPayload?: {
      layout?: string;
      stylePreset?: string;
      rolePreset?: string;
      compactSpacing?: boolean;
      blockOrder?: string[];
      hiddenBlocks?: string[];
    };
    suggestions?: { section: string; tip: string }[];
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  // Rebuild block structure from Gemini's recommendations
  const recommendedOrder = data.updatedPayload?.blockOrder ?? visibleBlocks;
  const hiddenSet = new Set(data.updatedPayload?.hiddenBlocks ?? []);

  // Map template names back to block IDs
  const templateToId: Record<string, string> = {};
  for (const [id, block] of Object.entries(payload.blocks)) {
    templateToId[block.template] = id;
  }

  const newBlockIds: string[] = [];
  const newBlocks: Record<string, { id: string; template: string; hidden: boolean }> = {
    ...payload.blocks,
  };

  // Reorder and set hidden based on Gemini output
  for (const template of recommendedOrder) {
    const id = templateToId[template];
    if (id) {
      newBlockIds.push(id);
      newBlocks[id] = { ...newBlocks[id], hidden: hiddenSet.has(template) };
    }
  }
  // Add any blocks not in Gemini's order as hidden
  for (const id of payload.blockIds) {
    if (!newBlockIds.includes(id)) {
      newBlockIds.push(id);
      newBlocks[id] = { ...newBlocks[id], hidden: true };
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

  return NextResponse.json({
    tailoredPayload,
    suggestions: data.suggestions ?? [],
  });
}
