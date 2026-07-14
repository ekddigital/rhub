import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSessionWithContext } from "@/lib/auth";
import {
  canImpersonate,
  isImpersonationTargetAllowed,
} from "@/lib/auth/impersonation";

/**
 * POST /api/admin/impersonate
 * Body: { targetUserId: string }
 * Starts an impersonation session for the current admin.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await validateSessionWithContext(token);
  if (!ctx || ctx.isImpersonating) {
    return NextResponse.json(
      {
        error: ctx?.isImpersonating
          ? "Cannot impersonate while already impersonating"
          : "Unauthorized",
      },
      { status: 401 },
    );
  }

  if (!canImpersonate(ctx.realUser)) {
    return NextResponse.json(
      { error: "You do not have permission to impersonate users" },
      { status: 403 },
    );
  }

  const body = (await req.json()) as { targetUserId?: string; note?: string };
  if (!body.targetUserId) {
    return NextResponse.json(
      { error: "targetUserId is required" },
      { status: 400 },
    );
  }

  if (body.targetUserId === ctx.realUser.id) {
    return NextResponse.json(
      { error: "Cannot impersonate yourself" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: body.targetUserId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!target) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 },
    );
  }

  if (
    !isImpersonationTargetAllowed({
      id: target.id,
      role: target.role,
      actorId: ctx.realUser.id,
    })
  ) {
    return NextResponse.json(
      { error: "This account cannot be impersonated" },
      { status: 403 },
    );
  }

  await prisma.$transaction([
    prisma.session.update({
      where: { token },
      data: { impersonatingUserId: target.id },
    }),
    prisma.impersonationLog.create({
      data: {
        actorUserId: ctx.realUser.id,
        actorName: ctx.realUser.name,
        targetUserId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        note: body.note ?? null,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    impersonating: { id: target.id, name: target.name, email: target.email },
  });
}

/**
 * DELETE /api/admin/impersonate
 * Ends the current impersonation session.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.session.findUnique({
    where: { token },
    select: { impersonatingUserId: true, userId: true },
  });

  if (!session)
    return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (session.impersonatingUserId) {
    await prisma.$transaction([
      prisma.session.update({
        where: { token },
        data: { impersonatingUserId: null },
      }),
      prisma.impersonationLog.updateMany({
        where: {
          actorUserId: session.userId,
          targetUserId: session.impersonatingUserId,
          endedAt: null,
        },
        data: { endedAt: new Date() },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}

/**
 * GET /api/admin/impersonate
 * Returns current impersonation state.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ impersonating: null });

  const ctx = await validateSessionWithContext(token);
  if (!ctx) return NextResponse.json({ impersonating: null });

  if (!ctx.isImpersonating) {
    return NextResponse.json({ impersonating: null });
  }

  return NextResponse.json({
    impersonating: {
      id: ctx.effectiveUser.id,
      name: ctx.effectiveUser.name,
      email: ctx.effectiveUser.email,
      role: ctx.effectiveUser.role,
    },
    realAdmin: {
      id: ctx.realUser.id,
      name: ctx.realUser.name,
    },
  });
}
