import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1),
  targetRole: z.string().optional(),
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

  // Fetch user profile for context
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { targetRoles: true, currentSkills: true, industries: true },
  });

  const targetRole =
    parsed.data.targetRole ??
    profile?.targetRoles?.[0] ??
    "a senior professional role";

  const systemInstruction = `You are an expert AI Interview Coach conducting a realistic mock interview.
The candidate is preparing for: ${targetRole}.
${profile?.currentSkills?.length ? `Their skills include: ${profile.currentSkills.join(", ")}.` : ""}
${profile?.industries?.length ? `They have experience in: ${profile.industries.join(", ")}.` : ""}

Your role:
- Ask one focused interview question at a time
- Give brief, constructive feedback on each answer (1-2 sentences)
- Then ask the next question
- Use the STAR method framework when relevant
- Mix behavioral, situational, and technical questions
- Keep responses concise and professional
- After 5-6 exchanges, offer a brief overall assessment`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  const { messages } = parsed.data;

  // Build chat history (all messages except the last user message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  const text = result.response.text();

  return NextResponse.json({ reply: text });
}
