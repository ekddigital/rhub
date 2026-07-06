import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  fetchDelegateForPairing,
  hasActiveAssignment,
  ROOM_ASSIGNMENT_INCLUDE,
  validateOccupantPairing,
} from "@/lib/conf/room-assignments-server";

type RouteParams = { params: Promise<{ confId: string; assignmentId: string }> };

// PATCH /api/conf/[confId]/room-assignments/[assignmentId]
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { confId, assignmentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confRoomAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json(
        { error: "Room assignment not found" },
        { status: 404 },
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot edit a cancelled assignment" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const occupantAId =
      typeof body.occupantAId === "string"
        ? body.occupantAId
        : existing.occupantAId;
    const occupantBId =
      body.occupantBId === null
        ? null
        : typeof body.occupantBId === "string"
          ? body.occupantBId
          : existing.occupantBId;
    const roomCode =
      typeof body.roomCode === "string" && body.roomCode.trim()
        ? body.roomCode.trim()
        : existing.roomCode;
    const overrideReason =
      typeof body.overrideReason === "string"
        ? body.overrideReason.trim() || null
        : existing.overrideReason;
    const status =
      body.status === "CANCELLED" ||
      body.status === "ASSIGNED" ||
      body.status === "PENDING"
        ? body.status
        : existing.status;

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
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (await hasActiveAssignment(occupantAId, assignmentId)) {
      return NextResponse.json(
        { error: "Primary delegate already has another active room assignment" },
        { status: 409 },
      );
    }

    if (occupantBId && (await hasActiveAssignment(occupantBId, assignmentId))) {
      return NextResponse.json(
        { error: "Second delegate already has another active room assignment" },
        { status: 409 },
      );
    }

    if (roomCode !== existing.roomCode) {
      const duplicateCode = await prisma.confRoomAssignment.findFirst({
        where: {
          confId,
          roomCode,
          id: { not: assignmentId },
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

    const assignment = await prisma.confRoomAssignment.update({
      where: { id: assignmentId },
      data: {
        roomCode,
        occupantAId,
        occupantBId,
        overrideReason,
        status,
      },
      include: ROOM_ASSIGNMENT_INCLUDE,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Failed to update room assignment:", error);
    return NextResponse.json(
      { error: "Failed to update room assignment" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/room-assignments/[assignmentId]
// Unassigns occupants by marking the assignment CANCELLED.
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { confId, assignmentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confRoomAssignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, confId: true, status: true },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json(
        { error: "Room assignment not found" },
        { status: 404 },
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json({ ok: true });
    }

    const assignment = await prisma.confRoomAssignment.update({
      where: { id: assignmentId },
      data: { status: "CANCELLED" },
      include: ROOM_ASSIGNMENT_INCLUDE,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Failed to unassign room:", error);
    return NextResponse.json(
      { error: "Failed to unassign room" },
      { status: 500 },
    );
  }
}
