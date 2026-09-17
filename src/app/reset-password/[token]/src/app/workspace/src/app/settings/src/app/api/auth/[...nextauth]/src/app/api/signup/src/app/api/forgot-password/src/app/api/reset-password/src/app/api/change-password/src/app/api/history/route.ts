import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json(
        { error: "User session is invalid." },
        { status: 401 }
      );
    }

    const analyses = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    const result = analyses.map((analysis) => ({
      id: analysis.id,
      title: analysis.title,
      imageUrl: analysis.imageUrl,
      favorite: analysis.favorite,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      preview: analysis.messages[0]?.content ?? "",
    }));

    return NextResponse.json({
      analyses: result,
    });
  } catch (error) {
    console.error("[history]", error);

    return NextResponse.json(
      { error: "Unable to load your history right now." },
      { status: 500 }
    );
  }
        }
