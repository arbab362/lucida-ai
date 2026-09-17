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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        focus: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const analyses = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      analyses: analyses.map((analysis) => ({
        id: analysis.id,
        title: analysis.title,
        imageName: analysis.imageName,
        favorite: analysis.favorite,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        messages: analysis.messages,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="lucida-data.json"',
      },
    });
  } catch (error) {
    console.error("[export]", error);

    return NextResponse.json(
      { error: "Unable to export your data right now." },
      { status: 500 }
    );
  }
      }
