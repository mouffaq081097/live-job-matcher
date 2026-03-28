import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ profile: profile ?? null });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      targetRoles,
      industries,
      expectedSalary,
      workSetup,
      currentSkills,
    } = body;

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
        industries: Array.isArray(industries) ? industries : [],
        expectedSalary:
          typeof expectedSalary === "number" ? expectedSalary : null,
        workSetup: typeof workSetup === "string" ? workSetup : null,
        currentSkills: Array.isArray(currentSkills) ? currentSkills : [],
      },
      update: {
        targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
        industries: Array.isArray(industries) ? industries : [],
        expectedSalary:
          typeof expectedSalary === "number" ? expectedSalary : null,
        workSetup: typeof workSetup === "string" ? workSetup : null,
        currentSkills: Array.isArray(currentSkills) ? currentSkills : [],
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
