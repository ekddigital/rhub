import ytdl from "@distube/ytdl-core";
import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YTDlpWrap from "yt-dlp-wrap";
import type {
  Platform,
  VideoQuality,
  AudioQuality,
  DownloadFormat,
} from "./platforms-config";
import { getLivePlatforms, isPlatformReady } from "@/lib/download-hub/registry";

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

/**
 * Get video information without downloading
 */
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

export async function getVideoInfo(
  url: string,
  platform: Platform,
): Promise<VideoInfo> {
  assertPlatformLive(platform);
  try {
    switch (platform.id) {
      case "yt":
        return await getYouTubeInfo(url);
      case "ig":
      case "fb":
        return await getYtDlpInfo(url);
      case "tk":
        return await getTikTokInfo(url);
      case "tw":
        return await getTwitterInfo(url);
      case "vm":
        return await getVimeoInfo(url);
      default:
        throw new Error(`Unsupported platform: ${platform.name}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to get video info: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Download video or audio from supported platforms
 */
export async function downloadVideo(
  options: DownloadOptions,
): Promise<DownloadResult> {
  assertPlatformLive(options.platform);
  try {
    switch (options.platform.id) {
      case "yt":
        return await downloadYouTube(options);
      case "ig":
      case "fb":
        return await downloadWithYtDlp(options);
      case "tk":
        return await downloadTikTok(options);
      case "tw":
        return await downloadTwitter(options);
      case "vm":
        return await downloadVimeo(options);
      default:
        throw new Error(`Unsupported platform: ${options.platform.name}`);
    }
  } catch (error) {
    throw new Error(
      `Download failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

type YtDlpInfo = {
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string }>;
  description?: string;
  view_count?: number;
  upload_date?: string;
  formats?: Array<{
    height?: number;
    format_note?: string;
  }>;
};

const LOCAL_YT_DLP_PATH = path.join(
  os.tmpdir(),
  "rhub-download-hub",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

let ytDlpPath: string | null = null;
let ytDlpPathPromise: Promise<string> | null = null;

async function resolveYtDlpPath(): Promise<string> {
  if (ytDlpPath) {
    return ytDlpPath;
  }

  if (ytDlpPathPromise) {
    return ytDlpPathPromise;
  }

  ytDlpPathPromise = (async () => {
    const envPath = process.env.YT_DLP_BIN?.trim();
    if (envPath) {
      ytDlpPath = envPath;
      return envPath;
    }

    try {
      await access(LOCAL_YT_DLP_PATH);
      ytDlpPath = LOCAL_YT_DLP_PATH;
      return LOCAL_YT_DLP_PATH;
    } catch {
      await mkdir(path.dirname(LOCAL_YT_DLP_PATH), { recursive: true });
      await YTDlpWrap.downloadFromGithub(LOCAL_YT_DLP_PATH);
      ytDlpPath = LOCAL_YT_DLP_PATH;
      return LOCAL_YT_DLP_PATH;
    }
  })();

  try {
    return await ytDlpPathPromise;
  } finally {
    ytDlpPathPromise = null;
  }
}

function runYtDlp(args: string[]): Promise<{ stdout: Buffer; stderr: string }> {
  return new Promise(async (resolve, reject) => {
    let binaryPath: string;

    try {
      binaryPath = await resolveYtDlpPath();
    } catch (error) {
      reject(
        new Error(
          `yt-dlp is not available: ${
            error instanceof Error ? error.message : "Unknown setup error"
          }`,
        ),
      );
      return;
    }

    const child = spawn(binaryPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `yt-dlp failed to start: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ),
      );
    });

    child.on("close", (code) => {
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      if (code !== 0) {
        reject(
          new Error(stderr || `yt-dlp exited with code ${code ?? "unknown"}`),
        );
        return;
      }

      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr,
      });
    });
  });
}

function formatUploadDate(raw?: string): string {
  if (!raw) return "";
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

function mapYtDlpInfo(info: YtDlpInfo): VideoInfo {
  const qualitySet = new Set<string>();

  for (const format of info.formats || []) {
    if (typeof format.height === "number") {
      qualitySet.add(`${format.height}p`);
    } else if (format.format_note) {
      qualitySet.add(format.format_note);
    }
  }

  const availableQualities = Array.from(qualitySet).sort((a, b) => {
    const aNum = Number.parseInt(a, 10);
    const bNum = Number.parseInt(b, 10);
    if (Number.isNaN(aNum) || Number.isNaN(bNum)) return a.localeCompare(b);
    return bNum - aNum;
  });

  const thumbnail =
    info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || "";

  return {
    title: info.title || "Untitled",
    author: info.uploader || info.channel || "Unknown",
    duration: info.duration || 0,
    thumbnail,
    description: info.description || "",
    views: info.view_count || 0,
    uploadDate: formatUploadDate(info.upload_date),
    availableQualities,
  };
}

async function getYtDlpInfo(url: string): Promise<VideoInfo> {
  const { stdout } = await runYtDlp([
    "--dump-single-json",
    "--no-warnings",
    "--no-playlist",
    url,
  ]);

  let info: YtDlpInfo;
  try {
    info = JSON.parse(stdout.toString("utf8")) as YtDlpInfo;
  } catch {
    throw new Error("yt-dlp returned invalid metadata");
  }

  return mapYtDlpInfo(info);
}

function parseVideoHeight(
  quality?: VideoQuality | AudioQuality,
): number | null {
  if (!quality || !("resolution" in quality)) {
    return null;
  }

  const match = quality.id.match(/(\d+)p/);
  if (!match) {
    return null;
  }

  const height = Number.parseInt(match[1], 10);
  return Number.isNaN(height) ? null : height;
}

function buildYtDlpFormatSelector(options: DownloadOptions): string {
  if (options.format.type === "audio") {
    if (options.format.id === "m4a") {
      return "bestaudio[ext=m4a]/bestaudio";
    }
    return "bestaudio";
  }

  const height = parseVideoHeight(options.quality);
  const ext = options.format.id === "webm" ? "webm" : "mp4";

  if (height) {
    return `best[ext=${ext}][height<=${height}]/best[height<=${height}][ext=${ext}]/best[height<=${height}]/best[ext=${ext}]/best`;
  }

  return `best[ext=${ext}]/best`;
}

async function downloadWithYtDlp(
  options: DownloadOptions,
): Promise<DownloadResult> {
  const start = Date.now();

  const info = await getYtDlpInfo(options.url);
  const formatSelector = buildYtDlpFormatSelector(options);

  const { stdout } = await runYtDlp([
    "--no-warnings",
    "--no-playlist",
    "--no-part",
    "-f",
    formatSelector,
    "-o",
    "-",
    options.url,
  ]);

  if (!stdout.length) {
    throw new Error("yt-dlp returned an empty download stream");
  }

  const fileName = `${sanitizeFileName(info.title)}${options.format.ext}`;

  return {
    buffer: stdout,
    fileName,
    format: options.format.id,
    size: stdout.length,
    duration: info.duration,
    processingTime: Date.now() - start,
    metadata: {
      title: info.title,
      author: info.author,
      thumbnail: info.thumbnail,
      description: info.description || undefined,
      views: info.views,
      uploadDate: info.uploadDate,
    },
  };
}

/**
 * YouTube download implementation
 */

// Enhanced YouTube configuration with multiple bypass strategies
function getYTDLOptions() {
  return {
    requestOptions: {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Sec-Ch-Ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
        "Upgrade-Insecure-Requests": "1",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        DNT: "1",
        // Add cookie to appear as logged-in user (optional, helps with bot detection)
        Cookie: process.env.YOUTUBE_COOKIES || "",
      },
    },
    // Use iOS client which has fewer bot detection measures
    clients: ["ios", "web"],
    poToken: process.env.YOUTUBE_PO_TOKEN,
    visitorData: process.env.YOUTUBE_VISITOR_DATA,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

async function getYouTubeInfo(url: string): Promise<VideoInfo> {
  try {
    const info = await ytdl.getInfo(url, getYTDLOptions());

    // Get available qualities
    const formats = ytdl.filterFormats(info.formats, "videoandaudio");
    const availableQualities = [
      ...new Set(formats.map((f) => f.qualityLabel).filter(Boolean)),
    ] as string[];

    return {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          ?.url || "",
      description: info.videoDetails.description || "",
      views: parseInt(info.videoDetails.viewCount),
      uploadDate: info.videoDetails.uploadDate || "",
      availableQualities,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch YouTube info: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

async function downloadYouTube(
  options: DownloadOptions,
): Promise<DownloadResult> {
  const start = Date.now();
  const info = await ytdl.getInfo(options.url, getYTDLOptions());

  let stream;
  let fileName = sanitizeFileName(info.videoDetails.title);

  if (options.format.type === "audio") {
    // Download audio only
    stream = ytdl(options.url, {
      ...getYTDLOptions(),
      quality: "highestaudio",
      filter: "audioonly",
    });

    fileName = `${fileName}${options.format.ext}`;
  } else {
    // Download video with audio
    const videoQuality = options.quality as VideoQuality;
    const qualityLabel = videoQuality?.label || "highest";

    stream = ytdl(options.url, {
      ...getYTDLOptions(),
      quality: qualityLabel.includes("1080p")
        ? "highestvideo"
        : qualityLabel.includes("720p")
          ? "highest"
          : "lowest",
      filter: "videoandaudio",
    });

    fileName = `${fileName}${options.format.ext}`;
  }

  // Collect stream data into buffer
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve({
        buffer,
        fileName,
        format: options.format.id,
        size: buffer.length,
        duration: parseInt(info.videoDetails.lengthSeconds),
        processingTime: Date.now() - start,
        metadata: {
          title: info.videoDetails.title,
          author: info.videoDetails.author.name,
          thumbnail:
            info.videoDetails.thumbnails[
              info.videoDetails.thumbnails.length - 1
            ]?.url,
          description: info.videoDetails.description || undefined,
          views: parseInt(info.videoDetails.viewCount),
          uploadDate: info.videoDetails.uploadDate,
        },
      });
    });
    stream.on("error", reject);
  });
}

/**
 * Instagram download implementation
 */
async function getInstagramInfo(_url: string): Promise<VideoInfo> {
  throw new Error("Instagram info fallback is no longer used");
}

async function downloadInstagram(
  _options: DownloadOptions,
): Promise<DownloadResult> {
  throw new Error("Instagram download fallback is no longer used");
}

/**
 * TikTok download implementation
 */
async function getTikTokInfo(_url: string): Promise<VideoInfo> {
  throw new Error("TikTok info fetching requires tiktok-scraper or API");
}

async function downloadTikTok(
  _options: DownloadOptions,
): Promise<DownloadResult> {
  throw new Error("TikTok download requires tiktok-scraper or API");
}

/**
 * Twitter/X download implementation
 */
async function getTwitterInfo(_url: string): Promise<VideoInfo> {
  throw new Error("Twitter info fetching requires twitter-api-v2 or scraping");
}

async function downloadTwitter(
  _options: DownloadOptions,
): Promise<DownloadResult> {
  throw new Error("Twitter download requires twitter-api-v2 or scraping");
}

/**
 * Vimeo download implementation
 */
async function getVimeoInfo(_url: string): Promise<VideoInfo> {
  throw new Error("Vimeo info fetching requires vimeo API");
}

async function downloadVimeo(
  _options: DownloadOptions,
): Promise<DownloadResult> {
  throw new Error("Vimeo download requires vimeo API");
}

/**
 * Sanitize filename for safe file system storage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .substring(0, 200); // Limit length
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
