import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cvDocumentSchema } from "@/lib/cv-document";
import { extractCvKeywords } from "@/lib/job-matcher";

const bodySchema = z.object({
  location: z.string().max(100).default(""),
  country: z.string().length(2).default("gb"), // Adzuna supported: at, au, be, br, ca, de, fr, gb, in, it, mx, nl, nz, pl, ru, sg, us, za
});

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
}

interface AdzunaResponse {
  results?: AdzunaJob[];
  count?: number;
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return NextResponse.json({ error: "Adzuna API not configured" }, { status: 503 });
  }

  let json: unknown;
  try { json = await req.json(); } catch {
    json = {};
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { location, country } = parsed.data;

  // Load user's most recent CV + profile
  const [cvDoc, profile] = await Promise.all([
    prisma.cvDocument.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { payload: true },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { targetRoles: true, currentSkills: true },
    }),
  ]);

  // Build keyword list
  let keywords: string[] = [];
  if (cvDoc) {
    const cvParsed = cvDocumentSchema.safeParse(cvDoc.payload);
    if (cvParsed.success) {
      keywords = extractCvKeywords(cvParsed.data);
    }
  }
  if (keywords.length === 0 && profile) {
    keywords = [...(profile.targetRoles ?? []), ...(profile.currentSkills ?? [])];
  }
  if (keywords.length === 0) {
    return NextResponse.json({ error: "No CV or profile keywords found. Build and save your CV first." }, { status: 400 });
  }

  // Take top 5 keywords for the search query
  const queryWhat = keywords.slice(0, 5).join(" ");
  const queryWhere = location || "";

  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
  );
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("what", queryWhat);
  if (queryWhere) url.searchParams.set("where", queryWhere);
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("content-type", "application/json");

  let adzunaData: AdzunaResponse;
  try {
    const adzunaRes = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15000),
    });
    if (!adzunaRes.ok) {
      const text = await adzunaRes.text();
      return NextResponse.json({ error: `Adzuna error: ${adzunaRes.status} ${text.slice(0, 200)}` }, { status: 502 });
    }
    adzunaData = (await adzunaRes.json()) as AdzunaResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Adzuna request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const results = adzunaData.results ?? [];
  let saved = 0;
  let skipped = 0;
  const jobIds: string[] = [];

  for (const job of results) {
    const salary =
      job.salary_min && job.salary_max
        ? `${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()}`
        : job.salary_min
          ? `From ${job.salary_min.toLocaleString()}`
          : null;

    try {
      const row = await prisma.jobPosting.upsert({
        where: {
          userId_externalId: {
            userId: session.user.id,
            externalId: job.id,
          },
        },
        create: {
          userId: session.user.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          description: job.description,
          sourceUrl: job.redirect_url,
          requirements: [],
          salary: salary ?? undefined,
          source: "adzuna",
          externalId: job.id,
        },
        update: {},
        select: { id: true },
      });
      jobIds.push(row.id);
      saved++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ saved, skipped, total: results.length });
}
