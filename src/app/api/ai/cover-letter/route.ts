import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  cvText: z.string().min(1).max(20000),
  jobDescription: z.string().min(1).max(20000),
  jobTitle: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { cvText, jobDescription, jobTitle, company } = parsed.data;

  // Fetch user profile and name for personalisation
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { targetRoles: true, industries: true },
    }),
  ]);

  const candidateName = user?.name ?? "the candidate";
  const roleContext = jobTitle ? `for the ${jobTitle} position` : "for this role";
  const companyContext = company ? `at ${company}` : "";

  const prompt = `You are an expert career coach writing a professional cover letter.

Candidate name: ${candidateName}
${profile?.industries?.length ? `Industry background: ${profile.industries.join(", ")}` : ""}

Job title: ${jobTitle ?? "Not specified"}
Company: ${company ?? "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S CV / BACKGROUND:
${cvText}

Write a compelling, personalised cover letter ${roleContext} ${companyContext}.

Requirements:
- 3-4 paragraphs, professional but warm tone
- Opening: strong hook that connects the candidate's specific experience to the role
- Middle paragraphs: highlight 2-3 concrete achievements from the CV that directly match the JD requirements
- Closing: confident call to action
- Do NOT use generic filler phrases like "I am writing to express my interest" or "I believe I would be a great fit"
- Use specific details from both the CV and JD
- Address it "Dear Hiring Manager," unless a name is available
- Sign off with the candidate's name

Return only the cover letter text, no JSON wrapper, no explanations.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const coverLetter = result.response.text().trim();

  return NextResponse.json({ coverLetter });
}
