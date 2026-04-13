import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conf/[confId]/pair-requests
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const requests = await prisma.confPairRequest.findMany({
      where: { confId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            delegateCode: true,
            gender: true,
            city: true,
          },
        },
        target: {
          select: {
            id: true,
            name: true,
            delegateCode: true,
            gender: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch pair requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch pair requests" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/pair-requests
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const body = await req.json();

    const requesterId = String(body.requesterId || "");
    const targetId = body.targetId ? String(body.targetId) : null;
    const requestType = String(body.requestType || "STANDARD_PAIR");
    const note = body.note ? String(body.note) : null;

    if (!requesterId) {
      return NextResponse.json(
        { error: "requesterId is required" },
        { status: 400 },
      );
    }

    if (
      !["STANDARD_PAIR", "LEGAL_PARTNER", "SINGLE_ROOM"].includes(requestType)
    ) {
      return NextResponse.json(
        { error: "Invalid requestType" },
        { status: 400 },
      );
    }

    const requester = await prisma.confDelegate.findUnique({
      where: { id: requesterId },
      select: {
        id: true,
        confId: true,
        gender: true,
        wantsSingleRoom: true,
      },
    });

    if (!requester || requester.confId !== confId) {
      return NextResponse.json(
        { error: "Requester delegate not found" },
        { status: 404 },
      );
    }

    if (requestType !== "SINGLE_ROOM" && !targetId) {
      return NextResponse.json(
        { error: "targetId is required for pair requests" },
        { status: 400 },
      );
    }

    if (targetId && targetId === requesterId) {
      return NextResponse.json(
        { error: "Cannot pair with yourself" },
        { status: 400 },
      );
    }

    let target: {
      id: string;
      confId: string;
      gender: "MALE" | "FEMALE" | null;
    } | null = null;

    if (targetId) {
      target = await prisma.confDelegate.findUnique({
        where: { id: targetId },
        select: { id: true, confId: true, gender: true },
      });

      if (!target || target.confId !== confId) {
        return NextResponse.json(
          { error: "Target delegate not found" },
          { status: 404 },
        );
      }
    }

    if (
      requestType === "STANDARD_PAIR" &&
      requester.gender &&
      target?.gender &&
      requester.gender !== target.gender
    ) {
      return NextResponse.json(
        {
          error:
            "Standard pairing requires same gender. Use LEGAL_PARTNER for exception requests.",
        },
        { status: 400 },
      );
    }

    const existingPending = await prisma.confPairRequest.findFirst({
      where: {
        confId,
        requesterId,
        targetId,
        requestType: requestType as
          | "STANDARD_PAIR"
          | "LEGAL_PARTNER"
          | "SINGLE_ROOM",
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "A similar pending request already exists" },
        { status: 409 },
      );
    }

    const requestRecord = await prisma.confPairRequest.create({
      data: {
        confId,
        requesterId,
        targetId,
        requestType: requestType as
          | "STANDARD_PAIR"
          | "LEGAL_PARTNER"
          | "SINGLE_ROOM",
        note,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            delegateCode: true,
            gender: true,
            city: true,
          },
        },
        target: {
          select: {
            id: true,
            name: true,
            delegateCode: true,
            gender: true,
            city: true,
          },
        },
      },
    });

    if (requestType === "SINGLE_ROOM") {
      await prisma.confDelegate.update({
        where: { id: requesterId },
        data: {
          wantsSingleRoom: true,
          roomPref: "SINGLE",
        },
      });
    }

    return NextResponse.json(requestRecord, { status: 201 });
  } catch (error) {
    console.error("Failed to create pair request:", error);
    return NextResponse.json(
      { error: "Failed to create pair request" },
      { status: 500 },
    );
  }
}
