import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

type Params = {
  params: Promise<{ confId: string; paymentId: string; proofId: string }>;
};

// DELETE /api/conf/[confId]/payments/[paymentId]/proofs/[proofId]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { confId, paymentId, proofId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const proof = await prisma.confPaymentProof.findFirst({
      where: { id: proofId, paymentId },
      include: {
        payment: {
          select: {
            confId: true,
            isLocked: true,
            status: true,
            committeeScope: true,
          },
        },
      },
    });

    if (!proof || proof.payment.confId !== confId) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    if (proof.payment.isLocked || proof.payment.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved/locked payments cannot have proofs removed" },
        { status: 409 },
      );
    }

    const isScopedMemberActor =
      !auth.access.isSuperAdmin &&
      !auth.access.isChair &&
      Boolean(auth.access.memberId);
    if (
      isScopedMemberActor &&
      proof.payment.committeeScope !== auth.access.committeeScope
    ) {
      return NextResponse.json(
        {
          error:
            "You can only remove proofs from payments within your committee scope",
        },
        { status: 403 },
      );
    }

    await prisma.confPaymentProof.delete({ where: { id: proofId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete payment proof:", error);
    return NextResponse.json(
      { error: "Failed to delete payment proof" },
      { status: 500 },
    );
  }
}
