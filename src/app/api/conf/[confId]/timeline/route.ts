import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conf/[confId]/timeline
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
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
    const body = await req.json();
    const { title, description, date, endDate, category, sortOrder } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 },
      );
    }

    const event = await prisma.confTimeline.create({
      data: {
        confId,
        title,
        description: description || null,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        category: category || null,
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
