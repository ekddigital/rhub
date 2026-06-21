import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getConferenceAccess } from "@/lib/conf/access";
import { canAccessConferenceTreasurerFinance } from "@/lib/conf/conference-finance-access";
import { mapDelegateDocumentsForClient } from "@/lib/conf/delegate-document-urls";
import { parseDelegateCommentsWithAddOns } from "@/lib/conf/delegate-fee-addons";

// POST /api/conf/[confId]/delegates/[delegateId]/fee-treasurer-ack
// Body: { "action": "ack" | "unack" }
export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  try {
    const { confId, delegateId } = await params;
    const access = await getConferenceAccess(confId);
    if (!access.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!canAccessConferenceTreasurerFinance(access)) {
      return NextResponse.json({ error: "Treasurer access required" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const action = body.action === "unack" ? "unack" : "ack";

    const current = await prisma.confDelegate.findFirst({
      where: { id: delegateId, confId },
    });

    if (!current) {
      return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
    }

    if (!current.feeFsApprovedAt) {
      return NextResponse.json(
        { error: "Financial Secretary must release this delegate before Treasurer actions." },
        { status: 409 },
      );
    }

    const now = new Date();
    const updated = await prisma.confDelegate.update({
      where: { id: delegateId },
      data:
        action === "ack"
          ? {
              feeTreasurerAckAt: now,
              feeTreasurerAckBy: access.user.id,
            }
          : {
              feeTreasurerAckAt: null,
              feeTreasurerAckBy: null,
            },
    });

    const parsed = parseDelegateCommentsWithAddOns(updated.additionalComments);
    return NextResponse.json({
      ...updated,
      additionalComments: parsed.additionalComments,
      addOnPackageIds: parsed.addOnPackageIds,
      ...mapDelegateDocumentsForClient(confId, delegateId, {
        passportPhotoPath: updated.passportPhotoPath,
        lastEntryStampPath: updated.lastEntryStampPath,
        currentVisaPath: updated.currentVisaPath,
        bookletPhotoPath: updated.bookletPhotoPath,
      }),
    });
  } catch (error) {
    console.error("fee-treasurer-ack failed:", error);
    return NextResponse.json(
      { error: "Failed to update treasurer acknowledgement" },
      { status: 500 },
    );
  }
}
