import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/participants
// Aggregated participant dashboard payload: delegates, pair requests, room assignments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const [delegates, pairRequests, roomAssignments] = await Promise.all([
      prisma.confDelegate.findMany({
        where: { confId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.confPairRequest.findMany({
        where: { confId },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              delegateCode: true,
              gender: true,
            },
          },
          target: {
            select: {
              id: true,
              name: true,
              delegateCode: true,
              gender: true,
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
            },
          },
          occupantB: {
            select: {
              id: true,
              name: true,
              delegateCode: true,
              gender: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      delegates,
      pairRequests,
      roomAssignments,
      counts: {
        delegates: delegates.length,
        paidDelegates: delegates.filter((d) => d.feePaid).length,
        flyerReady: delegates.filter((d) => d.flyerReady).length,
        pairRequests: pairRequests.length,
        roomAssignments: roomAssignments.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch participants dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants dashboard" },
      { status: 500 },
    );
  }
}
