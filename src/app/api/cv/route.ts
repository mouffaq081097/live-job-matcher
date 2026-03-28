import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { cvDocumentSchema } from "@/lib/cv-document";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.cvDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true, createdAt: true },
  });
  return NextResponse.json({ items: rows });
}

const postSchema = z.object({
  documentId: z.string().optional(),
  name: z.string().min(1).max(80).optional(),
  document: cvDocumentSchema,
});

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { documentId, document, name } = parsed.data;

  try {
    if (documentId) {
      const existing = await prisma.cvDocument.findFirst({
        where: { id: documentId, userId: session.user.id },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const row = await prisma.cvDocument.update({
        where: { id: documentId },
        data: { payload: document as object },
      });
      return NextResponse.json({
        ok: true,
        saved: true,
        documentId: row.id,
      });
    }
    const row = await prisma.cvDocument.create({
      data: {
        userId: session.user.id,
        name: name ?? "Master CV",
        payload: document as object,
      },
    });
    return NextResponse.json({
      ok: true,
      saved: true,
      documentId: row.id,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      saved: false,
    });
  }
}
