import { downloadPlatforms } from "./registry";
import type { DownloadPlatform } from "./types";
import { DOWNLOAD_HUB_PATH } from "./nav";

export const platformsByRouteSlug: Record<string, DownloadPlatform> =
  Object.fromEntries(downloadPlatforms.map((p) => [p.routeSlug, p]));

export function getPlatformByRouteSlug(
  routeSlug: string,
): DownloadPlatform | undefined {
  return platformsByRouteSlug[routeSlug];
}

export function platformRoutePath(
  platform: DownloadPlatform | Pick<DownloadPlatform, "routeSlug" | "href">,
): string {
  return "href" in platform && platform.href
    ? platform.href
    : `${DOWNLOAD_HUB_PATH}/${platform.routeSlug}`;
}

export function parsePlatformRouteSlug(pathname: string): string | null {
  if (!pathname.startsWith(`${DOWNLOAD_HUB_PATH}/`)) {
    return null;
  }
  const slug = pathname.slice(DOWNLOAD_HUB_PATH.length + 1).split("/")[0];
  return slug || null;
}
