import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cvDocumentSchema } from "@/lib/cv-document";
import { extractCvKeywords } from "@/lib/job-matcher";
import { GoogleGenerativeAI } from "@google/generative-ai";

const bodySchema = z.object({
  location: z.string().max(100).default(""),
});

interface SerpApiJob {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  detected_extensions?: {
    salary?: string;
    work_from_home?: boolean;
  };
  job_highlights?: { title: string; items: string[] }[];
  related_links?: { link: string; text: string }[];
}

interface SerpApiResponse {
  jobs_results?: SerpApiJob[];
  error?: string;
}

async function generateSearchQueries(
  targetRoles: string[],
  currentSkills: string[],
  industries: string[],
  workSetup: string | null,
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return targetRoles.slice(0, 3);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a job search assistant. Generate exactly 3 Google Jobs search queries for this professional profile.

Profile:
- Target roles: ${targetRoles.slice(0, 5).join(", ") || "not specified"}
- Key skills: ${currentSkills.slice(0, 8).join(", ") || "not specified"}
- Industries: ${industries.slice(0, 3).join(", ") || "any"}
- Work setup: ${workSetup || "any"}

Rules:
- Each query must be 2-5 words (job title + 1-2 key skills or seniority)
- Make each query distinct to cover different but relevant roles
- Return ONLY a valid JSON array of 3 strings, no explanation

Example output: ["Senior React Developer", "Full Stack Engineer TypeScript", "Frontend Engineer Next.js"]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return targetRoles.slice(0, 3);
    const queries = JSON.parse(match[0]) as string[];
    return Array.isArray(queries) ? queries.slice(0, 3) : targetRoles.slice(0, 3);
  } catch {
    return targetRoles.slice(0, 3);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SerpAPI not configured" }, { status: 503 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { json = {}; }
  const parsed = bodySchema.safeParse(json);
  const location = parsed.success ? parsed.data.location : "";

  // Load profile + CV
  const [profile, cvDoc] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { targetRoles: true, currentSkills: true, industries: true, workSetup: true },
    }),
    prisma.cvDocument.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { payload: true },
    }),
  ]);

  const targetRoles = profile?.targetRoles ?? [];
  const currentSkills = profile?.currentSkills ?? [];

  // Fall back to CV keywords if profile is sparse
  let skillKeywords = currentSkills;
  if (skillKeywords.length === 0 && cvDoc) {
    const cvParsed = cvDocumentSchema.safeParse(cvDoc.payload);
    if (cvParsed.success) skillKeywords = extractCvKeywords(cvParsed.data);
  }

  if (targetRoles.length === 0 && skillKeywords.length === 0) {
    return NextResponse.json(
      { error: "Complete your profile first — add target roles and skills so we know what jobs to find." },
      { status: 400 },
    );
  }

  // Use Gemini to generate smart search queries
  const queries = await generateSearchQueries(
    targetRoles,
    skillKeywords,
    profile?.industries ?? [],
    profile?.workSetup ?? null,
  );

  // Fetch from SerpAPI for each query
  const allJobs: SerpApiJob[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", query);
    if (location) url.searchParams.set("location", location);
    url.searchParams.set("api_key", apiKey);

    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const data = (await res.json()) as SerpApiResponse;
      for (const job of data.jobs_results ?? []) {
        if (!seenIds.has(job.job_id)) {
          seenIds.add(job.job_id);
          allJobs.push(job);
        }
      }
    } catch {
      // skip failed query, continue with others
    }
  }

  if (allJobs.length === 0) {
    return NextResponse.json({ saved: 0, skipped: 0, total: 0, queries });
  }

  // Extract requirements from job_highlights (Qualifications section)
  function extractRequirements(job: SerpApiJob): string[] {
    const qualifications = job.job_highlights?.find(
      (h) => h.title.toLowerCase().includes("qualif") || h.title.toLowerCase().includes("require"),
    );
    if (!qualifications) return [];
    return qualifications.items.flatMap((item) =>
      item.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 60),
    ).slice(0, 15);
  }

  let saved = 0;
  let skipped = 0;

  for (const job of allJobs) {
    const applyUrl = job.related_links?.[0]?.link ?? null;
    const salary = job.detected_extensions?.salary ?? null;
    const requirements = extractRequirements(job);

    try {
      await prisma.jobPosting.upsert({
        where: { userId_externalId: { userId: session.user.id, externalId: job.job_id } },
        create: {
          userId: session.user.id,
          title: job.title,
          company: job.company_name,
          location: job.location,
          description: job.description,
          sourceUrl: applyUrl,
          requirements,
          salary,
          source: "serpapi",
          externalId: job.job_id,
        },
        update: {},
        select: { id: true },
      });
      saved++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ saved, skipped, total: allJobs.length, queries });
}
