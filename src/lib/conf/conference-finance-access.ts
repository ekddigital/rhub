import type { ConferenceAccess } from "@/lib/conf/access";

/** Financial Secretary queue: Super Admin, Chair/Vice-Chair, or Financial Secretary officer. */
export function canManageConferenceDelegateFinanceFs(
  access: ConferenceAccess,
): boolean {
  return (
    access.isSuperAdmin ||
    access.isChair ||
    access.memberRole === "FINANCIAL_SECRETARY"
  );
}

/** Treasurer dashboard: Super Admin or National Treasurer (ConfRole.TREASURER). */
export function canAccessConferenceTreasurerFinance(
  access: ConferenceAccess,
): boolean {
  return access.isSuperAdmin || access.memberRole === "TREASURER";
}

export function isConferenceTreasurerOnlyManager(
  access: ConferenceAccess,
): boolean {
  return (
    Boolean(access.user) &&
    access.isManager &&
    access.memberRole === "TREASURER" &&
    !access.isSuperAdmin &&
    !access.isChair
  );
}
