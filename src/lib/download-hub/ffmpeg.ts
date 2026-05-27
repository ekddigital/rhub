import "server-only";

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FFMPEG_REQUIRED_MESSAGE } from "./constants";

export { FFMPEG_REQUIRED_MESSAGE, FFMPEG_INSTALL_HINT_DEV } from "./constants";

let cachedAvailable: boolean | null = null;
let cachedPath: string | null = null;

function checkExecutable(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

/**
 * Resolve ffmpeg binary — `FFMPEG_BIN` env, then `ffmpeg` on PATH.
 */
export async function resolveFfmpegPath(): Promise<string | null> {
  if (cachedPath !== null) {
    return cachedAvailable ? cachedPath : null;
  }

  const envPath = process.env.FFMPEG_BIN?.trim();
  if (envPath) {
    try {
      await access(envPath);
      cachedPath = envPath;
      cachedAvailable = true;
      return envPath;
    } catch {
      cachedPath = null;
      cachedAvailable = false;
      return null;
    }
  }

  const candidates = [
    path.join(os.homedir(), "bin", "ffmpeg"),
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
    "ffmpeg",
  ];

  for (const candidate of candidates) {
    if (await checkExecutable(candidate, ["-version"])) {
      cachedPath = candidate;
      cachedAvailable = true;
      return candidate;
    }
  }

  cachedPath = null;
  cachedAvailable = false;
  return null;
}

export async function isFfmpegAvailable(): Promise<boolean> {
  if (cachedAvailable !== null) {
    return cachedAvailable;
  }
  return Boolean(await resolveFfmpegPath());
}

/** yt-dlp `--ffmpeg-location` expects the directory containing the binary */
export function ffmpegLocationArgs(ffmpegPath: string): string[] {
  if (ffmpegPath === "ffmpeg") {
    return [];
  }
  return ["--ffmpeg-location", path.dirname(ffmpegPath)];
}

export function mapFfmpegError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("ffmpeg") &&
    (lower.includes("not found") ||
      lower.includes("not installed") ||
      lower.includes("no such file") ||
      lower.includes("postprocessing") ||
      lower.includes("executable"))
  ) {
    return FFMPEG_REQUIRED_MESSAGE;
  }
  return message;
}
