import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";
import { mapPaymentForClient } from "@/lib/conf/payment-proof-urls";

// POST /api/conf/[confId]/payments/[paymentId]/final-approve
// Level-2 overall chair / super admin final approval → locks the record
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ confId: string; paymentId: string }> },
) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const payment = await prisma.confPayment.findUnique({
      where: { id: paymentId, confId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.isLocked) {
      return NextResponse.json(
        { error: "Payment is already locked" },
        { status: 409 },
      );
    }

    if (
      payment.status !== "PENDING" &&
      payment.status !== "COMMITTEE_APPROVED"
    ) {
      return NextResponse.json(
        {
          error: `Cannot final-approve a payment with status: ${payment.status}`,
        },
        { status: 409 },
      );
    }

    if (payment.status === "PENDING" && payment.committeeScope) {
      const submitter = payment.submittedByMemberId
        ? await prisma.confMember.findFirst({
            where: {
              id: payment.submittedByMemberId,
              confId,
              isActive: true,
            },
            select: { committeeScope: true, canApprovePayments: true },
          })
        : null;

      const isCommitteeChairSubmitter =
        Boolean(submitter?.canApprovePayments) &&
        submitter?.committeeScope === payment.committeeScope;

      if (!isCommitteeChairSubmitter) {
        return NextResponse.json(
          {
            error:
              "Committee approval is required before final approval for scoped payments.",
          },
          { status: 409 },
        );
      }
    }

    const now = new Date();
    const updated = await prisma.confPayment.update({
      where: { id: paymentId },
      data: {
        status: "APPROVED",
        approvedBy: auth.access.user?.id,
        approvedAt: now,
        isLocked: true,
      },
      include: { proofs: true },
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_FINAL_APPROVED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        amount: payment.amount,
        paymentType: payment.paymentType,
        committeeScope: payment.committeeScope,
        lockedAt: now.toISOString(),
      },
    });

    return NextResponse.json(mapPaymentForClient(confId, updated));
  } catch (error) {
    console.error("Failed to final-approve payment:", error);
    return NextResponse.json(
      { error: "Failed to final-approve payment" },
      { status: 500 },
    );
  }
}
