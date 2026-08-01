import type { PayStatus } from "@prisma/client";
import type { ConferenceAccess } from "@/lib/conf/access";

export type PaymentAccessRecord = {
  id: string;
  status: PayStatus;
  isLocked: boolean;
  committeeScope: string | null;
  submittedByMemberId: string | null;
  submittedBy?: {
    id: string;
    committeeScope: string | null;
  } | null;
};

export function isPaymentOwner(
  payment: Pick<PaymentAccessRecord, "submittedByMemberId">,
  access: Pick<ConferenceAccess, "memberId">,
): boolean {
  return Boolean(
    access.memberId && payment.submittedByMemberId === access.memberId,
  );
}

export function hasPaymentAdminRights(
  access: Pick<ConferenceAccess, "isChair" | "isSuperAdmin">,
): boolean {
  return access.isChair || access.isSuperAdmin;
}

export function canEditPayment(
  payment: PaymentAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (payment.isLocked || payment.status === "APPROVED") return false;

  if (hasPaymentAdminRights(access)) return true;

  if (isPaymentOwner(payment, access)) {
    return payment.status === "PENDING" || payment.status === "REJECTED";
  }

  if (!access.canApprovePayments || !access.committeeScope) return false;

  if (
    payment.committeeScope &&
    payment.committeeScope !== access.committeeScope
  ) {
    return false;
  }

  return (
    payment.status === "PENDING" || payment.status === "COMMITTEE_APPROVED"
  );
}

export function canDeletePayment(
  payment: PaymentAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (payment.isLocked || payment.status === "APPROVED") return false;

  if (hasPaymentAdminRights(access)) return true;

  if (isPaymentOwner(payment, access)) {
    return payment.status === "PENDING" || payment.status === "REJECTED";
  }

  if (!access.canApprovePayments || !access.committeeScope) return false;

  if (
    payment.committeeScope &&
    payment.committeeScope !== access.committeeScope
  ) {
    return false;
  }

  return true;
}
