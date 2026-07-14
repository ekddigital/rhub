import type { BudgetEditUnlockStatus, BudgetStatus } from "@prisma/client";
import type { ConferenceAccess } from "@/lib/conf/access";

export type BudgetAccessRecord = {
  id: string;
  status: BudgetStatus;
  createdBy: string;
  isLocked: boolean;
  editUnlockStatus: BudgetEditUnlockStatus;
  creator: {
    committeeScope: string | null;
  };
};

export function isBudgetOwner(
  budget: Pick<BudgetAccessRecord, "createdBy">,
  access: Pick<ConferenceAccess, "memberId">,
): boolean {
  return Boolean(access.memberId && budget.createdBy === access.memberId);
}

export function hasBudgetAdminRights(
  access: Pick<ConferenceAccess, "isChair" | "isSuperAdmin">,
): boolean {
  return access.isChair || access.isSuperAdmin;
}

export function isBudgetLockedForOwner(
  budget: Pick<
    BudgetAccessRecord,
    "status" | "isLocked" | "editUnlockStatus"
  >,
): boolean {
  if (budget.status === "DRAFT" || budget.status === "REJECTED") {
    return false;
  }
  if (budget.editUnlockStatus === "GRANTED") {
    return false;
  }
  return budget.status === "REVIEW" || budget.status === "APPROVED" || budget.isLocked;
}

export function canEditBudgetContent(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (hasBudgetAdminRights(access)) return true;
  if (!isBudgetOwner(budget, access)) return false;
  if (budget.status === "DRAFT" || budget.status === "REJECTED") return true;
  if (budget.editUnlockStatus === "GRANTED") return true;
  return false;
}

export function canDeleteBudget(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (budget.status === "APPROVED" || budget.isLocked) return false;

  if (hasBudgetAdminRights(access)) return true;

  if (isBudgetOwner(budget, access)) {
    return budget.status === "DRAFT" || budget.status === "REJECTED";
  }

  if (!access.canApprovePayments || !access.committeeScope) return false;

  if (
    budget.creator.committeeScope &&
    budget.creator.committeeScope !== access.committeeScope
  ) {
    return false;
  }

  return true;
}

export function canRequestBudgetEditUnlock(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (!isBudgetOwner(budget, access)) return false;
  if (budget.status !== "REVIEW" && budget.status !== "APPROVED") return false;
  if (budget.editUnlockStatus === "PENDING") return false;
  if (budget.editUnlockStatus === "GRANTED") return false;
  return true;
}

export function canManageBudgetEditUnlock(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (!hasBudgetAdminRights(access)) return false;
  return (
    budget.editUnlockStatus === "PENDING" ||
    budget.editUnlockStatus === "GRANTED" ||
    budget.status === "REVIEW" ||
    budget.status === "APPROVED"
  );
}

export function canGrantBudgetEditUnlock(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (!hasBudgetAdminRights(access)) return false;
  if (budget.editUnlockStatus === "GRANTED") return false;
  if (budget.status !== "REVIEW" && budget.status !== "APPROVED") return false;
  return true;
}

export function canRejectBudgetEditUnlock(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (!hasBudgetAdminRights(access)) return false;
  return budget.editUnlockStatus === "PENDING";
}

export function canReLockBudget(
  budget: BudgetAccessRecord,
  access: ConferenceAccess,
): boolean {
  if (!hasBudgetAdminRights(access)) return false;
  return budget.editUnlockStatus === "GRANTED";
}

/** After owner saves edits on a previously locked budget, reset unlock state. */
export function resolveBudgetStatusAfterOwnerEdit(
  currentStatus: BudgetStatus,
): BudgetStatus {
  if (currentStatus === "REJECTED" || currentStatus === "APPROVED") {
    return "DRAFT";
  }
  return currentStatus;
}
