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
        id: true,
        name: true,
        email: true,
        image: true,
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

    return NextResponse.json({
      profile: user,
    });
  } catch (error) {
    console.error("[profile GET]", error);

    return NextResponse.json(
      { error: "Unable to load your profile right now." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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

    const body = await req.json();

    const data: {
      name?: string | null;
      focus?: string[];
    } = {};

    if (typeof body.name === "string") {
      data.name = body.name.trim().slice(0, 100) || null;
    }

    if (Array.isArray(body.focus)) {
      data.focus = body.focus
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid profile changes were provided." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        focus: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      profile: user,
    });
  } catch (error) {
    console.error("[profile PUT]", error);

    return NextResponse.json(
      { error: "Unable to update your profile right now." },
      { status: 500 }
    );
  }
      }
