import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

type Action =
  | "accept"
  | "decline"
  | "chair-approve"
  | "chair-reject"
  | "cancel";

async function generateRoomCode(confId: string) {
  const count = await prisma.confRoomAssignment.count({ where: { confId } });
  return `RM-${String(count + 1).padStart(3, "0")}`;
}

async function hasActiveAssignment(delegateId: string) {
  const assignment = await prisma.confRoomAssignment.findFirst({
    where: {
      status: { not: "CANCELLED" },
      OR: [{ occupantAId: delegateId }, { occupantBId: delegateId }],
    },
    select: { id: true },
  });
  return Boolean(assignment);
}

// PATCH /api/conf/[confId]/pair-requests/[requestId]
export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ confId: string; requestId: string }>;
  },
) {
  try {
    const { confId, requestId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const action = String(body.action || "") as Action;
    const actorDelegateId = body.actorDelegateId
      ? String(body.actorDelegateId)
      : null;
    const roomCodeInput = body.roomCode ? String(body.roomCode) : null;
    const adminNote = body.adminNote ? String(body.adminNote) : null;

    if (
      !action ||
      ![
        "accept",
        "decline",
        "chair-approve",
        "chair-reject",
        "cancel",
      ].includes(action)
    ) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const pairRequest = await prisma.confPairRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            confId: true,
            gender: true,
            name: true,
          },
        },
        target: {
          select: {
            id: true,
            confId: true,
            gender: true,
            name: true,
          },
        },
      },
    });

    if (!pairRequest || pairRequest.confId !== confId) {
      return NextResponse.json(
        { error: "Pair request not found" },
        { status: 404 },
      );
    }

    if (action === "accept") {
      if (!pairRequest.targetId) {
        return NextResponse.json(
          { error: "Only target-based requests can be accepted" },
          { status: 400 },
        );
      }
      if (!actorDelegateId || actorDelegateId !== pairRequest.targetId) {
        return NextResponse.json(
          { error: "Only the requested partner can accept this request" },
          { status: 403 },
        );
      }

      const updated = await prisma.confPairRequest.update({
        where: { id: requestId },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      if (pairRequest.requestType === "STANDARD_PAIR") {
        if (
          pairRequest.requester.gender &&
          pairRequest.target?.gender &&
          pairRequest.requester.gender !== pairRequest.target.gender
        ) {
          return NextResponse.json(
            {
              error:
                "Cannot auto-pair across gender for standard requests. Use legal partner flow with chair approval.",
            },
            { status: 400 },
          );
        }

        if (await hasActiveAssignment(pairRequest.requesterId)) {
          return NextResponse.json(
            { error: "Requester already has a room assignment" },
            { status: 409 },
          );
        }
        if (
          pairRequest.targetId &&
          (await hasActiveAssignment(pairRequest.targetId))
        ) {
          return NextResponse.json(
            { error: "Target delegate already has a room assignment" },
            { status: 409 },
          );
        }

        await prisma.confRoomAssignment.create({
          data: {
            confId,
            roomCode: roomCodeInput || (await generateRoomCode(confId)),
            occupantAId: pairRequest.requesterId,
            occupantBId: pairRequest.targetId,
            status: "ASSIGNED",
            isManual: false,
          },
        });
      }

      return NextResponse.json(updated);
    }

    if (action === "decline") {
      if (
        pairRequest.targetId &&
        actorDelegateId &&
        actorDelegateId !== pairRequest.targetId
      ) {
        return NextResponse.json(
          { error: "Only the requested partner can decline this request" },
          { status: 403 },
        );
      }

      const updated = await prisma.confPairRequest.update({
        where: { id: requestId },
        data: {
          status: "DECLINED",
          respondedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "cancel") {
      const updated = await prisma.confPairRequest.update({
        where: { id: requestId },
        data: {
          status: "CANCELLED",
          respondedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "chair-reject") {
      const updated = await prisma.confPairRequest.update({
        where: { id: requestId },
        data: {
          status: "CHAIR_REJECTED",
          adminNote,
          respondedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // action === "chair-approve"
    if (await hasActiveAssignment(pairRequest.requesterId)) {
      return NextResponse.json(
        { error: "Requester already has a room assignment" },
        { status: 409 },
      );
    }

    if (
      pairRequest.targetId &&
      (await hasActiveAssignment(pairRequest.targetId))
    ) {
      return NextResponse.json(
        { error: "Target delegate already has a room assignment" },
        { status: 409 },
      );
    }

    if (
      pairRequest.requestType !== "LEGAL_PARTNER" &&
      pairRequest.targetId &&
      pairRequest.requester.gender &&
      pairRequest.target?.gender &&
      pairRequest.requester.gender !== pairRequest.target.gender
    ) {
      return NextResponse.json(
        {
          error:
            "Only legal partner exception requests can bypass same-gender room pairing rules.",
        },
        { status: 400 },
      );
    }

    const assignment = await prisma.confRoomAssignment.create({
      data: {
        confId,
        roomCode: roomCodeInput || (await generateRoomCode(confId)),
        occupantAId: pairRequest.requesterId,
        occupantBId: pairRequest.targetId,
        status: "ASSIGNED",
        isManual: true,
        overrideReason:
          pairRequest.requestType === "LEGAL_PARTNER"
            ? "Legal partner exception approved by chair"
            : pairRequest.requestType === "SINGLE_ROOM"
              ? "Single-room request approved by chair"
              : adminNote,
      },
    });

    const updated = await prisma.confPairRequest.update({
      where: { id: requestId },
      data: {
        status: "CHAIR_APPROVED",
        adminNote,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ updated, assignment });
  } catch (error) {
    console.error("Failed to update pair request:", error);
    return NextResponse.json(
      { error: "Failed to update pair request" },
      { status: 500 },
    );
  }
}
