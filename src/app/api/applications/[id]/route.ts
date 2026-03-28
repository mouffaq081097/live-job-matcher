import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({ id: z.string().min(1) });
const patchSchema = z.object({
  status: z.enum(["Applied", "Screening", "Interviewing", "Offer"]).optional(),
  notes: z.string().max(2000).optional(),
  atsScore: z.number().int().min(0).max(99).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = paramsSchema.parse(await ctx.params);
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.application.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.atsScore !== undefined && { atsScore: parsed.data.atsScore }),
    },
    select: { id: true, status: true, atsScore: true, updatedAt: true },
  });
  return NextResponse.json({ ok: true, item: row });
}

