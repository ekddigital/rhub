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

export function isHotelCheckinAllowedRoute(pathname: string): boolean {
  const normalized = normalizeConfRoutePath(pathname);
  if (normalized.startsWith("/tools/conf/unavailable")) {
    return true;
  }
  return (HOTEL_CHECKIN_ALLOWED_ROUTES as readonly string[]).includes(
    normalized,
  );
}

export function canAccessHotelCheckin(
  access: Pick<ConferenceAccess, "isHotelCheckin" | "isSuperAdmin">,
): boolean {
  return access.isSuperAdmin || access.isHotelCheckin;
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
