import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Password authentication is not available for this account." },
        { status: 400 }
      );
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.passwordHash
    );

    if (samePassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("[change-password]", error);

    return NextResponse.json(
      { error: "Unable to change your password right now." },
      { status: 500 }
    );
  }
         }
