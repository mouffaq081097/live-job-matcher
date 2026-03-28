import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      atsScore: true,
      updatedAt: true,
      jobPosting: { select: { id: true, title: true, company: true, location: true } },
    },
  });

  return NextResponse.json({ items: rows });
}

const postSchema = z.object({
  jobPostingId: z.string().min(1),
  status: z.enum(["Applied", "Screening", "Interviewing", "Offer"]).default("Applied"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const job = await prisma.jobPosting.findFirst({
    where: { id: parsed.data.jobPostingId, userId: session.user.id },
    select: { id: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.application.create({
    data: {
      userId: session.user.id,
      jobPostingId: job.id,
      status: parsed.data.status,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: row.id });
}

