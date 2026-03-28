import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { cvDocumentSchema } from "@/lib/cv-document";
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

  const row = await prisma.cvDocument.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true, payload: true, updatedAt: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: row });
}

const putSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  document: cvDocumentSchema,
});

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = paramsSchema.parse(await ctx.params);

  const json = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.cvDocument.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.cvDocument.update({
    where: { id },
    data: {
      name: parsed.data.name,
      payload: parsed.data.document as object,
    },
    select: { id: true, name: true, updatedAt: true },
  });
  return NextResponse.json({ ok: true, item: row });
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

  const toDelete = await prisma.cvDocument.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!toDelete) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.cvDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

