import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = paramsSchema.parse(await ctx.params);

  const row = await prisma.jobPosting.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      description: true,
      createdAt: true,
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: row });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = paramsSchema.parse(await ctx.params);
  const toDelete = await prisma.jobPosting.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!toDelete) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.jobPosting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

