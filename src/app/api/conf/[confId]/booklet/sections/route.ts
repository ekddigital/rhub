import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/booklet/sections
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const booklet = await prisma.confBooklet.findUnique({
      where: { confId },
      select: { id: true },
    });

    if (!booklet) {
      return NextResponse.json(
        { error: "Booklet not initialized. Call /booklet/config first." },
        { status: 404 },
      );
    }

    const sections = await prisma.confBookletSection.findMany({
      where: { bookletId: booklet.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("GET /booklet/sections error:", error);
    return NextResponse.json(
      { error: "Failed to load sections" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/booklet/sections
// Bulk update section order and enabled state.
// Body: { updates: Array<{ id: string; sortOrder?: number; isEnabled?: boolean }> }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const booklet = await prisma.confBooklet.findUnique({
      where: { confId },
      select: { id: true },
    });

    if (!booklet) {
      return NextResponse.json(
        { error: "Booklet not initialized" },
        { status: 404 },
      );
    }

    const body = (await req.json()) as { updates?: unknown[] };
    const updates = body.updates;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "updates must be an array" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      updates.map((u) => {
        const update = u as Record<string, unknown>;
        if (typeof update.id !== "string") return prisma.$queryRaw`SELECT 1`;
        return prisma.confBookletSection.update({
          where: { id: update.id, bookletId: booklet.id },
          data: {
            ...(typeof update.sortOrder === "number" && {
              sortOrder: update.sortOrder,
            }),
            ...(typeof update.isEnabled === "boolean" && {
              isEnabled: update.isEnabled,
            }),
          },
        });
      }),
    );

    const sections = await prisma.confBookletSection.findMany({
      where: { bookletId: booklet.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("PATCH /booklet/sections error:", error);
    return NextResponse.json(
      { error: "Failed to update sections" },
      { status: 500 },
    );
  }
}
