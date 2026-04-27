import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer, getNextDelegateCode } from "@/lib/conf/delegate-utils";
import { getConferenceAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { CONF_2026 } from "@/lib/conf/config";
import {
  buildDelegateViewerContext,
  canViewDelegateSensitiveData,
} from "@/lib/conf/delegate-privacy";

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

      return {
        ...delegateWithDocs,
        userId: canViewSensitive ? delegate.userId : null,
        passportNo: canViewSensitive ? delegate.passportNo : null,
        email: canViewSensitive ? delegate.email : null,
        phone: canViewSensitive ? delegate.phone : null,
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
      feeAmount,
      feePaid,
      passportNo,
      gender,
      roomPref,
      wantsSingleRoom,
      partnerClaimNote,
      conferencePosition,
    } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (
      !name ||
      !passportNo ||
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

    const existingPassport = await prisma.confDelegate.findFirst({
      where: { confId, passportNo },
      select: { id: true },
    });

    if (existingPassport) {
      return NextResponse.json(
        { error: "A delegate with this passport number already exists" },
        { status: 409 },
      );
    }

    const delegateCode = await getNextDelegateCode(confId, event.year);

    const access = await getConferenceAccess(confId);
    const linkedUserId =
      access.user && access.user.email.toLowerCase() === normalizedEmail
        ? access.user.id
        : null;

    const feePaidBool = Boolean(feePaid);
    const parsedFeeAmount =
      typeof feeAmount === "number" ? feeAmount : Number(feeAmount);
    const resolvedFeeAmount =
      Number.isFinite(parsedFeeAmount) && parsedFeeAmount > 0
        ? parsedFeeAmount
        : CONF_2026.delegateFee;
    const wantsSingleRoomBool = Boolean(wantsSingleRoom);
    const resolvedRoomPref = wantsSingleRoomBool
      ? "SINGLE"
      : roomPref || "PAIR";

    const delegate = await prisma.confDelegate.create({
      data: {
        confId,
        userId: linkedUserId,
        name,
        passportNo,
        delegateCode,
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
        additionalComments: additionalComments || null,
        feeAmount: resolvedFeeAmount,
        feePaid: feePaidBool,
        roomPref: resolvedRoomPref,
        wantsSingleRoom: wantsSingleRoomBool,
        partnerClaimNote: partnerClaimNote || null,
        conferencePosition: conferencePosition || null,
        status: feePaidBool ? "CONFIRMED" : "REGISTERED",
        flyerReady: canIssueFlyer({
          feePaid: feePaidBool,
          bookletPhotoPath: null,
        }),
      },
    });

    return NextResponse.json(delegate, { status: 201 });
  } catch (error) {
    console.error("Failed to register delegate:", error);
    return NextResponse.json(
      { error: "Failed to register delegate" },
      { status: 500 },
    );
  }
}
