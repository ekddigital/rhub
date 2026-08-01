import { NextResponse } from "next/server";
import { PayMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";
import {
  buildPaymentNoteFromItems,
  paymentAmountFromItems,
  validatePaymentLineItemsPayload,
} from "@/lib/conf/payment-line-items-server";
import {
  canDeletePayment,
  canEditPayment,
} from "@/lib/conf/payment-access";
import { mapPaymentForClient } from "@/lib/conf/payment-proof-urls";

type Params = { params: Promise<{ confId: string; paymentId: string }> };

const paymentInclude = {
  proofs: true,
  lineItems: {
    orderBy: { no: "asc" as const },
    include: { proofs: true },
  },
  budget: { select: { id: true, title: true } },
  item: { select: { id: true, name: true } },
  submittedBy: {
    select: {
      id: true,
      name: true,
      role: true,
      committeeScope: true,
      canApprovePayments: true,
    },
  },
  committeeApprover: { select: { id: true, name: true, role: true } },
};

function normalizeScope(value: unknown) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

// GET /api/conf/[confId]/payments/[paymentId] — read one payment
export async function GET(_req: Request, { params }: Params) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const payment = await prisma.confPayment.findFirst({
      where: { id: paymentId, confId },
      include: paymentInclude,
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(mapPaymentForClient(confId, payment));
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/payments/[paymentId] — update mutable fields
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confPayment.findFirst({
      where: { id: paymentId, confId },
      select: {
        id: true,
        amount: true,
        paidBy: true,
        paidTo: true,
        method: true,
        ref: true,
        note: true,
        paymentType: true,
        incomeSource: true,
        committeeScope: true,
        status: true,
        isLocked: true,
        submittedByMemberId: true,
        submittedBy: {
          select: { id: true, committeeScope: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (!canEditPayment(existing, auth.access)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this payment" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as {
      amount?: number;
      paidBy?: string;
      paidTo?: string | null;
      method?: string;
      ref?: string | null;
      note?: string | null;
      paymentType?: "EXPENSE" | "INCOME";
      incomeSource?: string | null;
      committeeScope?: string | null;
      submittedByMemberId?: string | null;
      items?: Array<{
        id?: string;
        no?: number;
        name: string;
        qty: number;
        unit: string;
        unitPrice: number;
      }>;
    };

    const lineItemValidation =
      body.items !== undefined
        ? validatePaymentLineItemsPayload(body.items)
        : null;
    if (lineItemValidation && !lineItemValidation.ok) {
      return NextResponse.json(
        { error: lineItemValidation.error },
        { status: 400 },
      );
    }

    const normalizedItems = lineItemValidation?.items;
    const nextAmount =
      normalizedItems !== undefined
        ? paymentAmountFromItems(normalizedItems)
        : body.amount !== undefined
          ? Number(body.amount)
          : existing.amount;

    const allowedTypes = ["EXPENSE", "INCOME"] as const;
    if (body.paymentType && !allowedTypes.includes(body.paymentType)) {
      return NextResponse.json(
        { error: "Invalid paymentType" },
        { status: 400 },
      );
    }

    if (!(nextAmount > 0)) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    if (body.paidBy !== undefined && String(body.paidBy).trim().length === 0) {
      return NextResponse.json(
        { error: "paidBy is required" },
        { status: 400 },
      );
    }

    const allowedMethods = Object.values(PayMethod);
    if (
      body.method !== undefined &&
      !allowedMethods.includes(body.method as PayMethod)
    ) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const nextScope =
      body.committeeScope !== undefined
        ? normalizeScope(body.committeeScope)
        : existing.committeeScope;

    const isScopedMemberActor =
      !auth.access.isSuperAdmin &&
      !auth.access.isChair &&
      Boolean(auth.access.memberId);
    if (isScopedMemberActor && nextScope !== auth.access.committeeScope) {
      return NextResponse.json(
        {
          error:
            "You can only edit payments within your assigned committee scope",
        },
        { status: 403 },
      );
    }

    const nextNote =
      normalizedItems !== undefined
        ? buildPaymentNoteFromItems(
            normalizedItems,
            body.note !== undefined ? body.note : existing.note,
          )
        : body.note !== undefined
          ? normalizeScope(body.note)
          : existing.note;

    const requiresReapproval = existing.status !== "PENDING";
    const updated = await prisma.$transaction(async (tx) => {
      if (normalizedItems !== undefined) {
        await tx.confPaymentLineItem.deleteMany({ where: { paymentId } });
        if (normalizedItems.length > 0) {
          await tx.confPaymentLineItem.createMany({
            data: normalizedItems.map((item) => ({
              paymentId,
              no: item.no ?? 1,
              name: item.name,
              qty: item.qty,
              unit: item.unit,
              unitPrice: item.unitPrice,
            })),
          });
        }
      }

      const data: Prisma.ConfPaymentUpdateInput = {
        amount: nextAmount,
        ...(body.paidBy !== undefined ? { paidBy: String(body.paidBy).trim() } : {}),
        ...(body.paidTo !== undefined
          ? { paidTo: normalizeScope(body.paidTo) }
          : {}),
        ...(body.method !== undefined ? { method: body.method as PayMethod } : {}),
        ...(body.ref !== undefined ? { ref: normalizeScope(body.ref) } : {}),
        ...(body.note !== undefined || normalizedItems !== undefined
          ? { note: nextNote }
          : {}),
        ...(body.paymentType !== undefined ? { paymentType: body.paymentType } : {}),
        ...(body.incomeSource !== undefined
          ? { incomeSource: normalizeScope(body.incomeSource) }
          : {}),
        ...(body.committeeScope !== undefined ? { committeeScope: nextScope } : {}),
        ...(body.submittedByMemberId !== undefined
          ? body.submittedByMemberId
            ? {
                submittedBy: {
                  connect: { id: String(body.submittedByMemberId) },
                },
              }
            : { submittedBy: { disconnect: true } }
          : {}),
        ...(requiresReapproval
          ? {
              status: "PENDING",
              committeeApprovedAt: null,
              committeeApprover: { disconnect: true },
              approvedBy: null,
              approvedAt: null,
            }
          : {}),
      };

      return tx.confPayment.update({
        where: { id: paymentId },
        data,
        include: paymentInclude,
      });
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_UPDATED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        previous: existing,
        current: {
          amount: updated.amount,
          paidBy: updated.paidBy,
          paidTo: updated.paidTo,
          method: updated.method,
          ref: updated.ref,
          note: updated.note,
          paymentType: updated.paymentType,
          incomeSource: updated.incomeSource,
          committeeScope: updated.committeeScope,
          status: updated.status,
        },
      },
    });

    return NextResponse.json(mapPaymentForClient(confId, updated));
  } catch (error) {
    console.error("Failed to update payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/payments/[paymentId] — remove payment (admins may delete approved/locked)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confPayment.findFirst({
      where: { id: paymentId, confId },
      select: {
        id: true,
        amount: true,
        paidBy: true,
        paymentType: true,
        committeeScope: true,
        status: true,
        isLocked: true,
        submittedByMemberId: true,
        submittedBy: {
          select: { id: true, committeeScope: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (!canDeletePayment(existing, auth.access)) {
      return NextResponse.json(
        { error: "You do not have permission to delete this payment" },
        { status: 403 },
      );
    }

    await prisma.confPayment.delete({ where: { id: paymentId } });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_DELETED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        amount: existing.amount,
        paidBy: existing.paidBy,
        paymentType: existing.paymentType,
        committeeScope: existing.committeeScope,
        previousStatus: existing.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
