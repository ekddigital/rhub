import "server-only";

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { nanoid } from "nanoid";
import {
  FFMPEG_REQUIRED_MESSAGE,
  ffmpegLocationArgs,
  resolveFfmpegPath,
} from "./ffmpeg";
import { buildYtDlpSpawnEnv, resolveYtDlpPath } from "./yt-dlp-binary";
import type { AudioQuality, DownloadFormat, VideoQuality } from "./types";

/** Default 500 MB — override with YT_DLP_MAX_BYTES */
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;
const DEFAULT_INFO_TIMEOUT_MS = 60_000;
const DEFAULT_FB_INFO_TIMEOUT_MS = 90_000;
const DEFAULT_SOCKET_TIMEOUT_SEC = 15;
const FB_SHARE_RESOLVE_MS = 15_000;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 180_000;

export type YtDlpInfo = {
  id?: string;
  url?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string }>;
  description?: string;
  view_count?: number;
  upload_date?: string;
  _type?: string;
  entries?: YtDlpInfo[];
  formats?: Array<{
    format_id?: string;
    ext?: string;
    format_note?: string;
    height?: number;
    width?: number;
    fps?: number;
    vcodec?: string;
    acodec?: string;
    filesize?: number;
    filesize_approx?: number;
    tbr?: number;
    protocol?: string;
    url?: string;
    resolution?: string;
  }>;
};

export interface YtDlpVideoInfo {
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  description: string;
  views: number;
  uploadDate: string;
  availableQualities: string[];
}

export interface YtDlpDownloadInput {
  url: string;
  format: DownloadFormat;
  quality?: VideoQuality | AudioQuality;
  /** Direct yt-dlp format selector (session-based downloads) */
  ytdlpSelector?: string;
  /** Override file extension e.g. `.mp4` */
  outputExt?: string;
}

export interface YtDlpDownloadResult {
  buffer: Buffer;
  fileName: string;
  format: string;
  size: number;
  duration?: number;
  metadata: {
    title?: string;
    author?: string;
    thumbnail?: string;
    description?: string;
    views?: number;
    uploadDate?: string;
  };
}

const FB_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

function extractorArgsForUrl(url: string): string[] {
  const host = new URL(url).hostname.toLowerCase();

  if (
    host.endsWith("x.com") ||
    host.endsWith("twitter.com") ||
    host === "t.co"
  ) {
    return ["--extractor-args", "twitter:api=graphql,legacy,syndication"];
  }

  if (
    host.includes("facebook.com") ||
    host === "fb.watch" ||
    host === "m.facebook.com"
  ) {
    return ["--extractor-args", "facebook:webpage_variant=regular"];
  }

  return [];
}

function socketTimeoutSec(): number {
  const raw = process.env.YT_DLP_SOCKET_TIMEOUT_SEC?.trim();
  if (!raw) return DEFAULT_SOCKET_TIMEOUT_SEC;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SOCKET_TIMEOUT_SEC;
}

function socketTimeoutSecForUrl(url: string): number {
  if (!isFacebookUrl(url)) return socketTimeoutSec();

  const fbRaw = process.env.YT_DLP_FB_SOCKET_TIMEOUT_SEC?.trim();
  if (fbRaw) {
    const parsed = Number.parseInt(fbRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 30;
}

function isYouTubeUrl(url: string): boolean {
  const host = new URL(url).hostname.toLowerCase();
  return (
    host.includes("youtube.com") ||
    host === "youtu.be" ||
    host === "www.youtu.be"
  );
}

function isYouTubePlaylistUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!isYouTubeUrl(url)) return false;
    if (parsed.searchParams.has("list")) return true;
    return /^\/playlist(?:\/|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** Normalize Shorts/live paths to watch?v= for more reliable yt-dlp extraction. */
function normalizeYouTubeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!isYouTubeUrl(url)) return url;

    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch?.[1]) {
      return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
    }

    const liveMatch = parsed.pathname.match(/^\/live\/([a-zA-Z0-9_-]{11})/);
    if (liveMatch?.[1]) {
      return `https://www.youtube.com/watch?v=${liveMatch[1]}`;
    }
  } catch {
    // keep original url
  }
  return url;
}

