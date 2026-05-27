import { getLivePlatforms, isPlatformReady } from "@/lib/download-hub/client";
import {
  downloadWithSelector,
  downloadWithYtDlp,
  extractWithYtDlp,
  FFMPEG_REQUIRED_MESSAGE,
  getFormatFromSession,
  getVideoSession,
  isFfmpegAvailable,
  sanitizeMediaUrl,
} from "@/lib/download-hub/server";
import type {
  Platform,
  VideoQuality,
  AudioQuality,
  DownloadFormat,
} from "./platforms-config";

export interface DownloadOptions {
  url: string;
  platform: Platform;
  format: DownloadFormat;
  quality?: VideoQuality | AudioQuality;
  videoId: string;
}

export interface DownloadResult {
  buffer: Buffer;
  fileName: string;
  format: string;
  size: number;
  duration?: number;
  processingTime: number;
  metadata: {
    title?: string;
    author?: string;
    thumbnail?: string;
    description?: string;
    views?: number;
    uploadDate?: string;
  };
}

export interface VideoInfo {
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  description: string;
  views: number;
  uploadDate: string;
  availableQualities: string[];
}

function assertPlatformLive(platform: Platform): void {
  if (!isPlatformReady(platform)) {
    const liveList = getLivePlatforms()
      .map((p) => p.displayName)
      .join(", ");
    throw new Error(
      `${platform.displayName} downloads are coming soon. Currently live: ${liveList}.`,
    );
  }
}

/**
 * Get video information without downloading (yt-dlp for all live platforms).
 */
export async function getVideoInfo(
  url: string,
  platform: Platform,
): Promise<VideoInfo> {
  assertPlatformLive(platform);
  try {
    sanitizeMediaUrl(url);
    return await extractWithYtDlp(url);
  } catch (error) {
    throw new Error(
      `Failed to get video info: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Download video or audio from supported platforms via yt-dlp.
 */
export async function downloadVideo(
  options: DownloadOptions,
): Promise<DownloadResult> {
  assertPlatformLive(options.platform);
  const start = Date.now();

  try {
    sanitizeMediaUrl(options.url);
    const result = await downloadWithYtDlp({
      url: options.url,
      format: options.format,
      quality: options.quality,
    });

    return {
      ...result,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    throw new Error(
      `Download failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Download using a cached session + format option id.
 */
export async function downloadVideoFromSession(
  sessionId: string,
  formatOptionId: string,
): Promise<DownloadResult> {
  const start = Date.now();
  const session = getVideoSession(sessionId);

  if (!session) {
    throw new Error("Session expired or not found. Paste the URL again.");
  }

  const formatOption = getFormatFromSession(session, formatOptionId);

  if (formatOption.requiresFfmpeg && !(await isFfmpegAvailable())) {
    throw new Error(FFMPEG_REQUIRED_MESSAGE);
  }

  try {
    const result = await downloadWithSelector(
      session.url,
      formatOption.ytdlpSelector,
      formatOption.ext,
      session.title,
    );

    return {
      ...result,
      fileName: result.fileName.endsWith(".mp3")
        ? result.fileName
        : `${result.fileName.replace(/\.[^.]+$/, "")}${formatOption.ext}`,
      format: formatOption.id,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    throw new Error(
      `Download failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
