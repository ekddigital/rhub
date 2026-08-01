import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";
import {
  buildPaymentNoteFromItems,
  paymentAmountFromItems,
  paymentItemsFromNote,
  validatePaymentLineItemsPayload,
} from "@/lib/conf/payment-line-items-server";

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

// GET /api/conf/[confId]/payments — list all payments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const paymentType = searchParams.get("type"); // EXPENSE | INCOME
    const committeeScope = searchParams.get("scope");
    const status = searchParams.get("status");

    const payments = await prisma.confPayment.findMany({
      where: {
        confId,
        ...(paymentType
          ? { paymentType: paymentType as "EXPENSE" | "INCOME" }
          : {}),
        ...(committeeScope ? { committeeScope } : {}),
        ...(status
          ? {
              status: status as
                | "PENDING"
                | "COMMITTEE_APPROVED"
                | "APPROVED"
                | "REJECTED",
            }
          : {}),
      },
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/payments — create a payment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      budgetId,
      itemId,
      amount,
      paidBy,
      paidTo,
      method,
      ref: txRef,
      note,
      paymentType,
      incomeSource,
      committeeScope,
      submittedByMemberId,
      items,
    } = body;

    const lineItemValidation = items
      ? validatePaymentLineItemsPayload(items)
      : null;
    if (lineItemValidation && !lineItemValidation.ok) {
      return NextResponse.json(
        { error: lineItemValidation.error },
        { status: 400 },
      );
    }

    const normalizedItems = lineItemValidation?.items;
    const computedAmount = normalizedItems
      ? paymentAmountFromItems(normalizedItems)
      : Number(amount);

    if (!computedAmount || !paidBy) {
      return NextResponse.json(
        { error: "amount and paidBy are required" },
        { status: 400 },
      );
    }

    const allowedTypes = ["EXPENSE", "INCOME"];
    if (paymentType && !allowedTypes.includes(paymentType)) {
      return NextResponse.json(
        { error: "Invalid paymentType" },
        { status: 400 },
      );
    }

    const submitterMemberId =
      submittedByMemberId || auth.access.memberId || null;

    const submitter = submitterMemberId
      ? await prisma.confMember.findFirst({
          where: {
            id: String(submitterMemberId),
            confId,
            isActive: true,
          },
          select: {
            id: true,
            committeeScope: true,
          },
        })
      : null;

    if (submitterMemberId && !submitter) {
      return NextResponse.json(
        { error: "Submitted-by committee member not found" },
        { status: 404 },
      );
    }

    const normalizedScope =
      String(committeeScope || "").trim() ||
      submitter?.committeeScope ||
      auth.access.committeeScope ||
      null;

    const isScopedMemberActor =
      !auth.access.isSuperAdmin &&
      !auth.access.isChair &&
      Boolean(auth.access.memberId);

    if (isScopedMemberActor) {
      if (!normalizedScope || normalizedScope !== auth.access.committeeScope) {
        return NextResponse.json(
          {
            error:
              "You can only submit payments within your assigned committee scope",
          },
          { status: 403 },
        );
      }

      if (submitter && submitter.id !== auth.access.memberId) {
        return NextResponse.json(
          {
            error:
              "You can only submit payments as your own committee member profile",
          },
          { status: 403 },
        );
      }
    }

    const notePayload = normalizedItems
      ? buildPaymentNoteFromItems(normalizedItems, note)
      : note || null;

    const payment = await prisma.confPayment.create({
      data: {
        confId,
        budgetId: budgetId || null,
        itemId: itemId || null,
        amount: computedAmount,
        paidBy,
        paidTo: paidTo || null,
        method: method || "WECHAT",
        ref: txRef || null,
        note: notePayload,
        paymentType: paymentType || "EXPENSE",
        incomeSource: incomeSource || null,
        committeeScope: normalizedScope,
        submittedByMemberId: submitter?.id || auth.access.memberId || null,
        ...(normalizedItems
          ? {
              lineItems: {
                create: normalizedItems.map((item) => ({
                  no: item.no ?? 1,
                  name: item.name,
                  qty: item.qty,
                  unit: item.unit,
                  unitPrice: item.unitPrice,
                })),
              },
            }
          : {}),
      },
      include: paymentInclude,
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_CREATED",
      entityType: "payment",
      entityId: payment.id,
      details: {
        amount: payment.amount,
        paymentType: payment.paymentType,
        committeeScope: payment.committeeScope,
        paidBy: payment.paidBy,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
