import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

const bodySchema = z.object({
  url: z.string().url(),
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

  const { url } = parsed.data;

  // LinkedIn actively blocks scraping — fail fast with a clear message
  if (url.includes("linkedin.com")) {
    return NextResponse.json(
      { error: "LinkedIn blocks automated access. Please copy and paste the job description manually." },
      { status: 422 },
    );
  }

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch that URL (status ${response.status}). Please paste the job description manually.` },
        { status: 422 },
      );
    }

    html = await response.text();
  } catch {
    return NextResponse.json(
      { error: "Could not reach that URL. Please paste the job description manually." },
      { status: 422 },
    );
  }

  // Truncate HTML to avoid exceeding Gemini token limits
  const truncated = html.slice(0, 60000);

  const prompt = `Extract the job posting details from this HTML page. Return ONLY a JSON object (no markdown):
{
  "title": "Job title",
  "company": "Company name",
  "description": "Full job description text, preserving bullet points and requirements"
}

If you cannot find the job description, return: { "error": "No job description found on this page" }

HTML:
${truncated}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let data: { title?: string; company?: string; description?: string; error?: string };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
  }

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 422 });
  }

  return NextResponse.json({
    title: data.title ?? "",
    company: data.company ?? "",
    description: data.description ?? "",
  });
}
