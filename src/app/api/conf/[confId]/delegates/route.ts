import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  canIssueFlyer,
  getNextDelegateCode,
  normalizeDelegateEmail,
  normalizeDelegatePassport,
} from "@/lib/conf/delegate-utils";
import { getConferenceAccess } from "@/lib/conf/access";
import {
  formatConferenceOptionalAddOnsSummary,
  getConferenceFeeAccommodationMode,
  getConferenceFeePackageById,
  isConferenceOptionalAddOnPackage,
  normalizeConferenceOptionalAddOnPackageIds,
  sumConferenceOptionalAddOns,
} from "@/lib/conf/fees";
import {
  buildDelegateListViewerContext,
  mapDelegatesForApiResponse,
} from "@/lib/conf/map-delegates-for-api-response";
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
    const viewer = buildDelegateListViewerContext({
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
    const normalized = await mapDelegatesForApiResponse(delegates, viewer, origin);

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

    const normalizedEmail = normalizeDelegateEmail(email);
    const normalizedName = formatPersonName(String(name || ""));
    const normalizedPassportNo = normalizeDelegatePassport(passportNo);

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

    function isDelegateCodeCollision(err: unknown): boolean {
      if (
        !(err instanceof Prisma.PrismaClientKnownRequestError) ||
        err.code !== "P2002"
      ) {
        return false;
      }
      const target = err.meta?.target;
      if (Array.isArray(target)) {
        return target.includes("delegateCode");
      }
      return target === "delegateCode";
    }

    const txResult = await prisma.$transaction(
      async (tx) => {
        const existingPassport = await tx.confDelegate.findFirst({
          where: { confId, passportNo: normalizedPassportNo },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            wechat: true,
            userId: true,
            bookletPhotoPath: true,
            passportNo: true,
          },
        });

        const existingEmail = await tx.confDelegate.findFirst({
          where: { confId, email: normalizedEmail },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            wechat: true,
            userId: true,
            bookletPhotoPath: true,
            passportNo: true,
          },
        });

        if (
          existingPassport &&
          existingEmail &&
          existingPassport.id !== existingEmail.id
        ) {
          return {
            ok: false as const,
            status: 409,
            body: {
              error:
                "This email and passport number match different existing registrations for this conference. Contact the conference team so one duplicate profile can be removed.",
            },
          };
        }

        if (existingPassport) {
          const sameAccount =
            Boolean(linkedUserId) && existingPassport.userId === linkedUserId;
          const sameEmail =
            normalizeLoose(existingPassport.email) === normalizedEmail &&
            normalizedEmail.length > 0;
          const sameNameAndContact =
            normalizeLoose(existingPassport.name) ===
              normalizeLoose(normalizedName) &&
            (normalizeLoose(existingPassport.phone) ===
              normalizeLoose(phone) ||
              normalizeLoose(existingPassport.wechat) ===
                normalizeLoose(wechat));
          const canUpdateExisting =
            sameAccount || sameEmail || sameNameAndContact;

          if (!canUpdateExisting) {
            return {
              ok: false as const,
              status: 409,
              body: {
                error:
                  "A delegate with this passport number already exists under another profile. Contact the conference team if this should be one person.",
              },
            };
          }

          const updated = await tx.confDelegate.update({
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

          return { ok: true as const, kind: "update" as const, delegate: updated };
        }

        if (existingEmail) {
          const existingPassportNo = normalizeDelegatePassport(
            existingEmail.passportNo,
          );
          if (
            existingPassportNo &&
            existingPassportNo !== normalizedPassportNo
          ) {
            return {
              ok: false as const,
              status: 409,
              body: {
                error:
                  "This email is already registered for this conference with a different passport number. Sign in with the account that registered, or contact the conference team if you need help.",
              },
            };
          }

          const sameAccount =
            Boolean(linkedUserId) && existingEmail.userId === linkedUserId;
          const sameNameAndContact =
            normalizeLoose(existingEmail.name) ===
              normalizeLoose(normalizedName) &&
            (normalizeLoose(existingEmail.phone) ===
              normalizeLoose(phone) ||
              normalizeLoose(existingEmail.wechat) ===
                normalizeLoose(wechat));
          const canUpdateExisting = sameAccount || sameNameAndContact;

          if (!canUpdateExisting) {
            return {
              ok: false as const,
              status: 409,
              body: {
                error:
                  "This email is already registered for this conference under another profile. Sign in with that account or use a different email.",
              },
            };
          }

          const updated = await tx.confDelegate.update({
            where: { id: existingEmail.id },
            data: {
              ...baseDelegateData,
              userId: existingEmail.userId || linkedUserId,
              flyerReady: canIssueFlyer({
                feePaid: feePaidBool,
                bookletPhotoPath: existingEmail.bookletPhotoPath,
              }),
            },
          });

          return { ok: true as const, kind: "update" as const, delegate: updated };
        }

        let delegate: Awaited<ReturnType<typeof prisma.confDelegate.create>> | null =
          null;
        for (let attempt = 0; attempt < 6; attempt++) {
          const delegateCode = await getNextDelegateCode(
            confId,
            event.year,
            tx,
          );
          try {
            delegate = await tx.confDelegate.create({
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
            break;
          } catch (err) {
            if (isDelegateCodeCollision(err)) {
              continue;
            }
            throw err;
          }
        }

        if (!delegate) {
          throw new Error("Could not assign a delegate conference ID");
        }

        return { ok: true as const, kind: "create" as const, delegate };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 5_000,
        timeout: 20_000,
      },
    );

    if (!txResult.ok) {
      return NextResponse.json(txResult.body, { status: txResult.status });
    }

    const { delegate, kind } = txResult;

    if (kind === "update") {
      return NextResponse.json(
        {
          ...delegate,
          ...parseDelegateCommentsWithAddOns(delegate.additionalComments),
          updatedExisting: true,
        },
        { status: 200 },
      );
    }

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "This email or passport is already registered for this conference. Sign in to continue your registration, or contact the conference team if you need help.",
          code: "DUPLICATE_DELEGATE",
        },
        { status: 409 },
      );
    }
    console.error("Failed to register delegate:", error);
    return NextResponse.json(
      { error: "Failed to register delegate" },
      { status: 500 },
    );
  }
}
