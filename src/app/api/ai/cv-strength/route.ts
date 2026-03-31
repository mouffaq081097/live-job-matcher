import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  cvText: z.string().min(10).max(20000),
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
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { cvText } = parsed.data;

  const prompt = `You are a professional CV reviewer. Evaluate the content quality of this CV and return a score.

CV TEXT:
${cvText}

Score based on:
- Action verbs: Does each bullet start with a strong verb (Led, Built, Increased, Reduced, Designed)?
- Quantified achievements: Are there numbers, percentages, revenue figures, or team sizes?
- Specificity: Named tools, technologies, and outcomes — not vague phrases like "responsible for"
- Professional summary: Clear, compelling, tailored to a role?
- Overall impact: Does the CV convey clear value to an employer?

Return ONLY a JSON object (no markdown, no explanation):
{
  "score": 74,
  "suggestions": [
    "Add metrics to your experience bullets (e.g. 'increased revenue by 30%')",
    "Start each bullet point with a strong action verb"
  ]
}

score: integer 0-99.
suggestions: 2-4 specific, actionable improvements. Return an empty array if the CV is already strong.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let data: { score?: number; suggestions?: string[] };
  try {
    data = JSON.parse(cleaned) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  return NextResponse.json({
    score: Math.min(99, Math.max(0, data.score ?? 0)),
    suggestions: data.suggestions ?? [],
  });
}
