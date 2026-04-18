import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// PATCH /api/conf/[confId]/booklet/leaders/[leaderId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; leaderId: string }> },
) {
  try {
    const { confId, leaderId } = await params;
    const auth = await requireConferenceApiAccess(confId, "super-admin");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confLeaderProfile.findUnique({
      where: { id: leaderId },
    });
    if (!existing || (existing.confId !== null && existing.confId !== confId)) {
      return NextResponse.json({ error: "Leader not found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const { role, name, title, bio, photoPath, photoFileName, country, sortOrder, isActive } =
      body;

    const updated = await prisma.confLeaderProfile.update({
      where: { id: leaderId },
      data: {
        ...(typeof role === "string" && { role: role.trim() }),
        ...(typeof name === "string" && { name: name.trim() }),
        ...(typeof title === "string" && { title: title.trim() }),
        ...(typeof bio === "string" && { bio }),
        ...(typeof photoPath === "string" && { photoPath }),
        ...(typeof photoFileName === "string" && { photoFileName }),
        ...(typeof country === "string" && { country }),
        ...(typeof sortOrder === "number" && { sortOrder }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
    });

    return NextResponse.json({ leader: updated });
  } catch (error) {
    console.error("PATCH /booklet/leaders/[leaderId] error:", error);
    return NextResponse.json(
      { error: "Failed to update leader profile" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/booklet/leaders/[leaderId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; leaderId: string }> },
) {
  try {
    const { confId, leaderId } = await params;
    const auth = await requireConferenceApiAccess(confId, "super-admin");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confLeaderProfile.findUnique({
      where: { id: leaderId },
    });
    if (!existing || (existing.confId !== null && existing.confId !== confId)) {
      return NextResponse.json({ error: "Leader not found" }, { status: 404 });
    }

    await prisma.confLeaderProfile.delete({ where: { id: leaderId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /booklet/leaders/[leaderId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete leader profile" },
      { status: 500 },
    );
  }
}
