import { DOWNLOAD_HUB_PATH } from "../nav";
import type { DownloadPlatform } from "../types";

export function createPlatform(
  config: Omit<DownloadPlatform, "canHandle" | "extract" | "href"> & {
    extractGroupIndex?: number;
    extractMediaId?: (url: string) => string | null;
  },
): DownloadPlatform {
  const { extractGroupIndex, extractMediaId, ...rest } = config;

  return {
    ...rest,
    href: `${DOWNLOAD_HUB_PATH}/${rest.routeSlug}`,
    canHandle(url: string) {
      return rest.urlPattern.test(url.trim());
    },
    extract(url: string) {
      const trimmed = url.trim();
      if (extractMediaId) {
        return extractMediaId(trimmed);
      }
      const match = trimmed.match(rest.urlPattern);
      if (!match) return null;
      if (extractGroupIndex !== undefined) {
        return match[extractGroupIndex] || null;
      }
      return match[0] || null;
    },
  };
}
