import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeImage, generateTitle, type ChatTurn } from "@/lib/openai";
import { isRateLimited } from "@/lib/rate-limit";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to analyze images." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: "You're sending requests too quickly. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The AI service is not configured. Please contact support." },
      { status: 503 }
    );
  }

  let body: {
    prompt?: string;
    analysisId?: string;
    imageDataUrl?: string;
    imageName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Please describe what you'd like to know." }, { status: 400 });
  }

  try {
    let analysis;
    let history: ChatTurn[] = [];
    

    if (body.analysisId) {
      // Continuing an existing conversation about an already-uploaded image.
      analysis = await prisma.analysis.findFirst({
        where: { id: body.analysisId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!analysis) {
        return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
      }
      history = analysis.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    } else {
      // A brand-new image upload.
      if (!body.imageDataUrl) {
        return NextResponse.json({ error: "No image was provided." }, { status: 400 });
      }
      const match = body.imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Unsupported image format." }, { status: 415 });
      }


      const mediaType = match[1];
      const imageBase64 = match[2];

      if (!ALLOWED_TYPES.has(mediaType)) {
        return NextResponse.json(
          { error: "Please upload a JPG, PNG, WEBP, or GIF image." },
          { status: 415 }
        );
      }
      const approxBytes = (imageBase64.length * 3) / 4;
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "That image is too large. Please upload something under 8MB." },
          { status: 413 }
        );
      }

      analysis = await prisma.analysis.create({
        data: {
          userId,
          title: "New analysis",
          imageUrl: body.imageDataUrl,
          imageName: body.imageName ?? null,
        },
        include: { messages: true },
      });
    }

    const imageDataUrl = analysis.imageUrl;

    const answer = await analyzeImage({
      imageDataUrl,
      prompt,
      history,
    });

    await prisma.message.createMany({
      data: [
        { analysisId: analysis.id, role: "user", content: prompt },
        { analysisId: analysis.id, role: "assistant", content: answer },
      ],
    });

    // Title the conversation from its first request only.
    if (history.length === 0) {
      const title = await generateTitle(prompt);
      await prisma.analysis.update({ where: { id: analysis.id }, data: { title } });
      analysis.title = title;
    } else {
      await prisma.analysis.update({ where: { id: analysis.id }, data: { updatedAt: new Date() } });
    }

    return NextResponse.json({
      analysisId: analysis.id,
      title: analysis.title,
      imageUrl: analysis.imageUrl,
      answer,
    });
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json(
      { error: "The AI service is unavailable right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
