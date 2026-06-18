import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// DELETE /api/conf/[confId]/logistics/name-list/[entryId]
export async function DELETE(
  _req: Request,
  {
    params,
  }: { params: Promise<{ confId: string; entryId: string }> },
) {
  try {
    const { confId, entryId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const entry = await prisma.confLogisticsRosterEntry.findUnique({
      where: { id: entryId },
      select: {
        id: true,
        confId: true,
        source: true,
        delegateId: true,
      },
    });

    if (!entry || entry.confId !== confId) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.source !== "MANUAL") {
      return NextResponse.json(
        { error: "Only manual roster entries can be removed" },
        { status: 400 },
      );
    }

    await prisma.confLogisticsRosterEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ ok: true, delegateId: entry.delegateId });
  } catch (error) {
    console.error("[conf.logistics.name-list.delete]", error);
    return NextResponse.json(
      { error: "Failed to remove roster entry" },
      { status: 500 },
    );
  }
}
