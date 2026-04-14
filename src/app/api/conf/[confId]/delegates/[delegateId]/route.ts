import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

const RESPONSE_CHOICES = ["YES", "NO", "OTHER"] as const;
const STUDY_YEARS = [
  "BACHELOR_1",
  "BACHELOR_2",
  "BACHELOR_3",
  "BACHELOR_4",
  "GRADUATE_1",
  "GRADUATE_2",
  "GRADUATE_3",
  "GRADUATE_4",
  "OTHER",
] as const;

function isResponseChoice(
  value: unknown,
): value is (typeof RESPONSE_CHOICES)[number] {
  return typeof value === "string" && RESPONSE_CHOICES.includes(value as never);
}

function isStudyYear(value: unknown): value is (typeof STUDY_YEARS)[number] {
  return typeof value === "string" && STUDY_YEARS.includes(value as never);
}

// GET /api/conf/[confId]/delegates/[delegateId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  try {
    const { confId, delegateId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    if (!auth.access.isManager && auth.access.delegateId !== delegateId) {
      return NextResponse.json(
        { error: "You can only view your own delegate profile" },
        { status: 403 },
      );
    }

    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
    });

    if (!delegate || delegate.confId !== confId) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 },
      );
    }

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      ...delegate,
      passportPhotoPath: delegate.passportPhotoPath
        ? resolveStoredAssetUrl(delegate.passportPhotoPath, origin)
        : null,
      bookletPhotoPath: delegate.bookletPhotoPath
        ? resolveStoredAssetUrl(delegate.bookletPhotoPath, origin)
        : null,
    });
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
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

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
    if (typeof body.province === "string")
      updates.province = body.province || null;
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

    if (typeof body.attendanceIntent !== "undefined") {
      if (!isResponseChoice(body.attendanceIntent)) {
        return NextResponse.json(
          { error: "attendanceIntent must be YES, NO, or OTHER" },
          { status: 400 },
        );
      }
      updates.attendanceIntent = body.attendanceIntent;
    }

    if (typeof body.travelAssistanceNeeded !== "undefined") {
      if (!isResponseChoice(body.travelAssistanceNeeded)) {
        return NextResponse.json(
          { error: "travelAssistanceNeeded must be YES, NO, or OTHER" },
          { status: 400 },
        );
      }
      updates.travelAssistanceNeeded = body.travelAssistanceNeeded;
    }

    if (typeof body.schoolCommunicationNeeded !== "undefined") {
      if (!isResponseChoice(body.schoolCommunicationNeeded)) {
        return NextResponse.json(
          { error: "schoolCommunicationNeeded must be YES, NO, or OTHER" },
          { status: 400 },
        );
      }
      updates.schoolCommunicationNeeded = body.schoolCommunicationNeeded;
    }

    if (typeof body.schoolCommunicationDetails === "string") {
      updates.schoolCommunicationDetails =
        body.schoolCommunicationDetails || null;
    }

    if (typeof body.studyYear !== "undefined") {
      if (!isStudyYear(body.studyYear)) {
        return NextResponse.json(
          { error: "studyYear is invalid" },
          { status: 400 },
        );
      }
      updates.studyYear = body.studyYear;
    }

    if (typeof body.bringingForeignGuest !== "undefined") {
      if (!isResponseChoice(body.bringingForeignGuest)) {
        return NextResponse.json(
          { error: "bringingForeignGuest must be YES, NO, or OTHER" },
          { status: 400 },
        );
      }
      updates.bringingForeignGuest = body.bringingForeignGuest;
    }

    if (typeof body.guestNationality === "string") {
      updates.guestNationality = body.guestNationality || null;
    }

    if (typeof body.accommodationNeeded !== "undefined") {
      if (!isResponseChoice(body.accommodationNeeded)) {
        return NextResponse.json(
          { error: "accommodationNeeded must be YES, NO, or OTHER" },
          { status: 400 },
        );
      }
      updates.accommodationNeeded = body.accommodationNeeded;
    }

    if (typeof body.dietaryNeeds !== "undefined") {
      if (!isResponseChoice(body.dietaryNeeds)) {
        return NextResponse.json(
          { error: "dietaryNeeds must be YES, NO, or OTHER" },
          { status: 400 },
        );
      }
      updates.dietaryNeeds = body.dietaryNeeds;
    }

    if (typeof body.dietaryDetails === "string") {
      updates.dietaryDetails = body.dietaryDetails || null;
    }

    if (typeof body.additionalComments === "string") {
      updates.additionalComments = body.additionalComments || null;
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

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      ...finalDelegate,
      passportPhotoPath: finalDelegate.passportPhotoPath
        ? resolveStoredAssetUrl(finalDelegate.passportPhotoPath, origin)
        : null,
      bookletPhotoPath: finalDelegate.bookletPhotoPath
        ? resolveStoredAssetUrl(finalDelegate.bookletPhotoPath, origin)
        : null,
    });
  } catch (error) {
    console.error("Failed to update delegate:", error);
    return NextResponse.json(
      { error: "Failed to update delegate" },
      { status: 500 },
    );
  }
}
