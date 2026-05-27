import "server-only";

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  FFMPEG_INSTALL_HINT_DEV,
  FFMPEG_INSTALL_HINT_LINUX,
  FFMPEG_INSTALL_HINT_TTYD,
  YT_DLP_INSTALL_HINT_DEV,
  YT_DLP_INSTALL_HINT_LINUX,
  YT_DLP_INSTALL_HINT_TTYD,
  YT_DLP_NOT_INSTALLED_MESSAGE,
} from "./constants";
import { isFfmpegAvailable, resolveFfmpegPath } from "./ffmpeg";
import { isTtydConfigured } from "./ttyd-config";

const VERIFY_TIMEOUT_MS = 15_000;

const SYSTEM_CANDIDATE_PATHS: string[] =
  process.platform === "win32"
    ? [
        "C:\\Program Files\\yt-dlp\\yt-dlp.exe",
        path.join(
          process.env.LOCALAPPDATA ?? "",
          "Programs",
          "yt-dlp",
          "yt-dlp.exe",
        ),
      ]
    : [
        path.join(os.homedir(), "bin", "yt-dlp"),
        "/opt/homebrew/bin/yt-dlp",
        "/usr/local/bin/yt-dlp",
        "/usr/bin/yt-dlp",
      ];

export const LOCAL_YT_DLP_PATH = path.join(
  os.tmpdir(),
  "rhub-download-hub",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

let cachedYtDlpPath: string | null = null;
let cachedYtDlpAvailable: boolean | null = null;
let resolvePromise: Promise<string> | null = null;

export type InstallHintTarget = "ttyd" | "linux" | "dev";

export type DownloadHubToolHealth = {
  ytDlp: boolean;
  ffmpeg: boolean;
  paths: {
    ytDlp?: string;
    ffmpeg?: string;
  };
  hints: {
    ytDlp?: string;
    ffmpeg?: string;
  };
  /** Which install-hint set the server selected (dev brew vs Linux VPS vs TTYD). */
  hintTarget: InstallHintTarget;
  ttydConfigured?: boolean;
  terminalUrl?: string;
};

function installHintTarget(): InstallHintTarget {
  if (isTtydConfigured()) return "ttyd";
  if (process.platform === "linux") return "linux";
  return "dev";
}

function installHints(): {
  ytDlp: string;
  ffmpeg: string;
  target: InstallHintTarget;
} {
  const target = installHintTarget();

  if (target === "ttyd") {
    return {
      target,
      ytDlp: YT_DLP_INSTALL_HINT_TTYD,
      ffmpeg: FFMPEG_INSTALL_HINT_TTYD,
    };
  }

  if (target === "linux") {
    return {
      target,
      ytDlp: YT_DLP_INSTALL_HINT_LINUX,
      ffmpeg: FFMPEG_INSTALL_HINT_LINUX,
    };
  }

  return {
    target,
    ytDlp: YT_DLP_INSTALL_HINT_DEV,
    ffmpeg: FFMPEG_INSTALL_HINT_DEV,
  };
}

export function resetYtDlpPathCache(): void {
  cachedYtDlpPath = null;
  cachedYtDlpAvailable = null;
  resolvePromise = null;
}

function ytDlpBinFromEnv(): string | undefined {
  return (
    process.env.YT_DLP_BIN?.trim() || process.env.YTDLP_BIN?.trim() || undefined
  );
}

/** PATH used when spawning yt-dlp (helps python-script builds find python3). */
export function buildYtDlpSpawnEnv(): NodeJS.ProcessEnv {
  const defaults =
    process.platform === "win32"
      ? []
      : [
          path.join(os.homedir(), "bin"),
          "/opt/homebrew/bin",
          "/usr/local/bin",
          "/usr/bin",
          "/bin",
        ];

  const parts = [
    ...(process.env.PATH?.split(path.delimiter) ?? []),
    ...defaults,
  ];

  const seen = new Set<string>();
  const mergedPath = parts
    .filter((segment) => {
      if (!segment || seen.has(segment)) return false;
      seen.add(segment);
      return true;
    })
    .join(path.delimiter);

  return { ...process.env, PATH: mergedPath };
}

export function isYtDlpUnavailableMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(YT_DLP_NOT_INSTALLED_MESSAGE.toLowerCase()) ||
    lower.includes("yt-dlp is not available") ||
    lower.includes("yt_dlp_missing") ||
    (lower.includes("yt-dlp") &&
      (lower.includes("not executable") ||
        lower.includes("failed to start") ||
        lower.includes("enoent")))
  );
}

function verifyYtDlpBinary(binaryPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(binaryPath, ["--version"], {
      stdio: "ignore",
      env: buildYtDlpSpawnEnv(),
    });

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(false);
    }, VERIFY_TIMEOUT_MS);

    child.on("error", () => finish(false));
    child.on("close", (code) => finish(code === 0));
  });
}

async function pathIsUsable(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return verifyYtDlpBinary(candidate);
  } catch {
    return false;
  }
}

async function resolveYtDlpPathInternal(): Promise<string> {
  const candidates: string[] = [];

  const envBin = ytDlpBinFromEnv();
  if (envBin) {
    candidates.push(envBin);
  }

  candidates.push(...SYSTEM_CANDIDATE_PATHS);

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = path.resolve(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    if (await pathIsUsable(normalized)) {
      return normalized;
    }
  }

  if (isTtydConfigured()) {
    throw new Error(
      `${YT_DLP_NOT_INSTALLED_MESSAGE} ${YT_DLP_INSTALL_HINT_TTYD}`,
    );
  }

  throw new Error(YT_DLP_NOT_INSTALLED_MESSAGE);
}

export async function resolveYtDlpPath(): Promise<string> {
  if (cachedYtDlpPath && cachedYtDlpAvailable) {
    return cachedYtDlpPath;
  }

  if (!resolvePromise) {
    resolvePromise = (async () => {
      const resolved = await resolveYtDlpPathInternal();
      cachedYtDlpPath = resolved;
      cachedYtDlpAvailable = true;
      return resolved;
    })();
  }

  try {
    return await resolvePromise;
  } catch (error) {
    cachedYtDlpPath = null;
    cachedYtDlpAvailable = false;
    throw error;
  } finally {
    resolvePromise = null;
  }
}

export async function getDownloadHubToolHealth(): Promise<DownloadHubToolHealth> {
  let ytDlpPath: string | undefined;
  let ytDlp = false;

  try {
    ytDlpPath = await resolveYtDlpPath();
    ytDlp = true;
  } catch {
    ytDlp = false;
  }

  const ffmpeg = await isFfmpegAvailable();
  const ffmpegPath = ffmpeg
    ? ((await resolveFfmpegPath()) ?? undefined)
    : undefined;
  const hints = installHints();
  const ttydConfigured = isTtydConfigured();
  const terminalUrl =
    process.env.NEXT_PUBLIC_SERVER_TERMINAL_URL?.trim() ||
    (ttydConfigured ? process.env.TTYD_BASE_URL?.trim() : undefined);

  return {
    ytDlp,
    ffmpeg,
    paths: {
      ytDlp: ytDlpPath,
      ffmpeg: ffmpegPath,
    },
    hints: {
      ytDlp: ytDlp ? undefined : hints.ytDlp,
      ffmpeg: ffmpeg ? undefined : hints.ffmpeg,
    },
    hintTarget: hints.target,
    ttydConfigured,
    terminalUrl,
  };
}
