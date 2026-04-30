import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import {
  getConferenceFeeAccommodationMode,
  getConferenceFeePackageById,
} from "@/lib/conf/fees";
import { formatPersonName } from "@/lib/conf/name-format";

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
      lastEntryStampPath: delegate.lastEntryStampPath
        ? resolveStoredAssetUrl(delegate.lastEntryStampPath, origin)
        : null,
      currentVisaPath: delegate.currentVisaPath
        ? resolveStoredAssetUrl(delegate.currentVisaPath, origin)
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
    // Participants can edit their own record; managers can edit any record.
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    if (!auth.access.isManager && auth.access.delegateId !== delegateId) {
      return NextResponse.json(
        { error: "You can only edit your own registration" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const current = (await prisma.confDelegate.findUnique({
      where: { id: delegateId },
    })) as unknown as {
      id: string;
      confId: string;
      status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
      roomPref: "PAIR" | "SINGLE";
      feeAmount: number | null;
      amountPaid: number | null;
      feePaid: boolean;
    } | null;

    if (!current || current.confId !== confId) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      updates.name = formatPersonName(body.name);
    }
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

    if (typeof body.feePackageId === "string") {
      const feePackageId = body.feePackageId.trim();
      const feePackage = feePackageId
        ? getConferenceFeePackageById(feePackageId)
        : null;
      updates.feePackageId = feePackage?.id ?? null;
      if (feePackage) {
        updates.feeAmount = feePackage.price;
        const accommodationMode = getConferenceFeeAccommodationMode(feePackage.id);
        if (accommodationMode === "SINGLE") {
          updates.roomPref = "SINGLE";
          updates.wantsSingleRoom = true;
        } else if (accommodationMode === "PAIR") {
          updates.roomPref = "PAIR";
          updates.wantsSingleRoom = false;
        } else if (accommodationMode === "NONE") {
          updates.roomPref = "SINGLE";
          updates.wantsSingleRoom = true;
        }
      }
    }

    if (typeof body.feeAmount !== "undefined") {
      // Manager-only: participants cannot change fee amounts
      if (auth.access.isManager) {
        updates.feeAmount = body.feeAmount ? Number(body.feeAmount) : null;
      }
    }

    if (typeof body.amountPaid !== "undefined") {
      const parsedAmountPaid = Number(body.amountPaid);
      if (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid < 0) {
        return NextResponse.json(
          { error: "amountPaid must be a valid non-negative number" },
          { status: 400 },
        );
      }
      updates.amountPaid = parsedAmountPaid;
    }

    if (typeof body.feePaid === "boolean") {
      // Manager-only: participants cannot self-mark as paid
      if (auth.access.isManager) {
        updates.feePaid = body.feePaid;
        if (body.feePaid && current.status === "REGISTERED") {
          updates.status = "CONFIRMED";
        }
      }
    }

    if (
      typeof body.status === "string" &&
      ["REGISTERED", "CONFIRMED", "ATTENDED", "CANCELLED"].includes(body.status)
    ) {
      // Manager-only: participants cannot change their own status
      if (auth.access.isManager) {
        updates.status = body.status;
      }
    }

    const effectiveFeeAmount =
      typeof updates.feeAmount === "number"
        ? updates.feeAmount
        : (current.feeAmount ?? 0);
    const effectiveAmountPaid =
      typeof updates.amountPaid === "number"
        ? updates.amountPaid
        : (current.amountPaid ?? 0);
    const effectiveFeePaid =
      typeof updates.feePaid === "boolean" ? updates.feePaid : current.feePaid;
    const isFullyPaid = effectiveAmountPaid >= effectiveFeeAmount;

    // Never allow partial payments to be marked as confirmed/approved.
    if (effectiveFeePaid && !isFullyPaid) {
      updates.feePaid = false;
      if (updates.status === undefined || updates.status === "CONFIRMED") {
        updates.status = "REGISTERED";
      }
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
      lastEntryStampPath: finalDelegate.lastEntryStampPath
        ? resolveStoredAssetUrl(finalDelegate.lastEntryStampPath, origin)
        : null,
      currentVisaPath: finalDelegate.currentVisaPath
        ? resolveStoredAssetUrl(finalDelegate.currentVisaPath, origin)
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

// DELETE /api/conf/[confId]/delegates/[delegateId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  try {
    const { confId, delegateId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
      select: { id: true, confId: true, name: true },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.confPairRequest.deleteMany({
        where: {
          confId,
          OR: [{ requesterId: delegateId }, { targetId: delegateId }],
        },
      }),
      prisma.confRoomAssignment.deleteMany({
        where: {
          confId,
          OR: [{ occupantAId: delegateId }, { occupantBId: delegateId }],
        },
      }),
      prisma.confDelegate.delete({
        where: { id: delegateId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      deletedDelegateId: delegateId,
      deletedDelegateName: existing.name,
    });
  } catch (error) {
    console.error("Failed to delete delegate:", error);
    return NextResponse.json(
      { error: "Failed to delete delegate" },
      { status: 500 },
    );
  }
}
