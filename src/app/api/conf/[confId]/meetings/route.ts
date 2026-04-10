import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conf/[confId]/meetings
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const meetings = await prisma.confMeeting.findMany({
      where: { confId },
      orderBy: { meetingNo: "asc" },
    });
    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/meetings
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const body = await req.json();
    const { title, meetingNo, scheduled, location, agenda } = body;

    if (!title || !meetingNo || !scheduled) {
      return NextResponse.json(
        { error: "title, meetingNo, and scheduled are required" },
        { status: 400 },
      );
    }

    const meeting = await prisma.confMeeting.create({
      data: {
        confId,
        title,
        meetingNo: Number(meetingNo),
        scheduled: new Date(scheduled),
        location: location || null,
        agenda: agenda || null,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 },
    );
  }
}
