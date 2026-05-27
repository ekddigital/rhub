/**
 * Client-safe download hub exports (no Node.js / yt-dlp).
 * Use in `"use client"` components and shared UI code.
 */
export type {
  AudioQuality,
  DownloadFormat,
  DownloadPlatform,
  Platform,
  PlatformStatus,
  VideoQuality,
  VideoFormatOption,
  VideoSession,
  VideoSessionResponse,
  VideoEntryPreview,
} from "./types";

export {
  audioQualities,
  formats,
  pickAudioQualities,
  pickVideoQualities,
  videoQualities,
} from "./formats";

export {
  DOWNLOAD_HUB_PATH,
  downloadHubNav,
  isDownloadHubPath,
  isFileDownloadsPath,
} from "./nav";

export {
  getPlatformByRouteSlug,
  parsePlatformRouteSlug,
  parseWatchSessionPath,
  platformRoutePath,
  platformsByRouteSlug,
  watchSessionPath,
} from "./routes";

export {
  detectPlatform,
  downloadPlatforms,
  getAllPlatforms,
  getAvailableFormats,
  getAvailableQualities,
  getLivePlatforms,
  getPlatformById,
  isPlatformReady,
  platformsById,
  validateUrl,
} from "./registry";

export {
  ANALYZE_CLIENT_TIMEOUT_MS,
  ANALYZE_MESSAGE_INTERVAL_MS,
  ANALYZE_SLOW_WARN_MS,
  ANALYZE_TIMEOUT_ERROR,
  buildAnalyzeMessages,
  type AnalyzePhase,
  type AnalyzeStatusMessage,
} from "./analyze-progress";

export {
  validateMediaUrlInput,
  type MediaUrlValidationResult,
} from "./url-validation";

export type InstallHintTarget = "ttyd" | "linux" | "dev";

export type DownloadHubDepsSnapshot = {
  ytDlp: boolean;
  ffmpeg: boolean;
  paths: {
    ytDlp?: string;
    ffmpeg?: string;
  };
};

/** Response shape for GET /api/tools/vid/health */
export type DownloadHubToolHealth = {
  ytDlp: boolean;
  ffmpeg: boolean;
  paths: {
    ytDlp?: string;
    ffmpeg?: string;
  };
  hints?: {
    ytDlp?: string;
    ffmpeg?: string;
  };
  /** Which install-hint set the server selected (dev brew vs Linux VPS vs TTYD). */
  hintTarget?: InstallHintTarget;
  ttydConfigured?: boolean;
  terminalUrl?: string;
  /** Local vs remote dependency snapshots (health API). */
  local?: DownloadHubDepsSnapshot;
  remote?: DownloadHubDepsSnapshot;
  /** True when this app can run downloads (local yt-dlp + ffmpeg). */
  readyForDownloads?: boolean;
  /** True when the TTYD host has both tools installed. */
  remoteInstallOk?: boolean;
  statusMessage?: string;
  envSuggestions?: {
    YT_DLP_BIN?: string;
    FFMPEG_BIN?: string;
  };
};
