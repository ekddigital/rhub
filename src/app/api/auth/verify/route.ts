import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { verifySchema, safeParse } from "@/lib/dbt/schemas";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = safeParse(verifySchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { email, token } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 },
      );
    }

    if (
      user.verifyToken !== token ||
      !user.verifyTokenExp ||
      user.verifyTokenExp < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 },
      );
    }

    // Mark as verified
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        accessStatus: true,
        canAccessHub: true,
      },
    });

    const canAutoLogin =
      verifiedUser.isActive &&
      verifiedUser.accessStatus === "APPROVED" &&
      verifiedUser.canAccessHub;

    if (canAutoLogin) {
      const sessionToken = await createSession(verifiedUser.id);
      const cookieStore = await cookies();
      cookieStore.set("auth_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return NextResponse.json({
      message: canAutoLogin
        ? "Email verified"
        : "Email verified. Your account is pending union approval.",
      requiresApproval: !canAutoLogin,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        role: verifiedUser.role,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
