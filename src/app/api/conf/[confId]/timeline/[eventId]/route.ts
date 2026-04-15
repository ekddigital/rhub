import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

function canEditTimelineRole(role: string): boolean {
  // Chair-level control in the platform role model.
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "CHAIR";
}

// GET /api/conf/[confId]/timeline/[eventId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; eventId: string }> },
) {
  try {
    const { confId, eventId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const event = await prisma.confTimeline.findUnique({
      where: { id: eventId },
    });

    if (!event || event.confId !== confId) {
      return NextResponse.json(
        { error: "Timeline event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to fetch timeline event:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline event" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/timeline/[eventId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; eventId: string }> },
) {
  try {
    const { confId, eventId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const actor = auth.access.user;
    if (!actor) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!canEditTimelineRole(actor.role)) {
      return NextResponse.json(
        { error: "Chair or Super Admin access required" },
        { status: 403 },
      );
    }

    const current = await prisma.confTimeline.findUnique({
      where: { id: eventId },
    });

    if (!current || current.confId !== confId) {
      return NextResponse.json(
        { error: "Timeline event not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.isCompleted !== "undefined") {
      if (typeof body.isCompleted !== "boolean") {
        return NextResponse.json(
          { error: "isCompleted must be a boolean" },
          { status: 400 },
        );
      }

      updates.isCompleted = body.isCompleted;
      updates.completedAt = body.isCompleted ? new Date() : null;
    }

    if (typeof body.title === "string") {
      updates.title = body.title.trim();
    }

    if (typeof body.description === "string") {
      updates.description = body.description || null;
    }

    if (typeof body.date === "string") {
      updates.date = new Date(body.date);
    }

    if (typeof body.category === "string") {
      updates.category = body.category || null;
    }

    if (typeof body.responsibleLead === "string") {
      updates.responsibleLead = body.responsibleLead.trim() || null;
    }

    if (typeof body.isCritical !== "undefined") {
      if (typeof body.isCritical !== "boolean") {
        return NextResponse.json(
          { error: "isCritical must be a boolean" },
          { status: 400 },
        );
      }
      updates.isCritical = body.isCritical;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const event = await prisma.confTimeline.update({
      where: { id: eventId },
      data: updates,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to update timeline event:", error);
    return NextResponse.json(
      { error: "Failed to update timeline event" },
      { status: 500 },
    );
  }
}
