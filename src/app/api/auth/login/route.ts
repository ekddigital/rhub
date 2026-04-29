import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPwd, createSession } from "@/lib/auth";
import { loginSchema, safeParse } from "@/lib/dbt/schemas";
import { cookies } from "next/headers";

const TRANSIENT_AUTH_DB_ERROR_CODES = new Set(["P1001", "P1002", "P2024"]);

function isTransientAuthDatabaseError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_AUTH_DB_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database server") ||
      message.includes("timed out fetching a new connection")
    );
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = safeParse(loginSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { email, password } = parsed.data;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const valid = await verifyPwd(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first." },
        { status: 403 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been disabled. Contact support." },
        { status: 403 },
      );
    }

    if (user.accessStatus === "PENDING") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessStatus: "APPROVED",
          canAccessHub: true,
          canAccessConference: true,
          approvedAt: user.approvedAt ?? new Date(),
        },
      });
    }

    if (user.accessStatus === "RESTRICTED") {
      return NextResponse.json(
        { error: "Your account is currently restricted by an administrator." },
        { status: 403 },
      );
    }

    if (user.accessStatus === "REJECTED") {
      return NextResponse.json(
        { error: "Your account application was not approved." },
        { status: 403 },
      );
    }

    if (!user.canAccessHub) {
      return NextResponse.json(
        {
          error:
            "Hub access is disabled for your account. Contact an administrator.",
        },
        { status: 403 },
      );
    }

    const token = await createSession(user.id);
    const isSecureRequest =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: isSecureRequest,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (isTransientAuthDatabaseError(error)) {
      return NextResponse.json(
        {
          error:
            "Authentication database is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
