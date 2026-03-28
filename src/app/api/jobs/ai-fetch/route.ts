import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  url: z.string().url().max(2000),
});

interface ExtractedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary: string;
  experienceYears: number | null;
}

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
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { url } = parsed.data;

  // Attempt to fetch the URL
  let rawText: string;
  try {
    const fetchRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobMatchBot/1.0)",
        "Accept": "text/html,application/xhtml+xml,*/*",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: "fetch_blocked", message: "Could not fetch this URL (server returned an error). Paste the job description manually below." },
        { status: 422 },
      );
    }
    rawText = await fetchRes.text();
  } catch {
    return NextResponse.json(
      { error: "fetch_blocked", message: "Could not reach this URL (blocked or timed out). Paste the job description manually below." },
      { status: 422 },
    );
  }

  // Strip HTML tags, collapse whitespace
  const stripped = rawText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 8000);

  const prompt = `You are a job posting data extractor. Extract structured data from the text below.

Text:
${stripped}

Return ONLY valid JSON in this exact format (no extra text):
{
  "title": "exact job title",
  "company": "company name",
  "location": "city, country",
  "description": "cleaned job description, max 1000 chars",
  "requirements": ["skill1", "skill2", "skill3"],
  "salary": "salary range or empty string",
  "experienceYears": 3
}

Rules:
- requirements: list of 5–15 specific technical skills, tools, or qualifications mentioned
- experienceYears: number of years required (integer) or null if not mentioned
- If a field is unknown, use an empty string or null
- Do not invent information not present in the text`;

  let extracted: ExtractedJob;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    extracted = JSON.parse(text) as ExtractedJob;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const row = await prisma.jobPosting.create({
    data: {
      userId: session.user.id,
      title: extracted.title || "Job Posting",
      company: extracted.company || undefined,
      location: extracted.location || undefined,
      description: extracted.description || stripped.slice(0, 2000),
      sourceUrl: url,
      requirements: extracted.requirements ?? [],
      salary: extracted.salary || undefined,
      experienceYears: extracted.experienceYears ?? undefined,
      source: "url",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
