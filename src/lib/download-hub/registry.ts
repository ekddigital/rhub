import type { DownloadFormat, DownloadPlatform } from "./types";
import {
  facebookPlatform,
  instagramPlatform,
  tiktokPlatform,
  twitterPlatform,
  vimeoPlatform,
  youtubePlatform,
} from "./platforms";

/** Ordered list — live platforms first, then coming soon */
export const downloadPlatforms: DownloadPlatform[] = [
  youtubePlatform,
  facebookPlatform,
  instagramPlatform,
  tiktokPlatform,
  twitterPlatform,
  vimeoPlatform,
];

export const platformsById: Record<string, DownloadPlatform> =
  Object.fromEntries(downloadPlatforms.map((p) => [p.id, p]));

export function getAllPlatforms(): DownloadPlatform[] {
  return downloadPlatforms;
}

export function getLivePlatforms(): DownloadPlatform[] {
  return downloadPlatforms.filter((p) => p.status === "live");
}

export function getPlatformById(id: string): DownloadPlatform | undefined {
  return platformsById[id];
}

export function detectPlatform(url: string): DownloadPlatform | null {
  for (const platform of downloadPlatforms) {
    if (platform.canHandle(url)) {
      return platform;
    }
  }
  return null;
}

export function isPlatformReady(platform: DownloadPlatform): boolean {
  return platform.status === "live";
}

export function validateUrl(url: string): {
  valid: boolean;
  platform?: DownloadPlatform;
  videoId?: string;
  error?: string;
} {
  try {
    new URL(url.trim());
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return {
      valid: false,
      error:
        "Unsupported platform. Paste a link from YouTube, Facebook, Instagram, TikTok, X, or Vimeo.",
    };
  }

  const videoId = platform.extract(url);
  if (!videoId) {
    return { valid: false, error: "Could not extract media ID from URL" };
  }

  return { valid: true, platform, videoId };
}

export function getAvailableFormats(
  platform: DownloadPlatform,
): DownloadFormat[] {
  return platform.supportedFormats;
}

export function getAvailableQualities(
  platform: DownloadPlatform,
  formatType: "video" | "audio",
) {
  return formatType === "video"
    ? platform.videoQualities
    : platform.audioQualities;
}
