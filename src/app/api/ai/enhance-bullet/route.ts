import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  bullet: z.string().min(1).max(500),
  jobTitle: z.string().max(200).default(""),
  company: z.string().max(200).default(""),
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

  const { bullet, jobTitle, company } = parsed.data;

  const prompt = `You are a professional CV writer specialising in impactful bullet points.

Context:
- Role: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Original bullet: "${bullet}"

Rewrite this bullet point following these rules:
1. Start with a strong past-tense action verb (Led, Built, Reduced, Increased, Designed, etc.)
2. Include a quantified result or metric. If you must estimate, prefix with "~" (e.g., "~30%")
3. Keep to one concise sentence (max 20 words)
4. Do not invent new facts — only improve the presentation of what is stated
5. Do not add "I" or personal pronouns

Return ONLY the rewritten bullet point text. No preamble.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const enhanced = result.response.text().trim().replace(/^["•\-]\s*/, "");
    return NextResponse.json({ enhanced });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
