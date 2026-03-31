import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
      // Personal info
      fullName,
      jobTitle,
      email,
      phone,
      location,
      linkedin,
      website,
      education,
      certifications,
      experience,
      skills,
      // Career preferences
      targetRoles,
      industries,
      expectedSalary,
      workSetup,
      currentSkills,
    } = body;

    const data = {
      // Personal info
      fullName: typeof fullName === "string" ? fullName : null,
      jobTitle: typeof jobTitle === "string" ? jobTitle : null,
      email: typeof email === "string" ? email : null,
      phone: typeof phone === "string" ? phone : null,
      location: typeof location === "string" ? location : null,
      linkedin: typeof linkedin === "string" ? linkedin : null,
      website: typeof website === "string" ? website : null,
      education: Array.isArray(education)
        ? (education as Prisma.InputJsonValue)
        : ([] as unknown as Prisma.InputJsonValue),
      certifications: Array.isArray(certifications)
        ? (certifications as Prisma.InputJsonValue)
        : ([] as unknown as Prisma.InputJsonValue),
      experience: Array.isArray(experience)
        ? (experience as Prisma.InputJsonValue)
        : ([] as unknown as Prisma.InputJsonValue),
      skills: Array.isArray(skills)
        ? (skills as Prisma.InputJsonValue)
        : ([] as unknown as Prisma.InputJsonValue),
      // Career preferences
      targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
      industries: Array.isArray(industries) ? industries : [],
      expectedSalary: typeof expectedSalary === "number" ? expectedSalary : null,
      workSetup: typeof workSetup === "string" ? workSetup : null,
      currentSkills: Array.isArray(currentSkills) ? currentSkills : [],
    };

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
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
