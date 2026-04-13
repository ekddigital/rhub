import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPwd } from "@/lib/auth";
import { genOTP } from "@/lib/dbt/utils";
import { registerSchema, safeParse } from "@/lib/dbt/schemas";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = safeParse(registerSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { email, name, password } = parsed.data;

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.emailVerified) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const hashed = await hashPwd(password);
    const otp = genOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    if (existing && !existing.emailVerified) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: hashed,
          accessStatus: "PENDING",
          canAccessHub: false,
          canAccessConference: false,
          canAccessAdmin: false,
          approvedAt: null,
          approvedBy: null,
          verifyToken: otp,
          verifyTokenExp: expiry,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashed,
          role: "USER",
          accessStatus: "PENDING",
          canAccessHub: false,
          canAccessConference: false,
          canAccessAdmin: false,
          emailVerified: false,
          verifyToken: otp,
          verifyTokenExp: expiry,
        },
      });
    }

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      console.error("[register] Failed to send verification email to:", email);
      return NextResponse.json(
        {
          message:
            "Account created, but we could not deliver the verification email yet. Please use resend.",
          emailSent: false,
        },
        { status: 202 },
      );
    }

    return NextResponse.json({ message: "Verification email sent", emailSent: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
