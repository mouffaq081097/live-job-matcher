import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  jobDescription: z.string().min(1).max(15000),
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

  const { jobDescription } = parsed.data;

  const prompt = `You are an expert CV/resume advisor helping a candidate tailor their CV to a job description.

Analyse the following job description and generate 4 to 6 targeted questions to ask the candidate about their background. The questions should:
- Focus on the most important required skills, technologies, and experience mentioned in the JD
- Help extract specific, quantifiable achievements the candidate can highlight
- Ask about years of experience for the core requirements
- Cover any domain-specific requirements (certifications, industries, tools)
- Be concise and easy to answer in 2–4 sentences

JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "questions": [
    {
      "id": "q1",
      "question": "How many years of experience do you have with [key technology from JD]?",
      "hint": "The role requires X years — describe your most recent work with this."
    }
  ]
}

Rules:
- Generate between 4 and 6 questions
- IDs must be q1, q2, q3, etc.
- Each question must be directly tied to a specific requirement in the JD
- The hint should reference what the JD asks for, to guide the candidate's answer
- Do not ask generic questions like "Tell me about yourself"`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response
    .text()
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");

  let data: { questions: { id: string; question: string; hint: string }[] };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  if (!Array.isArray(data.questions)) {
    return NextResponse.json({ error: "Unexpected AI response shape" }, { status: 500 });
  }

  return NextResponse.json({ questions: data.questions.slice(0, 6) });
}