function isFacebookUrl(url: string): boolean {
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

function resolveCookiesFile(): string | undefined {
  return (
    process.env.YT_DLP_COOKIES_FILE?.trim() ||
    process.env.YTDLP_COOKIES?.trim() ||
    process.env.YT_DLP_COOKIES?.trim() ||
    undefined
  );
}

/** Canonical reel/watch URL after redirect (drops tracking query params). */
function canonicalizeFacebookMediaUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const reel = parsed.pathname.match(/\/reels?\/(\d+)/i);
    if (reel?.[1]) {
      return `https://www.facebook.com/reel/${reel[1]}/`;
    }
    const watchId = parsed.searchParams.get("v");
    if (watchId && /\/watch/i.test(parsed.pathname)) {
      return `https://www.facebook.com/watch?v=${watchId}`;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Best-effort redirect resolution for Facebook share links before yt-dlp.
 */
async function maybeNormalizeMediaUrl(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname.toLowerCase();
  const isFacebook =
    host.includes("facebook.com") ||
    host === "fb.watch" ||
    host === "m.facebook.com";

  if (!isFacebook || !parsed.pathname.includes("/share/")) {
    return url;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(FB_SHARE_RESOLVE_MS),
      headers: {
        "User-Agent": FB_BROWSER_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (response.url && response.url !== url) {
      return sanitizeMediaUrl(canonicalizeFacebookMediaUrl(response.url));
    }

    const html = await response.text();
    const directUrlPatterns = [
      /https?:\/\/(?:www\.)?facebook\.com\/(?:watch\/?\?v=\d+|reels?\/\d+)/i,
      /https?:\\\/\\\/(?:www\\\.)?facebook\\\.com\\\/(?:watch\\\/?\\\?v=\d+|reels?\\\/\d+)/i,
    ];

    for (const pattern of directUrlPatterns) {
      const match = html.match(pattern)?.[0];
      if (!match) continue;

      const normalizedMatch = match
        .replace(/\\\//g, "/")
        .replace(/\\u0025/g, "%")
        .replace(/\\u0026/g, "&");

      try {
        return sanitizeMediaUrl(canonicalizeFacebookMediaUrl(normalizedMatch));
      } catch {
        // continue to fallback
      }
    }
  } catch {
    // yt-dlp follows redirects during extraction
  }

  return url;
}

function maxBytes(): number {
  const raw = process.env.YT_DLP_MAX_BYTES?.trim();
  if (!raw) return DEFAULT_MAX_BYTES;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_BYTES;
}

function infoTimeoutMs(): number {
  const raw = process.env.YT_DLP_INFO_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_INFO_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_INFO_TIMEOUT_MS;
}

function infoTimeoutMsForUrl(url: string): number {
  const base = infoTimeoutMs();
  if (!isFacebookUrl(url)) return base;

  const fbRaw = process.env.YT_DLP_FB_INFO_TIMEOUT_MS?.trim();
  if (fbRaw) {
    const parsed = Number.parseInt(fbRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.max(base, parsed);
    }
  }
  return Math.max(base, DEFAULT_FB_INFO_TIMEOUT_MS);
}

function downloadTimeoutMs(): number {
  const raw = process.env.YT_DLP_DOWNLOAD_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_DOWNLOAD_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DOWNLOAD_TIMEOUT_MS;
}

/**
 * Normalize and validate a user-supplied media URL (http/https only).
 */
export function sanitizeMediaUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  return parsed.toString();
}

export { resolveYtDlpPath } from "./yt-dlp-binary";
export type { DownloadHubToolHealth } from "./yt-dlp-binary";
export {
  getDownloadHubToolHealth,
  isYtDlpUnavailableMessage,
} from "./yt-dlp-binary";
export {
  classifyYtDlpError,
  httpStatusForYtDlpError,
  mapYtDlpError,
} from "./yt-dlp-errors";
export type {
  YtDlpErrorContext,
  YtDlpErrorKind,
  YtDlpErrorPhase,
} from "./yt-dlp-errors";

export {
  FFMPEG_REQUIRED_MESSAGE,
  FFMPEG_INSTALL_HINT_DEV,
  YT_DLP_INSTALL_HINT_DEV,
  YT_DLP_MISSING_CODE,
  YT_DLP_NOT_INSTALLED_MESSAGE,
} from "./constants";

function runYtDlp(
  args: string[],
  options: {
    timeoutMs: number;
    maxBytes?: number;
    timeoutMessage?: string;
    phase?: "info" | "download";
  },
): Promise<{ stdout: Buffer; stderr: string }> {
  return new Promise(async (resolve, reject) => {
    let binaryPath: string;

    try {
      binaryPath = await resolveYtDlpPath();
    } catch (error) {
      reject(
        new Error(
          error instanceof Error ? error.message : "Unknown setup error",
        ),
      );
      return;
    }

    const child = spawn(binaryPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: buildYtDlpSpawnEnv(),
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let totalBytes = 0;
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
      reject(
        new Error(
          options.timeoutMessage ??
            (options.phase === "info"
              ? "Metadata fetch timed out"
              : "Download timed out"),
        ),
      );
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      const limit = options.maxBytes ?? maxBytes();
      if (totalBytes > limit) {
        killed = true;
        child.kill("SIGKILL");
        reject(
          new Error(
            `File exceeds maximum size (${Math.round(limit / (1024 * 1024))} MB)`,
          ),
        );
        return;
      }
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new Error(
          `yt-dlp failed to start: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ),
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();

      if (killed) {
        return;
      }

      if (code !== 0) {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
        return;
      }

      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr,
      });
    });
  });
}

function runYtDlpProcess(
  args: string[],
  options: {
    timeoutMs: number;
    timeoutMessage?: string;
    phase?: "info" | "download";
  },
): Promise<{ stderr: string }> {
  return new Promise(async (resolve, reject) => {
    let binaryPath: string;

    try {
      binaryPath = await resolveYtDlpPath();
    } catch (error) {
      reject(
        new Error(
          error instanceof Error ? error.message : "Unknown setup error",
        ),
      );
      return;
    }

    const child = spawn(binaryPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
      env: buildYtDlpSpawnEnv(),
    });

    const stderrChunks: Buffer[] = [];
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
      reject(
        new Error(
          options.timeoutMessage ??
            (options.phase === "info"
              ? "Metadata fetch timed out"
              : "Download timed out"),
        ),
      );
    }, options.timeoutMs);

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new Error(
          `yt-dlp failed to start: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ),
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();

      if (killed) {
        return;
      }

      if (code !== 0) {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
        return;
      }

      resolve({ stderr });
    });
  });
}

function isMp3Buffer(buffer: Buffer): boolean {
  if (buffer.length < 3) return false;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)
    return true;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

async function downloadMp3ToBuffer(
  url: string,
  ytdlpSelector: string,
  title: string,
  meta: YtDlpVideoInfo | null,
): Promise<YtDlpDownloadResult> {
  const ffmpegPath = await resolveFfmpegPath();
  if (!ffmpegPath) {
    throw new Error(FFMPEG_REQUIRED_MESSAGE);
  }

  const jobDir = path.join(os.tmpdir(), "rhub-download-hub", "jobs", nanoid());
  await mkdir(jobDir, { recursive: true });
  const outputTemplate = path.join(jobDir, "output.%(ext)s");

  try {
    const args = [
      "--no-part",
      "-f",
      ytdlpSelector,
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      ...ffmpegLocationArgs(ffmpegPath),
      "-o",
      outputTemplate,
      ...baseYtDlpArgs(url),
    ];

    await runYtDlpProcess(args, {
      timeoutMs: downloadTimeoutMs(),
      phase: "download",
    });

    const files = await readdir(jobDir);
    const mp3File = files.find((file) => file.toLowerCase().endsWith(".mp3"));
    if (!mp3File) {
      throw new Error(
        "MP3 conversion failed — no MP3 file was produced. Ensure ffmpeg is installed.",
      );
    }

    const filePath = path.join(jobDir, mp3File);
    const buffer = await readFile(filePath);
    const limit = maxBytes();

    if (buffer.length > limit) {
      throw new Error(
        `File exceeds maximum size (${Math.round(limit / (1024 * 1024))} MB)`,
      );
    }

    if (!isMp3Buffer(buffer)) {
      throw new Error(
        "MP3 conversion failed — output is not a valid MP3 file. Ensure ffmpeg is installed.",
      );
    }

    return {
      buffer,
      fileName: `${sanitizeFileName(title)}.mp3`,
      format: "mp3",
      size: buffer.length,
      duration: meta?.duration,
      metadata: {
        title,
        author: meta?.author,
        thumbnail: meta?.thumbnail,
        description: meta?.description || undefined,
        views: meta?.views,
        uploadDate: meta?.uploadDate,
      },
    };
  } finally {
    await rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function formatUploadDate(raw?: string): string {
  if (!raw) return "";
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

export function mapYtDlpInfo(info: YtDlpInfo): YtDlpVideoInfo {
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

export function buildYtDlpFormatSelector(input: YtDlpDownloadInput): string {
  if (input.format.type === "audio") {
    if (input.format.id === "m4a") {
      return "bestaudio[ext=m4a]/bestaudio";
    }
    if (input.format.id === "mp3") {
      return "bestaudio[ext=m4a]/bestaudio/best";
    }
    return "bestaudio";
  }

  const height = parseVideoHeight(input.quality);
  const ext = input.format.id === "webm" ? "webm" : "mp4";

  if (height) {
    return `best[ext=${ext}][height<=${height}]/best[height<=${height}][ext=${ext}]/best[height<=${height}]/best[ext=${ext}]/best`;
  }

  return `best[ext=${ext}]/best`;
}

function baseYtDlpArgs(
  url: string,
  options?: { allowPlaylist?: boolean },
): string[] {
  const args = [
    "--ignore-config",
    "--no-warnings",
    "--socket-timeout",
    String(socketTimeoutSecForUrl(url)),
    "--retries",
    "2",
    "--fragment-retries",
    "2",
    "--extractor-retries",
    "2",
    ...extractorArgsForUrl(url),
  ];

  if (!options?.allowPlaylist) {
    args.push("--no-playlist");
  }

  args.push(url);

  const cookiesFile = resolveCookiesFile();
  if (cookiesFile) {
    args.unshift("--cookies", cookiesFile);
  }

  return args;
}

async function dumpYtDlpJson(
  url: string,
  extraArgs: string[] = [],
): Promise<YtDlpInfo> {
  const safeUrl = sanitizeMediaUrl(url);
  const infoArgs = ["--dump-single-json", ...extraArgs];
  // yt-dlp Facebook extractor can fail with --skip-download; other platforms benefit.
  if (!isFacebookUrl(safeUrl)) {
    infoArgs.push("--skip-download");
  }

  const { stdout } = await runYtDlp(
    [...infoArgs, ...baseYtDlpArgs(safeUrl, { allowPlaylist: true })],
    {
      timeoutMs: infoTimeoutMsForUrl(safeUrl),
      phase: "info",
      timeoutMessage: "Metadata fetch timed out",
    },
  );

  try {
    return JSON.parse(stdout.toString("utf8")) as YtDlpInfo;
  } catch {
    throw new Error("yt-dlp returned invalid metadata");
  }
}

export interface YtDlpFullMetadata extends YtDlpVideoInfo {
  raw: YtDlpInfo;
  isPlaylist: boolean;
  playlistTitle?: string;
  entries: Array<{
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    url: string;
    uploader?: string;
  }>;
}

export async function extractFullWithYtDlp(
  url: string,
): Promise<YtDlpFullMetadata> {
  const safeUrl = sanitizeMediaUrl(url);
  let normalizedUrl = await maybeNormalizeMediaUrl(safeUrl);
  if (isYouTubeUrl(normalizedUrl)) {
    normalizedUrl = normalizeYouTubeUrl(normalizedUrl);
  }

  // YouTube-only: flat probe for playlist URLs (skip Shorts/single videos — saves a round trip)
  if (isYouTubeUrl(normalizedUrl) && isYouTubePlaylistUrl(normalizedUrl)) {
    const flatInfo = await dumpYtDlpJson(normalizedUrl, ["--flat-playlist"]);
    const isPlaylist =
      flatInfo._type === "playlist" ||
      (Array.isArray(flatInfo.entries) && flatInfo.entries.length > 1);

    if (isPlaylist && flatInfo.entries?.length) {
      return mapPlaylistMetadata(normalizedUrl, flatInfo);
    }
  }

  const info = await dumpYtDlpJson(normalizedUrl);
  const mapped = mapYtDlpInfo(info);

  return {
    ...mapped,
    raw: info,
    isPlaylist: false,
    entries: [],
  };
}

function mapPlaylistMetadata(
  safeUrl: string,
  info: YtDlpInfo,
): YtDlpFullMetadata {
  const entries = (info.entries ?? []).map((entry, index) => {
    const entryUrl =
      entry.url ||
      (entry.id && safeUrl.includes("youtube")
        ? `https://www.youtube.com/watch?v=${entry.id}`
        : safeUrl);

    return {
      id: entry.id || String(index),
      title: entry.title || `Video ${index + 1}`,
      thumbnail:
        entry.thumbnail ||
        entry.thumbnails?.[entry.thumbnails.length - 1]?.url ||
        "",
      duration: entry.duration || 0,
      url: entryUrl,
      uploader: entry.uploader || entry.channel,
    };
  });

  return {
    ...mapYtDlpInfo(info),
    raw: info,
    isPlaylist: true,
    playlistTitle: info.title,
    entries,
  };
}

export async function extractWithYtDlp(url: string): Promise<YtDlpVideoInfo> {
  const full = await extractFullWithYtDlp(url);
  return full;
}

export async function downloadWithSelector(
  url: string,
  ytdlpSelector: string,
  outputExt: string,
  title?: string,
): Promise<YtDlpDownloadResult> {
  const safeUrl = sanitizeMediaUrl(url);
  const meta = title ? null : await extractWithYtDlp(safeUrl);
  const resolvedTitle = title || meta?.title || "download";
  const ext = outputExt.startsWith(".") ? outputExt : `.${outputExt}`;

  if (ext === ".mp3") {
    return downloadMp3ToBuffer(safeUrl, ytdlpSelector, resolvedTitle, meta);
  }

  const args = [
    "--no-part",
    "-f",
    ytdlpSelector,
    "-o",
    "-",
    ...baseYtDlpArgs(safeUrl),
  ];

  const { stdout } = await runYtDlp(args, {
    timeoutMs: downloadTimeoutMs(),
    maxBytes: maxBytes(),
    phase: "download",
  });

  if (!stdout.length) {
    throw new Error("yt-dlp returned an empty download stream");
  }

  return {
    buffer: stdout,
    fileName: `${sanitizeFileName(resolvedTitle)}${ext}`,
    format: ext.replace(".", ""),
    size: stdout.length,
    duration: meta?.duration,
    metadata: {
      title: resolvedTitle,
      author: meta?.author,
      thumbnail: meta?.thumbnail,
      description: meta?.description || undefined,
      views: meta?.views,
      uploadDate: meta?.uploadDate,
    },
  };
}

export async function downloadWithYtDlp(
  input: YtDlpDownloadInput,
): Promise<YtDlpDownloadResult> {
  const safeUrl = sanitizeMediaUrl(input.url);

  if (input.ytdlpSelector) {
    return downloadWithSelector(
      safeUrl,
      input.ytdlpSelector,
      input.outputExt || input.format.ext,
    );
  }

  const info = await extractWithYtDlp(safeUrl);
  const formatSelector = buildYtDlpFormatSelector(input);

  return downloadWithSelector(
    safeUrl,
    formatSelector,
    input.format.ext,
    info.title,
  );
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 200);
}
