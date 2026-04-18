import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// PATCH /api/conf/[confId]/booklet/sections/[sectionId]
// Update a single section's title, subtitle, bodyText, isEnabled, sortOrder, or committeeScope.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; sectionId: string }> },
) {
  try {
    const { confId, sectionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const booklet = await prisma.confBooklet.findUnique({
      where: { confId },
      select: { id: true },
    });
    if (!booklet) {
      return NextResponse.json({ error: "Booklet not found" }, { status: 404 });
    }

    const existing = await prisma.confBookletSection.findUnique({
      where: { id: sectionId },
    });
    if (!existing || existing.bookletId !== booklet.id) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const { title, subtitle, bodyText, isEnabled, sortOrder, committeeScope } =
      body;

    const updated = await prisma.confBookletSection.update({
      where: { id: sectionId },
      data: {
        ...(typeof title === "string" && { title: title.trim() }),
        ...(typeof subtitle === "string" && { subtitle: subtitle.trim() }),
        ...(typeof bodyText === "string" && { bodyText }),
        ...(typeof isEnabled === "boolean" && { isEnabled }),
        ...(typeof sortOrder === "number" && { sortOrder }),
        ...(typeof committeeScope === "string" && { committeeScope }),
      },
    });

    return NextResponse.json({ section: updated });
  } catch (error) {
    console.error("PATCH /booklet/sections/[sectionId] error:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/booklet/sections/[sectionId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; sectionId: string }> },
) {
  try {
    const { confId, sectionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const booklet = await prisma.confBooklet.findUnique({
      where: { confId },
      select: { id: true },
    });
    if (!booklet) {
      return NextResponse.json({ error: "Booklet not found" }, { status: 404 });
    }

    const existing = await prisma.confBookletSection.findUnique({
      where: { id: sectionId },
    });
    if (!existing || existing.bookletId !== booklet.id) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await prisma.confBookletSection.delete({ where: { id: sectionId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /booklet/sections/[sectionId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 },
    );
  }
}
