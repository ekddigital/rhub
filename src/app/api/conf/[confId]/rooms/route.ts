import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { ROOM_ASSIGNMENT_INCLUDE } from "@/lib/conf/room-assignments-server";
import { isDelegateEligibleForRoomPairing } from "@/lib/conf/room-pairing-eligibility";

/**
 * GET /api/conf/[confId]/rooms
 *
 * Returns a unified snapshot for the room-pairing page.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const myDelegate = auth.access.user
      ? await prisma.confDelegate.findFirst({
          where: { confId, userId: auth.access.user.id },
          select: {
            id: true,
            name: true,
            delegateCode: true,
            gender: true,
            city: true,
            roomPref: true,
            wantsSingleRoom: true,
            accommodationNeeded: true,
            feePackageId: true,
            partnerClaimNote: true,
            feePaid: true,
            amountPaid: true,
            feeAmount: true,
            status: true,
            guestCount: true,
            bringingForeignGuest: true,
          },
        })
      : null;

    const myId = myDelegate?.id ?? null;

    const myAssignment = myId
      ? await prisma.confRoomAssignment.findFirst({
          where: {
            status: { not: "CANCELLED" },
            OR: [{ occupantAId: myId }, { occupantBId: myId }],
          },
          include: ROOM_ASSIGNMENT_INCLUDE,
        })
      : null;

    const sentRequests = myId
      ? await prisma.confPairRequest.findMany({
          where: { confId, requesterId: myId },
          include: {
            target: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const receivedRequests = myId
      ? await prisma.confPairRequest.findMany({
          where: { confId, targetId: myId },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const allAssignedDelegateIds = await prisma.confRoomAssignment
      .findMany({
        where: { confId, status: { not: "CANCELLED" } },
        select: { occupantAId: true, occupantBId: true },
      })
      .then((rows) =>
        rows.flatMap(
          (r) => [r.occupantAId, r.occupantBId].filter(Boolean) as string[],
        ),
      );

    const candidateDelegates = await prisma.confDelegate.findMany({
      where: {
        confId,
        id: {
          notIn: [...(myId ? [myId] : []), ...allAssignedDelegateIds],
        },
      },
      select: {
        id: true,
        name: true,
        delegateCode: true,
        gender: true,
        city: true,
        feePackageId: true,
        roomPref: true,
        wantsSingleRoom: true,
        accommodationNeeded: true,
        feePaid: true,
        amountPaid: true,
        feeAmount: true,
        status: true,
        guestCount: true,
        partnerClaimNote: true,
        bringingForeignGuest: true,
      },
      orderBy: [{ gender: "asc" }, { name: "asc" }],
    });

    const pairableEligibleDelegates = candidateDelegates.filter((d) =>
      isDelegateEligibleForRoomPairing(d),
    );

    const payload: Record<string, unknown> = {
      myDelegate,
      myAssignment,
      sentRequests,
      receivedRequests,
      eligibleDelegates: pairableEligibleDelegates,
    };

    if (auth.access.isManager) {
      const [allRequests, allAssignments] = await Promise.all([
        prisma.confPairRequest.findMany({
          where: { confId },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
            target: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.confRoomAssignment.findMany({
          where: { confId },
          include: ROOM_ASSIGNMENT_INCLUDE,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      payload.allRequests = allRequests;
      payload.allAssignments = allAssignments;
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to fetch room pairing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch room pairing data" },
      { status: 500 },
    );
  }
}
