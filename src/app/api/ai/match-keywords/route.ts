import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  cvText: z.string().min(1).max(20000),
  jobDescription: z.string().min(1).max(20000),
});

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  let json: unknown;
  try { json = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { cvText, jobDescription } = parsed.data;

  const prompt = `You are a CV keyword analysis expert.

Analyse the job description and CV text below.

Job description:
${jobDescription}

CV text:
${cvText}

Task:
1. Extract the top 25 most important technical skills, tools, frameworks, methodologies, and role-specific keywords from the job description.
2. For each keyword, check if it appears literally OR synonymously in the CV text.
3. Return two arrays: "matched" (keywords present in CV) and "missing" (keywords absent from CV).

Rules:
- Use the exact phrasing from the job description for each keyword (not paraphrased)
- Keep each keyword to 1–3 words
- Synonyms count as matches (e.g., "React.js" matches "React", "Node.js" matches "Node")
- Ignore generic soft skills like "communication", "teamwork"

Return ONLY valid JSON in this exact format:
{"matched":["keyword1","keyword2"],"missing":["keyword3","keyword4"]}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    const data = JSON.parse(text) as { matched: string[]; missing: string[] };
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
