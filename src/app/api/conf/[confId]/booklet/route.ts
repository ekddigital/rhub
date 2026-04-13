import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

type BookletScope = "all" | "paid" | "confirmed";

function parseScope(scope: string | null): BookletScope {
  if (scope === "paid" || scope === "confirmed") return scope;
  return "all";
}

// GET /api/conf/[confId]/booklet
// Returns booklet-ready participant data with room assignment context.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const scope = parseScope(new URL(req.url).searchParams.get("scope"));

    const event = await prisma.confEvent.findUnique({
      where: { id: confId },
      select: {
        id: true,
        name: true,
        slug: true,
        year: true,
        city: true,
        venue: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    const where: {
      confId: string;
      feePaid?: boolean;
      status?: { in: Array<"CONFIRMED" | "ATTENDED"> };
    } = { confId };

    if (scope === "paid") {
      where.feePaid = true;
    }

    if (scope === "confirmed") {
      where.status = { in: ["CONFIRMED", "ATTENDED"] };
    }

    const [delegates, roomAssignments] = await Promise.all([
      prisma.confDelegate.findMany({
        where,
        select: {
          id: true,
          name: true,
          delegateCode: true,
          passportNo: true,
          gender: true,
          university: true,
          city: true,
          phone: true,
          wechat: true,
          email: true,
          feePaid: true,
          status: true,
          roomPref: true,
          bookletPhotoPath: true,
          partnerClaimNote: true,
          createdAt: true,
        },
        orderBy: [{ delegateCode: "asc" }, { createdAt: "asc" }],
      }),
      prisma.confRoomAssignment.findMany({
        where: {
          confId,
          status: { not: "CANCELLED" },
        },
        select: {
          id: true,
          roomCode: true,
          isManual: true,
          overrideReason: true,
          occupantA: {
            select: {
              id: true,
              name: true,
            },
          },
          occupantB: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const roomByDelegate = new Map<
      string,
      {
        roomCode: string;
        roommateName: string | null;
        roomType: "PAIR" | "SINGLE";
        isManual: boolean;
        overrideReason: string | null;
      }
    >();

    for (const assignment of roomAssignments) {
      const roomType = assignment.occupantB ? "PAIR" : "SINGLE";

      roomByDelegate.set(assignment.occupantA.id, {
        roomCode: assignment.roomCode,
        roommateName: assignment.occupantB?.name || null,
        roomType,
        isManual: assignment.isManual,
        overrideReason: assignment.overrideReason,
      });

      if (assignment.occupantB) {
        roomByDelegate.set(assignment.occupantB.id, {
          roomCode: assignment.roomCode,
          roommateName: assignment.occupantA.name,
          roomType,
          isManual: assignment.isManual,
          overrideReason: assignment.overrideReason,
        });
      }
    }

    const origin = new URL(req.url).origin;

    const participants = delegates.map((delegate) => {
      const room = roomByDelegate.get(delegate.id);
      return {
        ...delegate,
        bookletPhotoPath: delegate.bookletPhotoPath
          ? resolveStoredAssetUrl(delegate.bookletPhotoPath, origin)
          : null,
        roomCode: room?.roomCode || null,
        roommateName: room?.roommateName || null,
        roomType: room?.roomType || null,
        roomManualOverride: room?.isManual || false,
        roomOverrideReason: room?.overrideReason || null,
      };
    });

    const counts = {
      total: participants.length,
      paid: participants.filter((p) => p.feePaid).length,
      confirmed: participants.filter(
        (p) => p.status === "CONFIRMED" || p.status === "ATTENDED",
      ).length,
      withBookletPhotos: participants.filter((p) => p.bookletPhotoPath).length,
      assignedRooms: participants.filter((p) => p.roomCode).length,
    };

    return NextResponse.json({
      event,
      scope,
      participants,
      counts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to build conference booklet payload:", error);
    return NextResponse.json(
      { error: "Failed to build conference booklet payload" },
      { status: 500 },
    );
  }
}
