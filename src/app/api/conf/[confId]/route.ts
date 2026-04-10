import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conf/[confId] — get a single conference with all relations
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const event = await prisma.confEvent.findUnique({
      where: { id: confId },
      include: {
        members: { orderBy: { joinedAt: "asc" } },
        budgets: {
          include: {
            items: { orderBy: { no: "asc" } },
            creator: true,
            _count: { select: { payments: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        timeline: { orderBy: { date: "asc" } },
        _count: {
          select: {
            delegates: true,
            meetings: true,
            payments: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to fetch conference:", error);
    return NextResponse.json(
      { error: "Failed to fetch conference" },
      { status: 500 },
    );
  }
}
