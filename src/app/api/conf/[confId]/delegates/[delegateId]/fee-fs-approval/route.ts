import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getConferenceAccess } from "@/lib/conf/access";
import { canManageConferenceDelegateFinanceFs } from "@/lib/conf/conference-finance-access";
import { mapDelegateDocumentsForClient } from "@/lib/conf/delegate-document-urls";
import { parseDelegateCommentsWithAddOns } from "@/lib/conf/delegate-fee-addons";

function serializeDelegateResponse(
  confId: string,
  delegateId: string,
  delegate: {
    additionalComments: string | null;
    passportPhotoPath: string | null;
    lastEntryStampPath: string | null;
    currentVisaPath: string | null;
    bookletPhotoPath: string | null;
    [key: string]: unknown;
  },
) {
  const parsed = parseDelegateCommentsWithAddOns(delegate.additionalComments);
  return {
    ...delegate,
    additionalComments: parsed.additionalComments,
    addOnPackageIds: parsed.addOnPackageIds,
    ...mapDelegateDocumentsForClient(confId, delegateId, {
      passportPhotoPath: delegate.passportPhotoPath,
      lastEntryStampPath: delegate.lastEntryStampPath,
      currentVisaPath: delegate.currentVisaPath,
      bookletPhotoPath: delegate.bookletPhotoPath,
    }),
  };
}

// POST /api/conf/[confId]/delegates/[delegateId]/fee-fs-approval
// Body: { "action": "approve" | "revoke" }
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
    if (!canManageConferenceDelegateFinanceFs(access)) {
      return NextResponse.json(
        { error: "Financial Secretary or Chair access required" },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const action = body.action === "revoke" ? "revoke" : "approve";

    const current = await prisma.confDelegate.findFirst({
      where: { id: delegateId, confId },
    });

    if (!current) {
      return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
    }

    const feeAmount = Number(current.feeAmount ?? 0);
    const amountPaid = Number(current.amountPaid ?? 0);
    const isFullyPaid = current.feePaid && amountPaid >= feeAmount;

    if (action === "approve") {
      if (current.feeFsApprovedAt) {
        return NextResponse.json(
          serializeDelegateResponse(confId, delegateId, current),
        );
      }

      if (!isFullyPaid) {
        return NextResponse.json(
          {
            error:
              "Delegate must be fully paid (feePaid and amount ≥ package due) before FS release to Treasurer.",
          },
          { status: 409 },
        );
      }

      const now = new Date();
      const updated = await prisma.confDelegate.update({
        where: { id: delegateId },
        data: {
          feeFsApprovedAt: now,
          feeFsApprovedBy: access.user.id,
          status: "CONFIRMED",
        },
      });

      return NextResponse.json(
        serializeDelegateResponse(confId, delegateId, updated),
      );
    }

    const updated = await prisma.confDelegate.update({
      where: { id: delegateId },
      data: {
        feeFsApprovedAt: null,
        feeFsApprovedBy: null,
        feeTreasurerAckAt: null,
        feeTreasurerAckBy: null,
      },
    });

    return NextResponse.json(
      serializeDelegateResponse(confId, delegateId, updated),
    );
  } catch (error) {
    console.error("fee-fs-approval failed:", error);
    return NextResponse.json(
      { error: "Failed to update FS approval" },
      { status: 500 },
    );
  }
}
