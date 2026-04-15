import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

const MEET_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

const MINUTES_STATUSES = [
  "NONE",
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "CHANGES_REQUESTED",
] as const;

type MinutesStatus = (typeof MINUTES_STATUSES)[number];

type MeetStatus = (typeof MEET_STATUSES)[number];

function isMinutesStatus(value: unknown): value is MinutesStatus {
  return (
    typeof value === "string" &&
    (MINUTES_STATUSES as readonly string[]).includes(value)
  );
}

function isMeetStatus(value: unknown): value is MeetStatus {
  return (
    typeof value === "string" &&
    (MEET_STATUSES as readonly string[]).includes(value)
  );
}

function canApproveMinutesRole(role: string): boolean {
  // Keep consistent with client: ADMIN represents chair-level control.
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function isSuperAdminRole(role: string): boolean {
  return role === "SUPER_ADMIN";
}

// GET /api/conf/[confId]/meetings/[meetingId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; meetingId: string }> },
) {
  try {
    const { confId, meetingId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const meeting = await prisma.confMeeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting || meeting.confId !== confId) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Failed to fetch meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/meetings/[meetingId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; meetingId: string }> },
) {
  try {
    const { confId, meetingId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const actor = auth.access.user;
    if (!actor) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const current = await prisma.confMeeting.findUnique({
      where: { id: meetingId },
    });

    if (!current || current.confId !== confId) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const body = await req.json();

    const updates: Record<string, unknown> = {};

    if (typeof body.agenda !== "undefined") {
      if (!isSuperAdminRole(actor.role)) {
        return NextResponse.json(
          { error: "Super Admin access required to edit agenda" },
          { status: 403 },
        );
      }

      if (typeof body.agenda !== "string") {
        return NextResponse.json(
          { error: "agenda must be a string" },
          { status: 400 },
        );
      }

      updates.agenda = body.agenda.trim() || null;
    }

    if (typeof body.minutes !== "undefined") {
      if (typeof body.minutes !== "string") {
        return NextResponse.json(
          { error: "minutes must be a string" },
          { status: 400 },
        );
      }

      if (
        current.minutesStatus === "APPROVED" &&
        !isSuperAdminRole(actor.role)
      ) {
        return NextResponse.json(
          { error: "Approved minutes are locked" },
          { status: 403 },
        );
      }

      updates.minutes = body.minutes || null;
    }

    if (typeof body.status !== "undefined") {
      if (!isMeetStatus(body.status)) {
        return NextResponse.json(
          { error: "status is invalid" },
          { status: 400 },
        );
      }

      updates.status = body.status;
    }

    if (typeof body.chairNote !== "undefined") {
      if (!canApproveMinutesRole(actor.role)) {
        return NextResponse.json(
          { error: "Chair access required to set chairNote" },
          { status: 403 },
        );
      }

      if (body.chairNote === null) {
        updates.chairNote = null;
      } else if (typeof body.chairNote === "string") {
        updates.chairNote = body.chairNote.trim() || null;
      } else {
        return NextResponse.json(
          { error: "chairNote must be a string or null" },
          { status: 400 },
        );
      }
    }

    if (typeof body.minutesStatus !== "undefined") {
      if (!isMinutesStatus(body.minutesStatus)) {
        return NextResponse.json(
          { error: "minutesStatus is invalid" },
          { status: 400 },
        );
      }

      const nextStatus = body.minutesStatus;

      if (
        (nextStatus === "APPROVED" || nextStatus === "CHANGES_REQUESTED") &&
        !canApproveMinutesRole(actor.role)
      ) {
        return NextResponse.json(
          { error: "Chair access required to approve/request changes" },
          { status: 403 },
        );
      }

      if (
        current.minutesStatus === "APPROVED" &&
        nextStatus !== "APPROVED" &&
        !isSuperAdminRole(actor.role)
      ) {
        return NextResponse.json(
          { error: "Only Super Admin can re-open approved minutes" },
          { status: 403 },
        );
      }

      if (nextStatus === "CHANGES_REQUESTED") {
        const note =
          typeof body.chairNote === "string" ? body.chairNote.trim() : "";

        if (!note) {
          return NextResponse.json(
            { error: "chairNote is required when requesting changes" },
            { status: 400 },
          );
        }

        updates.chairNote = note;
      }

      if (nextStatus === "APPROVED") {
        updates.chairNote = null;
        updates.minutesApprovedAt = new Date();
        updates.minutesApprovedBy = actor.id;
      }

      if (nextStatus === "DRAFT" || nextStatus === "PENDING_APPROVAL") {
        updates.minutesSubmittedBy = actor.name;
      }

      updates.minutesStatus = nextStatus;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const meeting = await prisma.confMeeting.update({
      where: { id: meetingId },
      data: updates,
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Failed to update meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 },
    );
  }
}
