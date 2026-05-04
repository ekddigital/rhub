import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer, getNextDelegateCode } from "@/lib/conf/delegate-utils";
import { getConferenceAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import {
  formatConferenceOptionalAddOnsSummary,
  getConferenceFeeAccommodationMode,
  getConferenceFeePackageById,
  isConferenceOptionalAddOnPackage,
  normalizeConferenceOptionalAddOnPackageIds,
  sumConferenceOptionalAddOns,
} from "@/lib/conf/fees";
import {
  buildDelegateViewerContext,
  canViewDelegateSensitiveData,
} from "@/lib/conf/delegate-privacy";
import { sendEmail } from "@/lib/mail";
import { formatPersonName } from "@/lib/conf/name-format";
import {
  composeDelegateCommentsWithAddOns,
  parseDelegateCommentsWithAddOns,
} from "@/lib/conf/delegate-fee-addons";

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

function normalizePassportNumber(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeLoose(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// GET /api/conf/[confId]/delegates
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const access = await getConferenceAccess(confId);
    const viewer = buildDelegateViewerContext({
      isManager: access.isManager,
      delegateId: access.delegateId,
      user: access.user
        ? { id: access.user.id, email: access.user.email }
        : null,
    });

    const delegates = await prisma.confDelegate.findMany({
      where: { confId },
      orderBy: { createdAt: "desc" },
    });

    const origin = new URL(req.url).origin;
    const normalized = delegates.map((delegate) => {
      const delegateWithDocs = delegate as typeof delegate & {
        lastEntryStampPath?: string | null;
        currentVisaPath?: string | null;
      };
      const canViewSensitive = canViewDelegateSensitiveData(
        delegateWithDocs,
        viewer,
      );

      const parsedComments = parseDelegateCommentsWithAddOns(
        delegateWithDocs.additionalComments,
      );
      return {
        ...delegateWithDocs,
        userId: canViewSensitive ? delegate.userId : null,
        passportNo: canViewSensitive ? delegate.passportNo : null,
        email: canViewSensitive ? delegate.email : null,
        phone: canViewSensitive ? delegate.phone : null,
        additionalComments: parsedComments.additionalComments,
        addOnPackageIds: parsedComments.addOnPackageIds,
        passportPhotoPath:
          canViewSensitive && delegateWithDocs.passportPhotoPath
            ? resolveStoredAssetUrl(delegateWithDocs.passportPhotoPath, origin)
            : null,
        lastEntryStampPath:
          canViewSensitive && delegateWithDocs.lastEntryStampPath
            ? resolveStoredAssetUrl(delegateWithDocs.lastEntryStampPath, origin)
            : null,
        currentVisaPath:
          canViewSensitive && delegateWithDocs.currentVisaPath
            ? resolveStoredAssetUrl(delegateWithDocs.currentVisaPath, origin)
            : null,
        bookletPhotoPath:
          canViewSensitive && delegateWithDocs.bookletPhotoPath
            ? resolveStoredAssetUrl(delegateWithDocs.bookletPhotoPath, origin)
            : null,
      };
    });

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch delegates:", error);
    return NextResponse.json(
      { error: "Failed to fetch delegates" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/delegates
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const body = await req.json();
    const {
      name,
      email,
      university,
      province,
      city,
      phone,
      wechat,
      attendanceIntent,
      travelAssistanceNeeded,
      schoolCommunicationNeeded,
      schoolCommunicationDetails,
      studyYear,
      bringingForeignGuest,
      guestNationality,
      accommodationNeeded,
      dietaryNeeds,
      dietaryDetails,
      additionalComments,
      feePackageId,
      addOnPackageIds,
      amountPaid,
      feePaid,
      passportNo,
      gender,
      roomPref,
      wantsSingleRoom,
      partnerClaimNote,
      conferencePosition,
    } = body;

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedName = formatPersonName(String(name || ""));
    const normalizedPassportNo = normalizePassportNumber(passportNo);

    if (
      !normalizedName ||
      !normalizedPassportNo ||
      !university ||
      !province ||
      !city ||
      !phone ||
      !wechat ||
      !normalizedEmail ||
      !gender
    ) {
      return NextResponse.json(
        {
          error:
            "name, passportNo, university, province, city, phone, wechat, email, and gender are required",
        },
        { status: 400 },
      );
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json(
        { error: "gender must be MALE or FEMALE" },
        { status: 400 },
      );
    }

    if (!isResponseChoice(attendanceIntent)) {
      return NextResponse.json(
        { error: "attendanceIntent must be YES, NO, or OTHER" },
        { status: 400 },
      );
    }

    if (!isResponseChoice(travelAssistanceNeeded)) {
      return NextResponse.json(
        { error: "travelAssistanceNeeded must be YES, NO, or OTHER" },
        { status: 400 },
      );
    }

    if (!isResponseChoice(schoolCommunicationNeeded)) {
      return NextResponse.json(
        { error: "schoolCommunicationNeeded must be YES, NO, or OTHER" },
        { status: 400 },
      );
    }

    if (!isStudyYear(studyYear)) {
      return NextResponse.json(
        { error: "studyYear is invalid" },
        { status: 400 },
      );
    }

    if (!isResponseChoice(bringingForeignGuest)) {
      return NextResponse.json(
        { error: "bringingForeignGuest must be YES, NO, or OTHER" },
        { status: 400 },
      );
    }

    if (!isResponseChoice(accommodationNeeded)) {
      return NextResponse.json(
        { error: "accommodationNeeded must be YES, NO, or OTHER" },
        { status: 400 },
      );
    }

    if (!isResponseChoice(dietaryNeeds)) {
      return NextResponse.json(
        { error: "dietaryNeeds must be YES, NO, or OTHER" },
        { status: 400 },
      );
    }

    if (
      bringingForeignGuest === "YES" &&
      !String(guestNationality || "").trim()
    ) {
      return NextResponse.json(
        {
          error:
            "guestNationality is required when bringingForeignGuest is YES",
        },
        { status: 400 },
      );
    }

    if (
      schoolCommunicationNeeded === "YES" &&
      !String(schoolCommunicationDetails || "").trim()
    ) {
      return NextResponse.json(
        {
          error:
            "schoolCommunicationDetails is required when schoolCommunicationNeeded is YES",
        },
        { status: 400 },
      );
    }

    if (dietaryNeeds === "YES" && !String(dietaryDetails || "").trim()) {
      return NextResponse.json(
        { error: "dietaryDetails is required when dietaryNeeds is YES" },
        { status: 400 },
      );
    }

    const event = await prisma.confEvent.findUnique({
      where: { id: confId },
      select: { id: true, year: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    const access = await getConferenceAccess(confId);
    const linkedUserId =
      access.user && access.user.email.toLowerCase() === normalizedEmail
        ? access.user.id
        : null;

    const resolvedFeePackage =
      typeof feePackageId === "string" && feePackageId.trim()
        ? getConferenceFeePackageById(feePackageId.trim())
        : null;
    if (!resolvedFeePackage) {
      return NextResponse.json(
        { error: "A required conference package must be selected" },
        { status: 400 },
      );
    }
    if (isConferenceOptionalAddOnPackage(resolvedFeePackage.id)) {
      return NextResponse.json(
        {
          error:
            "The selected package is an optional add-on. Please select a required conference package.",
        },
        { status: 400 },
      );
    }
    const normalizedAddOnPackageIds =
      normalizeConferenceOptionalAddOnPackageIds(addOnPackageIds);
    const addOnsTotal = sumConferenceOptionalAddOns(normalizedAddOnPackageIds);
    const resolvedFeeAmount = resolvedFeePackage.price + addOnsTotal;
    const parsedAmountPaid =
      typeof amountPaid === "number" ? amountPaid : Number(amountPaid);
    const resolvedAmountPaid =
      Number.isFinite(parsedAmountPaid) && parsedAmountPaid >= 0
        ? parsedAmountPaid
        : 0;
    if (resolvedAmountPaid > resolvedFeeAmount) {
      return NextResponse.json(
        { error: "amountPaid cannot exceed the selected package fee" },
        { status: 400 },
      );
    }
    const feePaidBool =
      Boolean(feePaid) && resolvedAmountPaid >= resolvedFeeAmount;
    const accommodationMode = getConferenceFeeAccommodationMode(
      resolvedFeePackage.id,
    );
    const requestedRoomPref = roomPref === "SINGLE" ? "SINGLE" : "PAIR";
    const resolvedRoomPref =
      accommodationMode === "SINGLE"
        ? "SINGLE"
        : accommodationMode === "PAIR"
          ? "PAIR"
          : accommodationMode === "NONE"
            ? "SINGLE"
            : requestedRoomPref;
    const wantsSingleRoomBool =
      accommodationMode === "SINGLE" || accommodationMode === "NONE"
        ? true
        : Boolean(wantsSingleRoom) || resolvedRoomPref === "SINGLE";

    const existingPassport = await prisma.confDelegate.findFirst({
      where: { confId, passportNo: normalizedPassportNo },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        wechat: true,
        userId: true,
        bookletPhotoPath: true,
      },
    });

    const baseDelegateData = {
      userId: linkedUserId,
      name: normalizedName,
      passportNo: normalizedPassportNo,
      gender,
      email: normalizedEmail || null,
      university: university || null,
      province,
      city,
      phone: phone || null,
      wechat: wechat || null,
      attendanceIntent,
      travelAssistanceNeeded,
      schoolCommunicationNeeded,
      schoolCommunicationDetails: schoolCommunicationDetails || null,
      studyYear,
      bringingForeignGuest,
      guestNationality: guestNationality || null,
      accommodationNeeded,
      dietaryNeeds,
      dietaryDetails: dietaryDetails || null,
      additionalComments: composeDelegateCommentsWithAddOns(
        additionalComments,
        normalizedAddOnPackageIds,
      ),
      feePackageId: resolvedFeePackage.id,
      feeAmount: resolvedFeeAmount,
      amountPaid: resolvedAmountPaid,
      feePaid: feePaidBool,
      roomPref: resolvedRoomPref,
      wantsSingleRoom: wantsSingleRoomBool,
      partnerClaimNote: partnerClaimNote || null,
      conferencePosition: conferencePosition || null,
      status: feePaidBool ? "CONFIRMED" : "REGISTERED",
    } as const;

    if (existingPassport) {
      const sameAccount =
        Boolean(linkedUserId) && existingPassport.userId === linkedUserId;
      const sameEmail =
        normalizeLoose(existingPassport.email) === normalizedEmail &&
        normalizedEmail.length > 0;
      const sameNameAndContact =
        normalizeLoose(existingPassport.name) === normalizeLoose(normalizedName) &&
        (normalizeLoose(existingPassport.phone) === normalizeLoose(phone) ||
          normalizeLoose(existingPassport.wechat) === normalizeLoose(wechat));
      const canUpdateExisting = sameAccount || sameEmail || sameNameAndContact;

      if (!canUpdateExisting) {
        return NextResponse.json(
          {
            error:
              "A delegate with this passport number already exists under another profile. Please contact conference admin to resolve this passport record.",
          },
          { status: 409 },
        );
      }

      const updated = await prisma.confDelegate.update({
        where: { id: existingPassport.id },
        data: {
          ...baseDelegateData,
          userId: existingPassport.userId || linkedUserId,
          flyerReady: canIssueFlyer({
            feePaid: feePaidBool,
            bookletPhotoPath: existingPassport.bookletPhotoPath,
          }),
        },
      });

      return NextResponse.json(
        {
          ...updated,
          ...parseDelegateCommentsWithAddOns(updated.additionalComments),
          updatedExisting: true,
        },
        { status: 200 },
      );
    }

    const delegateCode = await getNextDelegateCode(confId, event.year);

    const delegate = await prisma.confDelegate.create({
      data: {
        confId,
        delegateCode,
        ...baseDelegateData,
        flyerReady: canIssueFlyer({
          feePaid: feePaidBool,
          bookletPhotoPath: null,
        }),
      },
    });

    const approvers = await prisma.confMember.findMany({
      where: {
        confId,
        isActive: true,
        canApprovePayments: true,
        email: { not: null },
      },
      select: { email: true, name: true },
    });

    const packageLabel = resolvedFeePackage
      ? `${resolvedFeePackage.category} - ${resolvedFeePackage.label}`
      : feePackageId
        ? String(feePackageId)
        : "Conference fee";
    const addOnsLabel =
      formatConferenceOptionalAddOnsSummary(normalizedAddOnPackageIds);
    const balanceDue = Math.max(resolvedFeeAmount - resolvedAmountPaid, 0);
    const notifyHtml = `
      <h2 style="margin:0 0 12px;color:#1f1c18">New conference signup</h2>
      <p style="margin:0 0 12px;color:#7a6e5a;line-height:1.6">
        A new delegate has registered and needs payment review.
      </p>
      <div style="margin:16px 0;padding:16px;background:#fdf9f2;border-radius:8px;border-left:4px solid #c8a061">
        <p style="margin:0 0 6px;color:#1f1c18;font-weight:600">${normalizedName}</p>
        <p style="margin:0;color:#7a6e5a">Passport: ${normalizedPassportNo}</p>
        <p style="margin:0;color:#7a6e5a">Package: ${packageLabel}</p>
        <p style="margin:0;color:#7a6e5a">Optional add-ons: ${addOnsLabel}</p>
        <p style="margin:0;color:#7a6e5a">Selected fee: RMB ${resolvedFeeAmount.toFixed(2)}</p>
        <p style="margin:0;color:#7a6e5a">Amount already paid: RMB ${resolvedAmountPaid.toFixed(2)}</p>
        <p style="margin:0;color:#7a6e5a">Remaining balance: RMB ${balanceDue.toFixed(2)}</p>
      </div>
      <p style="margin:0;color:#7a6e5a;line-height:1.6">
        Please review the signup and confirm payment status in RHUB.
      </p>
    `;

    await Promise.allSettled(
      approvers.map((approver) =>
        sendEmail({
          to: approver.email as string,
          subject: `New conference signup: ${normalizedName}`,
          html: notifyHtml,
        }),
      ),
    );

    return NextResponse.json(
      {
        ...delegate,
        ...parseDelegateCommentsWithAddOns(delegate.additionalComments),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to register delegate:", error);
    return NextResponse.json(
      { error: "Failed to register delegate" },
      { status: 500 },
    );
  }
}
