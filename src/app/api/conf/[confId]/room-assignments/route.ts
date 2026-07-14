import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  buildRoomAssignmentWriteData,
  fetchDelegateForPairing,
  findCancelledRoomAssignmentSlot,
  formatRoomAssignmentWriteError,
  generateRoomCode,
  hasActiveAssignment,
  parseRoomAssignmentOccupantBInput,
  ROOM_ASSIGNMENT_INCLUDE,
  validateOccupantPairing,
} from "@/lib/conf/room-assignments-server";
import { buildRoomAssignmentVisibilityWhere } from "@/lib/conf/room-pairing-access";

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
      where: buildRoomAssignmentVisibilityWhere(confId, auth.access),
      include: ROOM_ASSIGNMENT_INCLUDE,
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
    const { occupantBId, companionGuestId } =
      parseRoomAssignmentOccupantBInput(body);
    const roomCode = body.roomCode ? String(body.roomCode).trim() : null;
    const overrideReason = body.overrideReason
      ? String(body.overrideReason).trim() || null
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

    if (companionGuestId) {
      const guest = await prisma.confDelegateGuest.findFirst({
        where: {
          id: companionGuestId,
          delegateId: occupantAId,
          confId,
        },
        select: { id: true },
      });
      if (!guest) {
        return NextResponse.json(
          { error: "Selected guest does not belong to the primary delegate" },
          { status: 400 },
        );
      }
    }

    const occupantA = await fetchDelegateForPairing(occupantAId);
    if (!occupantA || occupantA.confId !== confId) {
      return NextResponse.json(
        { error: "Primary delegate not found" },
        { status: 404 },
      );
    }

    let occupantB = null;
    if (occupantBId) {
      occupantB = await fetchDelegateForPairing(occupantBId);
      if (!occupantB || occupantB.confId !== confId) {
        return NextResponse.json(
          { error: "Second delegate not found" },
          { status: 404 },
        );
      }
    }

    const validationError = validateOccupantPairing(
      occupantA,
      occupantB,
      overrideReason,
      { companionGuestId },
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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

    const resolvedRoomCode = roomCode || (await generateRoomCode(confId));

    if (roomCode) {
      const duplicateCode = await prisma.confRoomAssignment.findFirst({
        where: {
          confId,
          roomCode: resolvedRoomCode,
          status: { not: "CANCELLED" },
        },
        select: { id: true },
      });
      if (duplicateCode) {
        return NextResponse.json(
          { error: "Room code is already in use" },
          { status: 409 },
        );
      }
    }

    const assignmentData = buildRoomAssignmentWriteData({
      occupantAId,
      occupantBId,
      companionGuestId,
      overrideReason,
    });

    const cancelledSlot = await findCancelledRoomAssignmentSlot(
      confId,
      resolvedRoomCode,
    );

    const assignment = cancelledSlot
      ? await prisma.confRoomAssignment.update({
          where: { id: cancelledSlot.id },
          data: assignmentData,
          include: ROOM_ASSIGNMENT_INCLUDE,
        })
      : await prisma.confRoomAssignment.create({
          data: {
            confId,
            roomCode: resolvedRoomCode,
            ...assignmentData,
          },
          include: ROOM_ASSIGNMENT_INCLUDE,
        });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Failed to create room assignment:", error);
    const specificError = formatRoomAssignmentWriteError(error);
    return NextResponse.json(
      { error: specificError || "Failed to create room assignment" },
      { status: specificError ? 409 : 500 },
    );
  }
}
