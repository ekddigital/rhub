import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { getConferenceFeeAccommodationMode } from "@/lib/conf/fees";

function isPairEligible(delegate: {
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  feePackageId: string | null;
}) {
  const packageAccommodationMode = getConferenceFeeAccommodationMode(
    delegate.feePackageId,
  );
  if (packageAccommodationMode === "SINGLE" || packageAccommodationMode === "NONE") {
    return false;
  }
  if (delegate.accommodationNeeded === "NO") return false;
  if (delegate.wantsSingleRoom) return false;
  return delegate.roomPref === "PAIR";
}

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

// GET /api/conf/[confId]/room-assignments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const assignments = await prisma.confRoomAssignment.findMany({
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
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Failed to fetch room assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch room assignments" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/room-assignments
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();

    const occupantAId = String(body.occupantAId || "");
    const occupantBId = body.occupantBId ? String(body.occupantBId) : null;
    const roomCode = body.roomCode ? String(body.roomCode) : null;
    const overrideReason = body.overrideReason
      ? String(body.overrideReason)
      : null;

    if (!occupantAId) {
      return NextResponse.json(
        { error: "occupantAId is required" },
        { status: 400 },
      );
    }

    if (occupantBId && occupantAId === occupantBId) {
      return NextResponse.json(
        { error: "A delegate cannot be paired with themselves" },
        { status: 400 },
      );
    }

    const occupantA = await prisma.confDelegate.findUnique({
      where: { id: occupantAId },
      select: {
        id: true,
        confId: true,
        gender: true,
        roomPref: true,
        wantsSingleRoom: true,
        accommodationNeeded: true,
        feePackageId: true,
      },
    });

    if (!occupantA || occupantA.confId !== confId) {
      return NextResponse.json(
        { error: "Primary delegate not found" },
        { status: 404 },
      );
    }

    let occupantB: {
      id: string;
      confId: string;
      gender: "MALE" | "FEMALE" | null;
      roomPref: "PAIR" | "SINGLE";
      wantsSingleRoom: boolean;
      accommodationNeeded: "YES" | "NO" | "OTHER" | null;
      feePackageId: string | null;
    } | null = null;

    if (occupantBId) {
      occupantB = await prisma.confDelegate.findUnique({
        where: { id: occupantBId },
        select: {
          id: true,
          confId: true,
          gender: true,
          roomPref: true,
          wantsSingleRoom: true,
          accommodationNeeded: true,
          feePackageId: true,
        },
      });
      if (!occupantB || occupantB.confId !== confId) {
        return NextResponse.json(
          { error: "Second delegate not found" },
          { status: 404 },
        );
      }
    }

    if (occupantB && !isPairEligible(occupantA)) {
      return NextResponse.json(
        {
          error:
            "Primary delegate is not eligible for pairing (single-room or no-accommodation registration).",
        },
        { status: 400 },
      );
    }

    if (occupantB && !isPairEligible(occupantB)) {
      return NextResponse.json(
        {
          error:
            "Second delegate is not eligible for pairing (single-room or no-accommodation registration).",
        },
        { status: 400 },
      );
    }

    if (await hasActiveAssignment(occupantAId)) {
      return NextResponse.json(
        { error: "Primary delegate already has an active room assignment" },
        { status: 409 },
      );
    }

    if (occupantBId && (await hasActiveAssignment(occupantBId))) {
      return NextResponse.json(
        { error: "Second delegate already has an active room assignment" },
        { status: 409 },
      );
    }

    if (
      occupantB &&
      occupantA.gender &&
      occupantB.gender &&
      occupantA.gender !== occupantB.gender &&
      !overrideReason
    ) {
      return NextResponse.json(
        {
          error:
            "Cross-gender room assignment requires an override reason (legal partner exception).",
        },
        { status: 400 },
      );
    }

    const assignment = await prisma.confRoomAssignment.create({
      data: {
        confId,
        roomCode: roomCode || (await generateRoomCode(confId)),
        occupantAId,
        occupantBId,
        status: "ASSIGNED",
        isManual: true,
        overrideReason: overrideReason || null,
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
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Failed to create room assignment:", error);
    return NextResponse.json(
      { error: "Failed to create room assignment" },
      { status: 500 },
    );
  }
}
