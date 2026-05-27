import "server-only";

import { checkRemoteDownloadHubDeps } from "./install-via-terminal";
import { isTtydConfigured } from "./ttyd-config";
import type { DownloadHubToolHealth } from "./yt-dlp-binary";
import { getDownloadHubToolHealth } from "./yt-dlp-binary";

export type DownloadHubDepsSnapshot = {
  ytDlp: boolean;
  ffmpeg: boolean;
  paths: {
    ytDlp?: string;
    ffmpeg?: string;
  };
};

export type DownloadHubHealthResponse = DownloadHubToolHealth & {
  local: DownloadHubDepsSnapshot;
  remote?: DownloadHubDepsSnapshot;
  /** True when this Node process can spawn yt-dlp and ffmpeg (downloads work). */
  readyForDownloads: boolean;
  /** True when TTYD remote host has both tools (install target). */
  remoteInstallOk: boolean;
  statusMessage: string;
  envSuggestions?: {
    YT_DLP_BIN?: string;
    FFMPEG_BIN?: string;
  };
};

function toSnapshot(health: DownloadHubToolHealth): DownloadHubDepsSnapshot {
  return {
    ytDlp: health.ytDlp,
    ffmpeg: health.ffmpeg,
    paths: { ...health.paths },
  };
}

function buildEnvSuggestions(remote?: DownloadHubDepsSnapshot): {
  YT_DLP_BIN?: string;
  FFMPEG_BIN?: string;
} | undefined {
  if (!remote?.ytDlp && !remote?.ffmpeg) return undefined;
  return {
    YT_DLP_BIN: remote.paths.ytDlp,
    FFMPEG_BIN: remote.paths.ffmpeg,
  };
}

export function buildDownloadHubStatusMessage(
  local: DownloadHubDepsSnapshot,
  remote: DownloadHubDepsSnapshot | undefined,
  ttydConfigured: boolean,
): string {
  const localOk = local.ytDlp && local.ffmpeg;
  const remoteOk = remote ? remote.ytDlp && remote.ffmpeg : false;

  if (localOk) {
    return "Download Hub dependencies are available to this Next.js process.";
  }

  if (ttydConfigured && remoteOk) {
    return (
      "Tools are installed on the server (TTYD host). " +
      "Downloads only work when this Next.js process runs on that same host. " +
      "Run rhub on the VPS and set YT_DLP_BIN / FFMPEG_BIN to the paths below if needed."
    );
  }

  if (ttydConfigured && remote && !remoteOk) {
    return (
      "TTYD is configured but the remote host is missing yt-dlp or ffmpeg. " +
      "Use Install on server or POST /api/tools/vid/setup."
    );
  }

  if (ttydConfigured) {
    return "Install yt-dlp and ffmpeg on the TTYD host.";
  }

  return "Install yt-dlp and ffmpeg on this machine to enable downloads.";
}

export async function getDownloadHubHealthResponse(): Promise<DownloadHubHealthResponse> {
  const localHealth = await getDownloadHubToolHealth();
  const local = toSnapshot(localHealth);
  const ttydConfigured = localHealth.ttydConfigured === true;

  let remote: DownloadHubDepsSnapshot | undefined;
  if (ttydConfigured) {
    try {
      const remoteCheck = await checkRemoteDownloadHubDeps();
      remote = {
        ytDlp: remoteCheck.ytDlp,
        ffmpeg: remoteCheck.ffmpeg,
        paths: { ...remoteCheck.paths },
      };
    } catch {
      remote = { ytDlp: false, ffmpeg: false, paths: {} };
    }
  }

  const readyForDownloads = local.ytDlp && local.ffmpeg;
  const remoteInstallOk = remote ? remote.ytDlp && remote.ffmpeg : false;

  return {
    ...localHealth,
    local,
    remote,
    readyForDownloads,
    remoteInstallOk,
    statusMessage: buildDownloadHubStatusMessage(local, remote, ttydConfigured),
    envSuggestions: buildEnvSuggestions(remote),
  };
}
