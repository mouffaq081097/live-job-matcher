"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { InterviewGlassOverlay } from "@/components/interview/interview-glass-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationCarousel } from "./application-carousel";
import { MarketValueGauge } from "./market-value-gauge";
import { SkillGapAnalysis } from "./skill-gap-analysis";
import { PersonalizedJobMatches } from "./personalized-job-matches";
import { toast } from "sonner";

export function CommandCenter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromInterviewQuery = searchParams.get("interview") === "1";
  const [interviewManualOpen, setInterviewManualOpen] = useState(false);
  const interviewOpen = fromInterviewQuery || interviewManualOpen;
  
  const [profile, setProfile] = useState<{
    targetRoles: string[];
    currentSkills: string[];
    workSetup: string;
    expectedSalary: number | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [apps, setApps] = useState<
    {
      id: string;
      status: "Interviewing" | "Applied" | "Screening" | "Offer";
      atsScore: number | null;
      jobPosting: { title: string; company: string | null; location: string | null };
    }[]
  >([]);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load applications");
        return r.json() as Promise<{
          items: {
            id: string;
            status: "Interviewing" | "Applied" | "Screening" | "Offer";
            atsScore: number | null;
            jobPosting: { title: string; company: string | null; location: string | null };
          }[];
        }>;
      })
      .then((data) => { if (data?.items) setApps(data.items); })
      .catch(() => { toast.error("Could not load applications. Please refresh."); })
      .finally(() => setAppsLoading(false));

    fetch("/api/profile", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json() as Promise<{ profile: typeof profile }>;
      })
      .then((data) => { if (data?.profile) setProfile(data.profile); })
      .catch(() => { toast.error("Could not load profile. Please refresh."); })
      .finally(() => setProfileLoading(false));
  }, []);

  // Calculate dynamic market value based on profile completion
  const baseValue = 50;
  const profileBonus = profile ? 10 : 0;
  const skillBonus = profile?.currentSkills ? Math.min(25, profile.currentSkills.length * 5) : 0;
  const targetRoleBonus = profile?.targetRoles && profile.targetRoles.length > 0 ? 10 : 0;
  const gaugeValue = baseValue + profileBonus + skillBonus + targetRoleBonus;

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/90">
            Command center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Career health at a glance
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">
            UAE market signals, application pipeline, and quick entry to your
            optimization tools.
          </p>
        </div>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
          <CardContent className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between md:gap-10">
            <MarketValueGauge value={gaugeValue} />
            <div className="flex w-full max-w-md flex-col gap-3 md:items-end">
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link href="/optimize">
                  Open optimization engine
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full md:w-auto"
                onClick={() => setInterviewManualOpen(true)}
              >
                <Mic className="mr-2 h-4 w-4" />
                Prepare for interview
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {profileLoading ? (
            <>
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </>
          ) : (
            <>
              <SkillGapAnalysis
                currentSkills={profile?.currentSkills ?? []}
                targetRoles={profile?.targetRoles ?? []}
              />
              <PersonalizedJobMatches
                roles={profile?.targetRoles ?? []}
                workSetup={profile?.workSetup ?? ""}
                salary={profile?.expectedSalary ?? null}
              />
            </>
          )}
        </div>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Active applications
              </h2>
              <p className="text-sm text-zinc-500">Your tracked job applications.</p>
            </div>
          </div>
          {appsLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-[110px] w-[280px] shrink-0 rounded-xl" />
              <Skeleton className="h-[110px] w-[280px] shrink-0 rounded-xl" />
              <Skeleton className="h-[110px] w-[280px] shrink-0 rounded-xl" />
            </div>
          ) : apps.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6">
              No applications tracked yet.{" "}
              <Link href="/jobs" className="text-blue-400 hover:underline">Add a job</Link> to get started.
            </p>
          ) : (
            <ApplicationCarousel
              items={apps.map((a) => ({
                id: a.id,
                title: a.jobPosting.title,
                company: a.jobPosting.company ?? "—",
                location: a.jobPosting.location ?? "—",
                status: a.status,
                atsScore: a.atsScore,
              }))}
            />
          )}
        </section>
      </div>

      <InterviewGlassOverlay
        open={interviewOpen}
        onOpenChange={(o) => {
          if (!o) {
            setInterviewManualOpen(false);
            if (fromInterviewQuery) router.replace("/", { scroll: false });
          }
        }}
      />
    </>
  );
}
