import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(
  req: Request,
  context: RouteContext
) {
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

    const analysis = await prisma.analysis.findFirst({
      where: {
        id: context.params.id,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        title: analysis.title,
        imageUrl: analysis.imageUrl,
        imageName: analysis.imageName,
        favorite: analysis.favorite,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        messages: analysis.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[history/:id]", error);

    return NextResponse.json(
      { error: "Unable to load this analysis right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
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

    const analysis = await prisma.analysis.findFirst({
      where: {
        id: context.params.id,
        userId,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found." },
        { status: 404 }
      );
    }

    await prisma.analysis.delete({
      where: {
        id: analysis.id,
      },
    });

    return NextResponse.json({
      message: "Analysis deleted successfully.",
    });
  } catch (error) {
    console.error("[history/:id DELETE]", error);

    return NextResponse.json(
      { error: "Unable to delete this analysis right now." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: RouteContext
) {
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

    const analysis = await prisma.analysis.findFirst({
      where: {
        id: context.params.id,
        userId,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found." },
        { status: 404 }
      );
    }

    const data: {
      title?: string;
      favorite?: boolean;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (title) {
        data.title = title.slice(0, 100);
      }
    }

    if (typeof body.favorite === "boolean") {
      data.favorite = body.favorite;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid changes were provided." },
        { status: 400 }
      );
    }

    const updated = await prisma.analysis.update({
      where: {
        id: analysis.id,
      },
      data,
    });

    return NextResponse.json({
      analysis: {
        id: updated.id,
        title: updated.title,
        favorite: updated.favorite,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("[history/:id PATCH]", error);

    return NextResponse.json(
      { error: "Unable to update this analysis right now." },
      { status: 500 }
    );
  }
        }
