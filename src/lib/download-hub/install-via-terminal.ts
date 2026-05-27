import "server-only";

import { executeRemoteCommand } from "@/lib/terminal/client";
import { isTtydConfigured } from "./ttyd-config";
import type { DownloadHubToolHealth } from "./yt-dlp-binary";
import {
  getDownloadHubToolHealth,
  resetYtDlpPathCache,
} from "./yt-dlp-binary";

const REMOTE_CHECK_TIMEOUT_MS = 30_000;
const REMOTE_INSTALL_TIMEOUT_MS = 540_000;

export type RemoteDepsCheck = {
  ytDlp: boolean;
  ffmpeg: boolean;
  paths: {
    ytDlp?: string;
    ffmpeg?: string;
  };
  output: string;
};

export type TerminalInstallStep = {
  name: string;
  success: boolean;
  skipped?: boolean;
  output: string;
  error?: string;
};

export type EnsureDownloadHubDepsResult = {
  /** Remote install completed with both tools on the TTYD host. */
  success: boolean;
  remote: RemoteDepsCheck;
  local: DownloadHubToolHealth;
  steps: TerminalInstallStep[];
  readyForDownloads: boolean;
  remoteInstallOk: boolean;
  /** True when remote has tools but local health still fails (host mismatch). */
  hostMismatchWarning?: string;
  envSuggestions?: {
    YT_DLP_BIN?: string;
    FFMPEG_BIN?: string;
  };
  envHint?: string;
  error?: string;
};

function remoteEnvSuggestions(
  remote: RemoteDepsCheck,
): EnsureDownloadHubDepsResult["envSuggestions"] {
  if (!remote.ytDlp && !remote.ffmpeg) return undefined;
  return {
    YT_DLP_BIN: remote.paths.ytDlp,
    FFMPEG_BIN: remote.paths.ffmpeg,
  };
}

function remoteEnvHint(
  envSuggestions: EnsureDownloadHubDepsResult["envSuggestions"],
): string | undefined {
  if (!envSuggestions) return undefined;
  const lines: string[] = [];
  if (envSuggestions.YT_DLP_BIN) {
    lines.push(`YT_DLP_BIN=${envSuggestions.YT_DLP_BIN}`);
  }
  if (envSuggestions.FFMPEG_BIN) {
    lines.push(`FFMPEG_BIN=${envSuggestions.FFMPEG_BIN}`);
  }
  if (lines.length === 0) return undefined;
  return `On the rhub host (.env): ${lines.join(" ")}`;
}

/**
 * Single-line bash via TTYD — multi-line scripts stall in the interactive shell
 * and never finish the ffmpeg branch (END_TEST wrapper gets swallowed).
 */
function remoteDepsCheckCommand(): string {
  return (
    'bash -lc \'export PATH="$HOME/bin:/usr/local/bin:/usr/bin:$PATH"; ' +
    'if command -v yt-dlp >/dev/null 2>&1; then echo "YT_DLP_PATH=$(command -v yt-dlp)"; ' +
    'elif [ -x "$HOME/bin/yt-dlp" ]; then echo "YT_DLP_PATH=$HOME/bin/yt-dlp"; ' +
    'elif [ -x /home/hetawk/bin/yt-dlp ]; then echo "YT_DLP_PATH=/home/hetawk/bin/yt-dlp"; ' +
    'else echo YT_DLP_MISSING; fi; ' +
    'if command -v ffmpeg >/dev/null 2>&1; then echo "FFMPEG_PATH=$(command -v ffmpeg)"; ' +
    'elif [ -x /usr/bin/ffmpeg ]; then echo FFMPEG_PATH=/usr/bin/ffmpeg; ' +
    'else echo FFMPEG_MISSING; fi\''
  );
}

/**
 * Check yt-dlp/ffmpeg on the TTYD target host (not necessarily the Node process host).
 */
export async function checkRemoteDownloadHubDeps(): Promise<RemoteDepsCheck> {
  const result = await executeRemoteCommand({
    command: remoteDepsCheckCommand(),
    timeout: REMOTE_CHECK_TIMEOUT_MS,
    retries: 1,
  });

  const output = result.output ?? "";
  const ytDlpPath = output.match(/^YT_DLP_PATH=(.+)$/m)?.[1]?.trim();
  const ffmpegPath = output.match(/^FFMPEG_PATH=(.+)$/m)?.[1]?.trim();

  return {
    ytDlp: Boolean(ytDlpPath) && !output.includes("YT_DLP_MISSING"),
    ffmpeg: Boolean(ffmpegPath) && !output.includes("FFMPEG_MISSING"),
    paths: {
      ytDlp: ytDlpPath,
      ffmpeg: ffmpegPath,
    },
    output,
  };
}

async function installRemoteYtDlp(): Promise<TerminalInstallStep> {
  const check = await checkRemoteDownloadHubDeps();
  if (check.ytDlp) {
    return {
      name: "yt-dlp",
      success: true,
      skipped: true,
      output: check.paths.ytDlp
        ? `Already installed at ${check.paths.ytDlp}`
        : "Already installed",
    };
  }

  const result = await executeRemoteCommand({
    command:
      'bash -lc \'set -e; export PATH="$HOME/bin:$PATH"; mkdir -p "$HOME/bin"; ' +
      'curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "$HOME/bin/yt-dlp"; ' +
      'chmod +x "$HOME/bin/yt-dlp"; "$HOME/bin/yt-dlp" --version | head -1\'',
    timeout: REMOTE_INSTALL_TIMEOUT_MS,
    retries: 0,
  });

  return {
    name: "yt-dlp",
    success: result.success,
    output: result.output,
    error: result.error,
  };
}

