import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

function canEditTimelineRole(role: string): boolean {
  // Chair-level control in the platform role model.
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "CHAIR";
}

// GET /api/conf/[confId]/timeline
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const events = await prisma.confTimeline.findMany({
      where: { confId },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/timeline
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
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

    const body = await req.json();
    const {
      clientId,
      title,
      description,
      responsibleLead,
      isCritical,
      date,
      endDate,
      category,
      sortOrder,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 },
      );
    }

    if (typeof clientId !== "undefined" && typeof clientId !== "string") {
      return NextResponse.json(
        { error: "clientId must be a string" },
        { status: 400 },
      );
    }

    if (
      typeof responsibleLead !== "undefined" &&
      typeof responsibleLead !== "string"
    ) {
      return NextResponse.json(
        { error: "responsibleLead must be a string" },
        { status: 400 },
      );
    }

    if (typeof isCritical !== "undefined" && typeof isCritical !== "boolean") {
      return NextResponse.json(
        { error: "isCritical must be a boolean" },
        { status: 400 },
      );
    }

    const event = await prisma.confTimeline.create({
      data: {
        confId,
        clientId:
          typeof clientId === "string" && clientId.trim()
            ? clientId.trim()
            : null,
        title,
        description: description || null,
        responsibleLead:
          typeof responsibleLead === "string" && responsibleLead.trim()
            ? responsibleLead.trim()
            : null,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        category: category || null,
        isCritical: typeof isCritical === "boolean" ? isCritical : false,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Failed to create timeline event:", error);
    return NextResponse.json(
      { error: "Failed to create timeline event" },
      { status: 500 },
    );
  }
}
