import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cvDocumentSchema } from "@/lib/cv-document";
import { extractCvKeywords, calculateJobMatch } from "@/lib/job-matcher";
import { JobMatchDashboard } from "@/components/jobs/job-match-dashboard";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default async function JobsPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  // Load most recent CV + all job postings + profile in parallel
  let cvDoc: { id: string; name: string; payload: unknown } | null = null;
  let jobs: {
    id: string; title: string; company: string | null; location: string | null;
    description: string; sourceUrl: string | null; requirements: string[];
    salary: string | null; experienceYears: number | null; source: string;
  }[] = [];
  let profile: { targetRoles: string[]; currentSkills: string[] } | null = null;

  try {
    [cvDoc, jobs, profile] = await Promise.all([
      prisma.cvDocument.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, payload: true },
      }),
      prisma.jobPosting.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, company: true, location: true,
          description: true, sourceUrl: true, requirements: true,
          salary: true, experienceYears: true, source: true,
        },
      }),
      prisma.profile.findUnique({
        where: { userId },
        select: { targetRoles: true, currentSkills: true },
      }),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-lg mt-20 text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Database waking up…</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          The database was asleep. Please refresh the page in a few seconds.
        </p>
        <Button asChild className="mt-6">
          <Link href="/jobs">Refresh</Link>
        </Button>
      </div>
    );
  }

  // No CV → locked empty state
  if (!cvDoc) {
    return (
      <div className="mx-auto max-w-lg mt-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04]">
          <FileText className="h-6 w-6 text-slate-500 dark:text-zinc-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Build your CV first</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
          The job matching engine needs your saved CV to score jobs against your skills and experience.
        </p>
        <Button asChild className="mt-6">
          <Link href="/cv-builder">Go to CV Builder</Link>
        </Button>
      </div>
    );
  }

  // Parse CV and extract keywords
  const cvParsed = cvDocumentSchema.safeParse(cvDoc.payload);
  const cvKeywords = cvParsed.success ? extractCvKeywords(cvParsed.data) : [];

  // Compute match scores for all jobs
  const jobsWithScores = jobs.map((job) => ({
    ...job,
    ...calculateJobMatch(cvKeywords, job.requirements, job.description),
  }));

  const hasProfile =
    (profile?.targetRoles?.length ?? 0) > 0 || (profile?.currentSkills?.length ?? 0) > 0;

  return (
    <JobMatchDashboard
      cvName={cvDoc.name}
      cvKeywords={cvKeywords}
      initialJobs={jobsWithScores}
      hasProfile={hasProfile}
    />
  );
}
