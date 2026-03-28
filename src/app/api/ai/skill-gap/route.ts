import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  currentSkills: z.array(z.string()),
  targetRoles: z.array(z.string()),
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

  const { currentSkills, targetRoles } = parsed.data;

  if (targetRoles.length === 0) {
    return NextResponse.json({
      matched: [],
      missing: [],
      summary: "Add target roles to your profile to see a skill gap analysis.",
    });
  }

  const prompt = `You are a career advisor. Analyze the skill gap for this candidate.

Target roles: ${targetRoles.join(", ")}
Current skills: ${currentSkills.length > 0 ? currentSkills.join(", ") : "none listed"}

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "requiredSkills": ["skill1", "skill2", ...],
  "matched": ["skill1", ...],
  "missing": ["skill1", ...],
  "summary": "One sentence summary of the gap."
}

requiredSkills: the 6-10 most important skills for these roles
matched: skills from requiredSkills that appear in currentSkills
missing: skills from requiredSkills not in currentSkills`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let data: {
    requiredSkills?: string[];
    matched?: string[];
    missing?: string[];
    summary?: string;
  };
  try {
    data = JSON.parse(cleaned) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  return NextResponse.json({
    matched: data.matched ?? [],
    missing: data.missing ?? [],
    summary: data.summary ?? "",
  });
}
