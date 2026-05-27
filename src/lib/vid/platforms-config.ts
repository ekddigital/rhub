/**
 * @deprecated Import from `@/lib/download-hub` for new code.
 * Re-exports the Download Hub registry for backward compatibility with the video engine and API.
 */
export type {
  AudioQuality,
  DownloadFormat,
  Platform,
  PlatformStatus,
  VideoQuality,
} from "@/lib/download-hub/types";

export {
  audioQualities,
  formats,
  videoQualities,
} from "@/lib/download-hub/formats";

export {
  detectPlatform,
  getAvailableFormats,
  getAvailableQualities,
  getPlatformById,
  isPlatformReady,
  validateUrl,
} from "@/lib/download-hub/registry";

import { platformsById } from "@/lib/download-hub/registry";
import type { Platform } from "@/lib/download-hub/types";

/** Legacy map keyed by platform name (youtube, instagram, …) */
export const platforms: Record<string, Platform> = Object.fromEntries(
  Object.values(platformsById).map((platform) => [platform.name, platform]),
);

export { platformsById };
