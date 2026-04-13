import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer, getNextDelegateCode } from "@/lib/conf/delegate-utils";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

// GET /api/conf/[confId]/delegates
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const delegates = await prisma.confDelegate.findMany({
      where: { confId },
      orderBy: { createdAt: "desc" },
    });

    const origin = new URL(req.url).origin;
    const normalized = delegates.map((delegate) => ({
      ...delegate,
      passportPhotoPath: delegate.passportPhotoPath
        ? resolveStoredAssetUrl(delegate.passportPhotoPath, origin)
        : null,
      bookletPhotoPath: delegate.bookletPhotoPath
        ? resolveStoredAssetUrl(delegate.bookletPhotoPath, origin)
        : null,
    }));

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
      city,
      phone,
      wechat,
      feeAmount,
      feePaid,
      passportNo,
      gender,
      roomPref,
      wantsSingleRoom,
      partnerClaimNote,
    } = body;

    if (
      !name ||
      !passportNo ||
      !university ||
      !city ||
      !phone ||
      !wechat ||
      !email ||
      !gender
    ) {
      return NextResponse.json(
        {
          error:
            "name, passportNo, university, city, phone, wechat, email, and gender are required",
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

    const feePaidBool = Boolean(feePaid);
    const wantsSingleRoomBool = Boolean(wantsSingleRoom);
    const resolvedRoomPref = wantsSingleRoomBool
      ? "SINGLE"
      : roomPref || "PAIR";

    const delegate = await prisma.confDelegate.create({
      data: {
        confId,
        name,
        passportNo,
        delegateCode,
        gender,
        email: email || null,
        university: university || null,
        city,
        phone: phone || null,
        wechat: wechat || null,
        feeAmount: feeAmount ? Number(feeAmount) : null,
        feePaid: feePaidBool,
        roomPref: resolvedRoomPref,
        wantsSingleRoom: wantsSingleRoomBool,
        partnerClaimNote: partnerClaimNote || null,
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
