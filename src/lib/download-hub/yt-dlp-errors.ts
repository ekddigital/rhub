import { YT_DLP_NOT_INSTALLED_MESSAGE, YT_DLP_README_PATH } from "./constants";
import { FFMPEG_REQUIRED_MESSAGE, mapFfmpegError } from "./ffmpeg";
import { isTtydConfigured } from "./ttyd-config";
import { isYtDlpUnavailableMessage } from "./yt-dlp-binary";

export type YtDlpErrorKind =
  | "missing"
  | "private"
  | "auth_required"
  | "bot_check"
  | "geo"
  | "blocked"
  | "not_found"
  | "timeout"
  | "size_exceeded"
  | "ffmpeg"
  | "unknown";

export type YtDlpErrorPhase = "info" | "download";

export type YtDlpErrorContext = {
  phase?: YtDlpErrorPhase;
  url?: string;
};

function isFacebookUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("facebook.com") ||
      host === "fb.watch" ||
      host === "m.facebook.com"
    );
  } catch {
    return false;
  }
}

function mapInfoTimeoutMessage(url?: string): string {
  if (isFacebookUrl(url)) {
    return "Fetching Facebook video info timed out. Share links can take a minute — open the video on Facebook, copy the watch or reel URL, and paste that here. Private or friends-only videos need YTDLP_COOKIES or YT_DLP_COOKIES_FILE on the server.";
  }
  return "Fetching video metadata timed out. Try a direct watch or reel URL, or retry in a moment.";
}

function mapDownloadTimeoutMessage(): string {
  return "The download timed out. Try again or pick a lower quality.";
}

function mapFacebookAuthMessage(): string {
  return "This Facebook video may be private or require login. Set YTDLP_COOKIES or YT_DLP_COOKIES_FILE on the server with exported cookies, or paste a public watch/reel URL.";
}

const PRIVATE_PATTERNS: RegExp[] = [
  /\bprivate video\b/i,
  /\bvideo is private\b/i,
  /\bmembers[- ]only\b/i,
  /\bthis live event is private\b/i,
];

const BOT_CHECK_PATTERNS: RegExp[] = [
  /not a bot/i,
  /confirm you.?re not a bot/i,
  /confirm you're not a bot/i,
];

const AUTH_PATTERNS: RegExp[] = [
  /\blogin required\b/i,
  /\bauthentication required\b/i,
  /\bsign in if you/i,
  /use --cookies(?:-from-browser)?/i,
  /\bcookies for the authentication\b/i,
  /\baccount.?only\b/i,
];

const GEO_PATTERNS: RegExp[] = [
  /\bnot available in your country\b/i,
  /\bblocked in your country\b/i,
  /\bgeo[- ]?restrict/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeRawError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || /^(null|undefined|nan)$/i.test(trimmed)) {
    return "Failed to fetch media metadata from source. Try again.";
  }
  return trimmed;
}

/** Classify raw yt-dlp stderr (or timeout message) before user-facing mapping. */
export function classifyYtDlpError(raw: string): YtDlpErrorKind {
  const normalized = normalizeRawError(raw);
  const lower = normalized.toLowerCase();

  if (isYtDlpUnavailableMessage(normalized)) {
    return "missing";
  }

  if (
    lower.includes("exceeds maximum size") ||
    lower.includes("file exceeds maximum size")
  ) {
    return "size_exceeded";
  }

  if (
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("metadata fetch timed out")
  ) {
    return "timeout";
  }

  if (matchesAny(normalized, BOT_CHECK_PATTERNS)) {
    return "bot_check";
  }

  if (matchesAny(normalized, PRIVATE_PATTERNS)) {
    return "private";
  }

  if (matchesAny(normalized, AUTH_PATTERNS)) {
    return "auth_required";
  }

  if (matchesAny(normalized, GEO_PATTERNS) || lower.includes("geo")) {
    return "geo";
  }

  if (lower.includes("copyright") || lower.includes("blocked")) {
    return "blocked";
  }

  if (lower.includes("unsupported url") || lower.includes("no video")) {
    return "not_found";
  }

  const ffmpegMapped = mapFfmpegError(normalized);
  if (ffmpegMapped === FFMPEG_REQUIRED_MESSAGE) {
    return "ffmpeg";
  }

  return "unknown";
}

export function httpStatusForYtDlpError(raw: string): number {
  const kind = classifyYtDlpError(raw);
  switch (kind) {
    case "missing":
    case "ffmpeg":
      return 503;
    case "private":
    case "auth_required":
    case "bot_check":
    case "geo":
      return 403;
    case "not_found":
      return 404;
    case "timeout":
      return 504;
    case "size_exceeded":
      return 413;
    case "blocked":
      return 451;
    default:
      return 500;
  }
}

export function mapYtDlpError(
  raw: string,
  context?: YtDlpErrorContext,
): string {
  const normalized = normalizeRawError(raw);
  const kind = classifyYtDlpError(normalized);
  const lower = normalized.toLowerCase();
  const phase = context?.phase;
  const url = context?.url;

  switch (kind) {
    case "missing":
      if (isTtydConfigured()) {
        return (
          `${YT_DLP_NOT_INSTALLED_MESSAGE} ` +
          'Install on the VPS via "Install on server" or POST /api/tools/vid/setup. ' +
          `See ${YT_DLP_README_PATH}.`
        );
      }
      return `${YT_DLP_NOT_INSTALLED_MESSAGE} Contact an administrator or install yt-dlp on the server.`;

    case "private":
      if (isFacebookUrl(url) || lower.includes("facebook")) {
        return "This Facebook video is private or not available to download. Use a public watch/reel URL, or configure YTDLP_COOKIES / YT_DLP_COOKIES_FILE for logged-in access.";
      }
      return "This video is private and cannot be downloaded.";

    case "bot_check":
      return "YouTube blocked automated access from this server (bot check). Try again later, or ask an admin to set YT_DLP_COOKIES_FILE with exported cookies.";

    case "auth_required":
      if (isFacebookUrl(url) || lower.includes("facebook")) {
        return mapFacebookAuthMessage();
      }
      return "This content requires login and cannot be downloaded without server cookies (YTDLP_COOKIES or YT_DLP_COOKIES_FILE).";

    case "geo":
      return "This content is not available in your region.";

    case "blocked":
      return "This content is blocked or unavailable for download.";

    case "not_found":
      return "No downloadable video was found at this URL.";

    case "timeout":
      if (phase === "info") {
        return mapInfoTimeoutMessage(url);
      }
      if (phase === "download") {
        return mapDownloadTimeoutMessage();
      }
      if (
        lower.includes("metadata") ||
        lower.includes("info") ||
        lower.includes("analyze") ||
        lower.includes("facebook metadata") ||
        lower.includes("/share/")
      ) {
        return mapInfoTimeoutMessage(url);
      }
      return mapDownloadTimeoutMessage();

    case "size_exceeded":
      return normalized.trim() || "File exceeds maximum size";

    case "ffmpeg":
      return FFMPEG_REQUIRED_MESSAGE;

    default:
      return mapFfmpegError(normalized.trim() || "yt-dlp failed");
  }
}
