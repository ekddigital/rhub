import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  isConfLsuicLeaderLinkTableMissing,
  lsuicLeaderLinkTableMissingResponse,
} from "@/lib/conf/lsuic-leader-links";

// PATCH /api/conf/[confId]/lsuic-leaders/[rosterKey]/link
export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ confId: string; rosterKey: string }> },
) {
  try {
    const { confId, rosterKey: rawKey } = await params;
    const rosterKey = decodeURIComponent(rawKey);
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      delegateId?: string | null;
      userId?: string | null;
      confirmed?: boolean;
      includeAddressPage?: boolean;
      addressText?: string | null;
    };

    const hasAddressPatch =
      body.includeAddressPage !== undefined || body.addressText !== undefined;
    const isUnlink = body.delegateId === null && body.userId === null;
    const isConfirmOnly =
      body.confirmed === true &&
      body.delegateId === undefined &&
      body.userId === undefined &&
      !hasAddressPatch;

    if (isUnlink && !hasAddressPatch) {
      await prisma.confLsuicLeaderLink.deleteMany({
        where: { confId, rosterKey },
      });
      return NextResponse.json({ cleared: true });
    }

    if (isConfirmOnly) {
      const existing = await prisma.confLsuicLeaderLink.findUnique({
        where: { confId_rosterKey: { confId, rosterKey } },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "No link exists for this roster row" },
          { status: 404 },
        );
      }
      const link = await prisma.confLsuicLeaderLink.update({
        where: { confId_rosterKey: { confId, rosterKey } },
        data: { confirmed: true },
      });
      return NextResponse.json({ link });
    }

    // Address-only update (include in booklet / message text) without remapping.
    if (
      hasAddressPatch &&
      body.delegateId === undefined &&
      body.userId === undefined &&
      body.confirmed === undefined
    ) {
      const addressData = {
        ...(body.includeAddressPage !== undefined && {
          includeAddressPage: Boolean(body.includeAddressPage),
        }),
        ...(body.addressText !== undefined && {
          addressText:
            typeof body.addressText === "string"
              ? body.addressText.trim() || null
              : null,
        }),
      };

      const link = await prisma.confLsuicLeaderLink.upsert({
        where: { confId_rosterKey: { confId, rosterKey } },
        create: {
          confId,
          rosterKey,
          delegateId: null,
          userId: null,
          linkSource: "ADDRESS_ONLY",
          confirmed: false,
          includeAddressPage: Boolean(body.includeAddressPage),
          addressText:
            typeof body.addressText === "string"
              ? body.addressText.trim() || null
              : null,
        },
        update: addressData,
      });
      return NextResponse.json({ link });
    }

    let delegateId = body.delegateId ?? null;
    let userId = body.userId ?? null;

    if (delegateId) {
      const delegate = await prisma.confDelegate.findFirst({
        where: { id: delegateId, confId },
        select: { id: true, userId: true },
      });
      if (!delegate) {
        return NextResponse.json(
          { error: "Delegate not found for this conference" },
          { status: 404 },
        );
      }
      userId = delegate.userId ?? userId;
    }

    const confirmed =
      body.confirmed ?? (delegateId || userId ? true : false);

    const link = await prisma.confLsuicLeaderLink.upsert({
      where: {
        confId_rosterKey: { confId, rosterKey },
      },
      create: {
        confId,
        rosterKey,
        delegateId,
        userId,
        linkSource: "MANUAL",
        confirmed,
        includeAddressPage: Boolean(body.includeAddressPage),
        addressText:
          typeof body.addressText === "string"
            ? body.addressText.trim() || null
            : null,
      },
      update: {
        delegateId,
        userId,
        linkSource: "MANUAL",
        confirmed,
        ...(body.includeAddressPage !== undefined && {
          includeAddressPage: Boolean(body.includeAddressPage),
        }),
        ...(body.addressText !== undefined && {
          addressText:
            typeof body.addressText === "string"
              ? body.addressText.trim() || null
              : null,
        }),
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    if (isConfLsuicLeaderLinkTableMissing(error)) {
      return NextResponse.json(lsuicLeaderLinkTableMissingResponse(), {
        status: 503,
      });
    }
    console.error("PATCH /lsuic-leaders link error:", error);
    return NextResponse.json(
      { error: "Failed to update LSUIC leader link" },
      { status: 500 },
    );
  }
}