async function installRemoteFfmpeg(): Promise<TerminalInstallStep> {
  const check = await checkRemoteDownloadHubDeps();
  if (check.ffmpeg) {
    return {
      name: "ffmpeg",
      success: true,
      skipped: true,
      output: check.paths.ffmpeg
        ? `Already installed at ${check.paths.ffmpeg}`
        : "Already installed",
    };
  }

  const result = await executeRemoteCommand({
    command:
      'bash -lc \'set -e; export DEBIAN_FRONTEND=noninteractive; ' +
      'sudo apt-get update -qq; sudo apt-get install -y -qq ffmpeg; ffmpeg -version | head -1\'',
    timeout: REMOTE_INSTALL_TIMEOUT_MS,
    retries: 0,
  });

  return {
    name: "ffmpeg",
    success: result.success,
    output: result.output,
    error: result.error,
  };
}

export function getHostMismatchWarning(
  remote: RemoteDepsCheck,
  local: DownloadHubToolHealth,
): string | undefined {
  if (!isTtydConfigured()) return undefined;

  const remoteOk = remote.ytDlp && remote.ffmpeg;
  const localOk = local.ytDlp && local.ffmpeg;

  if (remoteOk && !localOk) {
    return (
      "yt-dlp and ffmpeg were installed on the TTYD host (the server TTYD_BASE_URL points to), " +
      "but this Next.js process runs elsewhere and cannot spawn those binaries locally. " +
      "Production: run Download Hub on that host (call POST /api/tools/vid/setup from production rhub) " +
      "and set YT_DLP_BIN / FFMPEG_BIN if needed. " +
      "If this page is running on localhost while TTYD targets the VPS, remote install status can be healthy but downloads will remain unavailable in this local runtime."
    );
  }

  if (!remoteOk && localOk) {
    return undefined;
  }

  return undefined;
}

/**
 * Idempotent install of yt-dlp + ffmpeg on the TTYD remote host.
 */
export async function ensureDownloadHubDepsViaTerminal(): Promise<EnsureDownloadHubDepsResult> {
  if (!isTtydConfigured()) {
    const local = await getDownloadHubToolHealth();
    const readyForDownloads = local.ytDlp && local.ffmpeg;
    return {
      success: false,
      remote: {
        ytDlp: false,
        ffmpeg: false,
        paths: {},
        output: "",
      },
      local,
      readyForDownloads,
      remoteInstallOk: false,
      steps: [],
      error:
        "TTYD_BASE_URL and TTYD_KEY must be set to install on the remote VPS. " +
        "See src/lib/download-hub/README.md.",
    };
  }

  const steps: TerminalInstallStep[] = [];

  const ytStep = await installRemoteYtDlp();
  steps.push(ytStep);
  if (!ytStep.success) {
    const local = await getDownloadHubToolHealth();
    const remote = await checkRemoteDownloadHubDeps();
    const remoteInstallOk = remote.ytDlp && remote.ffmpeg;
    return {
      success: false,
      remote,
      local,
      readyForDownloads: local.ytDlp && local.ffmpeg,
      remoteInstallOk,
      steps,
      error: ytStep.error ?? "Failed to install yt-dlp on remote host",
    };
  }

  const ffmpegStep = await installRemoteFfmpeg();
  steps.push(ffmpegStep);
  if (!ffmpegStep.success) {
    const local = await getDownloadHubToolHealth();
    const remote = await checkRemoteDownloadHubDeps();
    const remoteInstallOk = remote.ytDlp && remote.ffmpeg;
    return {
      success: false,
      remote,
      local,
      readyForDownloads: local.ytDlp && local.ffmpeg,
      remoteInstallOk,
      steps,
      error: ffmpegStep.error ?? "Failed to install ffmpeg on remote host",
    };
  }

  resetYtDlpPathCache();
  const remote = await checkRemoteDownloadHubDeps();
  const local = await getDownloadHubToolHealth();
  const remoteInstallOk = remote.ytDlp && remote.ffmpeg;
  const readyForDownloads = local.ytDlp && local.ffmpeg;
  const hostMismatchWarning = getHostMismatchWarning(remote, local);
  const envSuggestions = remoteEnvSuggestions(remote);
  const envHint = remoteEnvHint(envSuggestions);

  return {
    success: remoteInstallOk,
    remote,
    local,
    readyForDownloads,
    remoteInstallOk,
    steps,
    hostMismatchWarning,
    envSuggestions,
    envHint,
    error: remoteInstallOk
      ? undefined
      : "Remote install finished but the TTYD host still reports missing yt-dlp or ffmpeg. Check install output below.",
  };
}

export function isDownloadHubAutoInstallEnabled(): boolean {
  return process.env.DOWNLOAD_HUB_AUTO_INSTALL_VIA_TTYD === "true";
}

export { isTtydConfigured as isTtydTerminalConfigured } from "./ttyd-config";
