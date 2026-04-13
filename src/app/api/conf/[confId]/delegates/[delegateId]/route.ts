import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";

// GET /api/conf/[confId]/delegates/[delegateId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  try {
    const { confId, delegateId } = await params;
    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
    });

    if (!delegate || delegate.confId !== confId) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(delegate);
  } catch (error) {
    console.error("Failed to fetch delegate:", error);
    return NextResponse.json(
      { error: "Failed to fetch delegate" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/delegates/[delegateId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  try {
    const { confId, delegateId } = await params;
    const body = await req.json();

    const current = (await prisma.confDelegate.findUnique({
      where: { id: delegateId },
    })) as unknown as {
      id: string;
      confId: string;
      status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
      roomPref: "PAIR" | "SINGLE";
    } | null;

    if (!current || current.confId !== confId) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.email === "string") updates.email = body.email || null;
    if (typeof body.university === "string")
      updates.university = body.university || null;
    if (typeof body.city === "string") updates.city = body.city;
    if (typeof body.phone === "string") updates.phone = body.phone || null;
    if (typeof body.wechat === "string") updates.wechat = body.wechat || null;
    if (typeof body.passportNo === "string")
      updates.passportNo = body.passportNo || null;
    if (
      typeof body.gender === "string" &&
      ["MALE", "FEMALE"].includes(body.gender)
    ) {
      updates.gender = body.gender;
    }

    if (typeof body.feeAmount !== "undefined") {
      updates.feeAmount = body.feeAmount ? Number(body.feeAmount) : null;
    }

    if (typeof body.feePaid === "boolean") {
      updates.feePaid = body.feePaid;
      if (body.feePaid && current.status === "REGISTERED") {
        updates.status = "CONFIRMED";
      }
    }

    if (
      typeof body.status === "string" &&
      ["REGISTERED", "CONFIRMED", "ATTENDED", "CANCELLED"].includes(body.status)
    ) {
      updates.status = body.status;
    }

    if (
      typeof body.roomPref === "string" &&
      ["PAIR", "SINGLE"].includes(body.roomPref)
    ) {
      updates.roomPref = body.roomPref;
    }

    if (typeof body.wantsSingleRoom === "boolean") {
      updates.wantsSingleRoom = body.wantsSingleRoom;
      updates.roomPref = body.wantsSingleRoom
        ? "SINGLE"
        : body.roomPref || current.roomPref;
    }

    if (typeof body.partnerClaimNote === "string") {
      updates.partnerClaimNote = body.partnerClaimNote || null;
    }

    const updated = (await prisma.confDelegate.update({
      where: { id: delegateId },
      data: updates as never,
    })) as unknown as {
      id: string;
      feePaid: boolean;
      bookletPhotoPath: string | null;
      flyerIssuedAt: Date | null;
    };

    const flyerReady = canIssueFlyer({
      feePaid: updated.feePaid,
      bookletPhotoPath: updated.bookletPhotoPath,
    });

    const finalDelegate = await prisma.confDelegate.update({
      where: { id: delegateId },
      data: {
        flyerReady,
        flyerIssuedAt: flyerReady ? updated.flyerIssuedAt || new Date() : null,
      } as never,
    });

    return NextResponse.json(finalDelegate);
  } catch (error) {
    console.error("Failed to update delegate:", error);
    return NextResponse.json(
      { error: "Failed to update delegate" },
      { status: 500 },
    );
  }
}
