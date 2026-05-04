import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { getConferenceFeeAccommodationMode } from "@/lib/conf/fees";

/**
 * GET /api/conf/[confId]/rooms
 *
 * Returns a unified snapshot for the room-pairing page:
 *   - myDelegate: the calling user's own delegate record (if any)
 *   - myAssignment: current active room assignment (if any)
 *   - sentRequests: pair requests this delegate sent
 *   - receivedRequests: pair requests this delegate received
 *   - eligibleDelegates: all same-gender delegates who are open to pairing
 *     (excludes already-assigned and self)
 *
 * Managers also receive:
 *   - allRequests: every pending/accepted request for the conference
 *   - allAssignments: all room assignments
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    // Resolve current user's delegate record
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
          },
        })
      : null;

    const myId = myDelegate?.id ?? null;

    // Current room assignment
    const myAssignment = myId
      ? await prisma.confRoomAssignment.findFirst({
          where: {
            status: { not: "CANCELLED" },
            OR: [{ occupantAId: myId }, { occupantBId: myId }],
          },
          include: {
            occupantA: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
            occupantB: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
          },
        })
      : null;

    // Pair requests I sent
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

    // Pair requests others sent to me
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

    // Delegates available to pair with (same gender, pair-eligible, not already assigned)
    // We fetch all delegates open to pairing; the client can further filter
    const assignedIds = myAssignment
      ? [myAssignment.occupantAId, myAssignment.occupantBId ?? "__none__"]
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

    const eligibleDelegates = await prisma.confDelegate.findMany({
      where: {
        confId,
        roomPref: "PAIR",
        wantsSingleRoom: false,
        accommodationNeeded: { not: "NO" },
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
      },
      orderBy: [{ gender: "asc" }, { name: "asc" }],
    });

    // Filter out delegates on single-room packages
    const pairableEligibleDelegates = eligibleDelegates.filter((d) => {
      const mode = getConferenceFeeAccommodationMode(d.feePackageId);
      return mode !== "SINGLE" && mode !== "NONE";
    });

    const payload: Record<string, unknown> = {
      myDelegate,
      myAssignment,
      sentRequests,
      receivedRequests,
      eligibleDelegates: pairableEligibleDelegates,
    };

    // Managers get full conference view
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
          include: {
            occupantA: {
              select: {
                id: true,
                name: true,
                delegateCode: true,
                gender: true,
                city: true,
              },
            },
            occupantB: {
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
