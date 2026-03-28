import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  jobTitle: z.string().max(200).default(""),
  experience: z.array(z.object({
    company: z.string().default(""),
    title: z.string().default(""),
    bullets: z.array(z.string()).default([]),
  })).default([]),
  skills: z.array(z.object({
    name: z.string().default(""),
    skills: z.array(z.string()).default([]),
  })).default([]),
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

  const { jobTitle, experience, skills } = parsed.data;

  const expText = experience
    .map((e) => `${e.title} at ${e.company}: ${e.bullets.filter(Boolean).join("; ")}`)
    .join("\n");
  const skillsText = skills.map((c) => `${c.name ? c.name + ": " : ""}${c.skills.join(", ")}`).join("; ");

  const prompt = `You are a professional CV writer. Write a concise, impactful professional summary for a CV.

Job title: ${jobTitle || "Not specified"}
Experience highlights:
${expText || "Not provided"}
Key skills: ${skillsText || "Not provided"}

Requirements:
- 2–4 sentences maximum
- Do NOT use "I" or first-person pronouns
- Start with a strong professional descriptor (e.g., "Results-driven...", "Accomplished...", "Senior...")
- Reference specific technologies or skills if they are present in the input
- No generic filler phrases like "hard-working", "team player", "passionate"
- Be specific and quantified where possible

Return ONLY the summary text, no preamble or explanation.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    return NextResponse.json({ summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
