import type { ConferenceAccess } from "@/lib/conf/access";

export const HOTEL_CHECKIN_CONF_ROLE = "HOTEL_CHECKIN" as const;

/** Routes hotel check-in staff may open (exact paths; query strings ignored). */
export const HOTEL_CHECKIN_ALLOWED_ROUTES = [
  "/tools/conf",
  "/tools/conf/delegates",
  "/tools/conf/logistics/name-list",
] as const;

export function normalizeConfRoutePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return trimmed || "/";
}

function isHotelCheckinDelegateDetailRoute(normalized: string): boolean {
  if (normalized.startsWith("/tools/conf/delegates/p/")) {
    const suffix = normalized.slice("/tools/conf/delegates/p/".length);
    return Boolean(suffix) && !suffix.includes("/edit");
  }

  const match = normalized.match(/^\/tools\/conf\/delegates\/([^/]+)$/);
  if (!match) return false;

  const segment = match[1];
  return segment !== "register" && segment !== "finance";
}

export function isHotelCheckinAllowedRoute(pathname: string): boolean {
  const normalized = normalizeConfRoutePath(pathname);
  if (normalized.startsWith("/tools/conf/unavailable")) {
    return true;
  }
  if ((HOTEL_CHECKIN_ALLOWED_ROUTES as readonly string[]).includes(normalized)) {
    return true;
  }
  return isHotelCheckinDelegateDetailRoute(normalized);
}

export function canAccessHotelCheckin(
  access: Pick<ConferenceAccess, "isHotelCheckin" | "isSuperAdmin">,
): boolean {
  return access.isSuperAdmin || access.isHotelCheckin;
}

/** Read-only access to all delegate passports, visas, stamps, and booklet photos. */
export function canViewDelegateDocuments(
  access: Pick<
    ConferenceAccess,
    "isManager" | "isSuperAdmin" | "isHotelCheckin"
  >,
): boolean {
  return (
    access.isSuperAdmin || access.isManager || access.isHotelCheckin
  );
}

export function canViewLogisticsNameList(
  access: Pick<
    ConferenceAccess,
    "isManager" | "isSuperAdmin" | "isHotelCheckin"
  >,
): boolean {
  return (
    access.isSuperAdmin ||
    access.isManager ||
    canAccessHotelCheckin(access)
  );
}

/** Hotel staff with no broader conference manager powers. */
export function isConferenceHotelCheckinOnly(
  access: ConferenceAccess,
): boolean {
  return Boolean(
    access.user &&
      access.isHotelCheckin &&
      !access.isSuperAdmin &&
      !access.isManager,
  );
}

export function isHotelCheckinNavHref(href: string): boolean {
  return isHotelCheckinAllowedRoute(href);
}
