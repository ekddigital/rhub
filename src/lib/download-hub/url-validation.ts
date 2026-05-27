/**
 * Client-safe URL validation with platform-specific rules and clear errors.
 */
import { detectPlatform, isPlatformReady } from "./registry";
import type { DownloadPlatform } from "./types";

export type MediaUrlValidationResult =
  | { ok: true; platform: DownloadPlatform; normalizedUrl: string }
  | { ok: false; error: string };

function tryParseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Facebook paths we accept (must match yt-dlp-capable link shapes). */
const FB_PATH_PATTERNS: RegExp[] = [
  /^\/watch(?:\/|\?|$)/i,
  /^\/reel(?:s)?\//i,
  /^\/videos\//i,
  /^\/video\.php/i,
  /^\/share\/(?:v|r|reel)\/[\w-]+/i,
  /^\/share\.php/i,
  /^\/[^/?#]+\/videos\/\d+/i,
  /^\/groups\/[^/]+\/posts\//i,
];

function validateFacebookUrl(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "fb.watch") {
    const token = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (!token || token.length < 2) {
      return "fb.watch links need a video id after the domain (e.g. fb.watch/abc123).";
    }
    return null;
  }

  if (host === "fb.com") {
    return "Use a full facebook.com or fb.watch link — fb.com short links are not supported here.";
  }

  const isFacebookHost =
    host === "facebook.com" ||
    host === "m.facebook.com" ||
    host === "web.facebook.com";

  if (!isFacebookHost) {
    return "Not a Facebook URL. Use facebook.com, m.facebook.com, or fb.watch.";
  }

  const path = parsed.pathname || "/";
  if (FB_PATH_PATTERNS.some((re) => re.test(path))) {
    return null;
  }

  if (path.includes("/share/")) {
    return "Facebook share link is incomplete. Use a full share URL like facebook.com/share/v/… or open the video and copy the watch/reel link.";
  }

  return "Unrecognized Facebook URL. Supported: /watch, /reel, /videos, /share/v/, /share/r/, fb.watch, and page video links.";
}

const PLATFORM_VALIDATORS: Record<
  string,
  (parsed: URL) => string | null
> = {
  fb: validateFacebookUrl,
  yt: (parsed) => {
    const host = parsed.hostname.toLowerCase();
    const isYt =
      host.includes("youtube.com") ||
      host === "youtu.be" ||
      host === "www.youtu.be";
    if (!isYt) return "Not a YouTube URL.";
    if (
      !/(?:[?&]v=|\/embed\/|\/v\/|\/shorts\/|\/live\/|youtu\.be\/)[a-zA-Z0-9_-]{11}/.test(
        parsed.href,
      )
    ) {
      return "YouTube link is missing a valid 11-character video id.";
    }
    return null;
  },
  ig: (parsed) => {
    if (!parsed.hostname.toLowerCase().includes("instagram.com")) {
      return "Not an Instagram URL.";
    }
    if (
      !/^\/(p|reel|reels|tv)\/[a-zA-Z0-9_-]+/.test(parsed.pathname) &&
      !/^\/share\/(p|reel)\//.test(parsed.pathname) &&
      !/^\/stories\//.test(parsed.pathname)
    ) {
      return "Unrecognized Instagram URL. Use /p/, /reel/, /tv/, or /share/reel/ links.";
    }
    return null;
  },
};

/**
 * Validate a media URL before calling the server. Returns instant, actionable errors.
 */
export function validateMediaUrlInput(
  raw: string,
  options?: { livePlatformNames?: string },
): MediaUrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Please enter a media URL" };
  }

  const parsed = tryParseHttpUrl(trimmed);
  if (!parsed) {
    if (!trimmed.includes(".")) {
      return { ok: false, error: "Enter a full URL starting with https://" };
    }
    return {
      ok: false,
      error: "Invalid URL — use https:// and a supported video link",
    };
  }

  const platform = detectPlatform(parsed.toString());
  if (!platform) {
    return {
      ok: false,
      error:
        "Unsupported platform. Paste a link from YouTube, Facebook, Instagram, TikTok, X, or Vimeo.",
    };
  }

  const platformError = PLATFORM_VALIDATORS[platform.id]?.(parsed);
  if (platformError) {
    return { ok: false, error: platformError };
  }

  if (!platform.canHandle(parsed.toString())) {
    return {
      ok: false,
      error: `This doesn't look like a valid ${platform.displayName} video link.`,
    };
  }

  if (!isPlatformReady(platform)) {
    const live = options?.livePlatformNames ?? "YouTube, Facebook, and others";
    return {
      ok: false,
      error: `${platform.displayName} is coming soon. Currently live: ${live}.`,
    };
  }

  const extracted = platform.extract(parsed.toString());
  if (!extracted) {
    return {
      ok: false,
      error: `Could not read a media id from this ${platform.displayName} URL. Check the link and try again.`,
    };
  }

  return { ok: true, platform, normalizedUrl: parsed.toString() };
}
