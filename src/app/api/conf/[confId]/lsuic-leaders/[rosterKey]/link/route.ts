import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// PATCH /api/conf/[confId]/lsuic-leaders/[rosterKey]/link
export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ confId: string; rosterKey: string }> },
) {
  try {
    const { confId, rosterKey: rawKey } = await params;
    const rosterKey = decodeURIComponent(rawKey);
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      delegateId?: string | null;
      userId?: string | null;
    };

    if (body.delegateId === null && body.userId === null) {
      await prisma.confLsuicLeaderLink.deleteMany({
        where: { confId, rosterKey },
      });
      return NextResponse.json({ cleared: true });
    }

    let delegateId = body.delegateId ?? null;
    let userId = body.userId ?? null;

    if (delegateId) {
      const delegate = await prisma.confDelegate.findFirst({
        where: { id: delegateId, confId },
        select: { id: true, userId: true },
      });
      if (!delegate) {
        return NextResponse.json(
          { error: "Delegate not found for this conference" },
          { status: 404 },
        );
      }
      userId = delegate.userId ?? userId;
    }

    const link = await prisma.confLsuicLeaderLink.upsert({
      where: {
        confId_rosterKey: { confId, rosterKey },
      },
      create: {
        confId,
        rosterKey,
        delegateId,
        userId,
        linkSource: "MANUAL",
      },
      update: {
        delegateId,
        userId,
        linkSource: "MANUAL",
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error("PATCH /lsuic-leaders link error:", error);
    return NextResponse.json(
      { error: "Failed to update LSUIC leader link" },
      { status: 500 },
    );
  }
}
