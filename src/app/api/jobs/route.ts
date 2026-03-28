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

  const rows = await prisma.jobPosting.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      description: true,
      sourceUrl: true,
      requirements: true,
      salary: true,
      experienceYears: true,
      source: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ items: rows });
}

const postSchema = z.object({
  title: z.string().min(2).max(120),
  company: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  description: z.string().min(50).max(20000),
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

  const row = await prisma.jobPosting.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      company: parsed.data.company,
      location: parsed.data.location,
      description: parsed.data.description,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

