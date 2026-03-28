import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  cv: z.string().min(1).max(20000),
  jd: z.string().min(1).max(20000),
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

  const { cv, jd } = parsed.data;

  const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze how well this CV matches the job description.

JOB DESCRIPTION:
${jd}

CV:
${cv}

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "score": 72,
  "hardSkillsFound": ["SQL", "Python"],
  "hardSkillsMissing": ["Kubernetes"],
  "softSkillsFound": ["leadership", "communication"],
  "softSkillsMissing": ["negotiation"],
  "topSuggestions": [
    "Add specific metrics to your achievements",
    "Mention your experience with X tool from the JD"
  ]
}

score: integer 0-99 representing ATS match strength
hardSkillsFound/Missing: technical skills from the JD
softSkillsFound/Missing: soft skills from the JD
topSuggestions: 2-4 concise, actionable improvement tips`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let data: {
    score?: number;
    hardSkillsFound?: string[];
    hardSkillsMissing?: string[];
    softSkillsFound?: string[];
    softSkillsMissing?: string[];
    topSuggestions?: string[];
  };
  try {
    data = JSON.parse(cleaned) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  return NextResponse.json({
    score: data.score ?? 0,
    hardSkillsFound: data.hardSkillsFound ?? [],
    hardSkillsMissing: data.hardSkillsMissing ?? [],
    softSkillsFound: data.softSkillsFound ?? [],
    softSkillsMissing: data.softSkillsMissing ?? [],
    topSuggestions: data.topSuggestions ?? [],
  });
}
