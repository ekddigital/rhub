import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { denyIfHotelCheckinWrite, requireConferenceApiAccess } from "@/lib/conf/access";
import {
  DELEGATE_PAIRING_SELECT,
  fetchDelegateForPairing,
  isDelegateAccommodationPairEligible,
} from "@/lib/conf/room-assignments-server";
import {
  isDelegateEligibleForRoomPairing,
  isDelegatePaymentConfirmedForPairing,
} from "@/lib/conf/room-pairing-eligibility";

// GET /api/conf/[confId]/pair-requests
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

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
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;
    const writeDenied = denyIfHotelCheckinWrite(auth.access);
    if (writeDenied) return writeDenied;

    const body = await req.json();

    let requesterId = body.requesterId ? String(body.requesterId) : "";

    if (!requesterId || !auth.access.isManager) {
      const selfDelegate = auth.access.user
        ? await prisma.confDelegate.findFirst({
            where: { confId, userId: auth.access.user.id },
            select: { id: true },
          })
        : null;
      if (!selfDelegate) {
        return NextResponse.json(
          {
            error:
              "You are not registered as a delegate for this conference. Please complete your registration first.",
          },
          { status: 403 },
        );
      }
      requesterId = selfDelegate.id;
    }

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

    const requester = await fetchDelegateForPairing(requesterId);
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

    let target = null;
    if (targetId) {
      target = await fetchDelegateForPairing(targetId);
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

    if (!auth.access.isManager && !isDelegatePaymentConfirmedForPairing(requester)) {
      return NextResponse.json(
        {
          error:
            "Payment must be confirmed before submitting a room pairing request.",
        },
        { status: 400 },
      );
    }

    if (requestType !== "SINGLE_ROOM") {
      if (!isDelegateEligibleForRoomPairing(requester)) {
        return NextResponse.json(
          {
            error:
              "Requester is not eligible for pairing (payment, accommodation, or guest-package rules).",
          },
          { status: 400 },
        );
      }
      if (target && !isDelegateEligibleForRoomPairing(target)) {
        return NextResponse.json(
          {
            error:
              "Target delegate is not eligible for pairing (payment, accommodation, or guest-package rules).",
          },
          { status: 400 },
        );
      }
    } else if (!isDelegateAccommodationPairEligible(requester)) {
      return NextResponse.json(
        {
          error:
            "Requester already has single-room/no-accommodation preference and does not need a single-room request.",
        },
        { status: 400 },
      );
    } else if (
      !auth.access.isManager &&
      !isDelegatePaymentConfirmedForPairing(requester)
    ) {
      return NextResponse.json(
        {
          error:
            "Payment must be confirmed before submitting a single-room request.",
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
