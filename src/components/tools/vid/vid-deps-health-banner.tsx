"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { YT_DLP_README_PATH } from "@/lib/download-hub/constants";
import type { DownloadHubToolHealth } from "@/lib/download-hub/client";

type VidDepsHealthBannerProps = {
  health: DownloadHubToolHealth | null;
  loading?: boolean;
  healthFetchFailed?: boolean;
  onHealthChange?: (health: DownloadHubToolHealth) => void;
  onRetryHealth?: () => void;
};

type InstallState = "idle" | "installing" | "success" | "error" | "warning";

type SetupResponse = {
  success: boolean;
  error?: string;
  hostMismatchWarning?: string;
  envHint?: string;
  envSuggestions?: { YT_DLP_BIN?: string; FFMPEG_BIN?: string };
  readyForDownloads?: boolean;
  remoteInstallOk?: boolean;
  steps?: Array<{ name: string; success: boolean; output: string; skipped?: boolean }>;
  remote?: { ytDlp: boolean; ffmpeg: boolean; paths: { ytDlp?: string; ffmpeg?: string } };
  local?: DownloadHubToolHealth;
};

const HEALTH_FETCH_TIMEOUT_MS = 120_000;

export function localDepsSnapshot(health: DownloadHubToolHealth) {
  return (
    health.local ?? {
      ytDlp: health.ytDlp,
      ffmpeg: health.ffmpeg,
      paths: health.paths,
    }
  );
}

/**
 * Banner visibility (show = true):
 *
 * | readyForDownloads | remoteInstallOk | local yt-dlp | local ffmpeg | show |
 * |-------------------|-----------------|--------------|--------------|------|
 * | true              | *               | *            | *            | no   |
 * | false             | true            | false        | false        | no   |
 * | false             | true            | partial      | partial      | yes  |
 * | false             | false           | missing any  | missing any  | yes  |
 *
 * Fetch failure uses a separate minimal error alert (not this table).
 */
export function shouldShowDownloadHubDepsBanner(
  health: DownloadHubToolHealth,
): boolean {
  if (health.readyForDownloads === true) return false;

  const local = localDepsSnapshot(health);
  if (local.ytDlp && local.ffmpeg) return false;

  if (health.remoteInstallOk === true) {
    return local.ytDlp || local.ffmpeg;
  }

  return true;
}

function missingLocalDepLabels(local: ReturnType<typeof localDepsSnapshot>): string[] {
  const items: string[] = [];
  if (!local.ytDlp) {
    items.push("yt-dlp — required on this machine for analysis and downloads");
  }
  if (!local.ffmpeg) {
    items.push("ffmpeg — required on this machine for MP3 conversion");
  }
  return items;
}

async function fetchHealth(signal?: AbortSignal): Promise<DownloadHubToolHealth> {
  const res = await fetch("/api/tools/vid/health", { signal });
  return (await res.json()) as DownloadHubToolHealth;
}

export function VidDepsHealthBanner({
  health,
  loading,
  healthFetchFailed,
  onHealthChange,
  onRetryHealth,
}: VidDepsHealthBannerProps) {
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [installSubtext, setInstallSubtext] = useState<string | null>(null);
  const [installOutput, setInstallOutput] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);

  const recheckHealth = useCallback(async () => {
    setRechecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        HEALTH_FETCH_TIMEOUT_MS,
      );
      try {
        const data = await fetchHealth(controller.signal);
        onHealthChange?.(data);
        setInstallState("idle");
        setInstallMessage(null);
        setInstallSubtext(null);
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      setInstallMessage("Could not refresh dependency status.");
      setInstallState("error");
    } finally {
      setRechecking(false);
    }
  }, [onHealthChange]);

  const runRemoteInstall = useCallback(async () => {
    setInstallState("installing");
    setInstallMessage(null);
    setInstallSubtext(null);
    setInstallOutput(null);

    try {
      const res = await fetch("/api/tools/vid/setup", { method: "POST" });
      const data = (await res.json()) as SetupResponse;

      const output = data.steps
        ?.map(
          (step) =>
            `[${step.name}] ${step.skipped ? "(skipped) " : ""}${step.output}`.trim(),
        )
        .join("\n\n");

      setInstallOutput(output || data.error || null);

      try {
        const refreshed = await fetchHealth();
        onHealthChange?.(refreshed);
      } catch {
        if (data.local) onHealthChange?.(data.local);
      }

      const remoteOk =
        data.remoteInstallOk ??
        (data.remote?.ytDlp === true && data.remote?.ffmpeg === true);
      const localOk =
        data.readyForDownloads ??
        (data.local?.ytDlp === true && data.local?.ffmpeg === true);

      if (localOk || remoteOk) {
        setInstallState("success");
        setInstallMessage(
          localOk
            ? "Dependencies are available — downloads are ready."
            : "Server dependencies installed.",
        );
        if (!localOk && data.envHint) {
          setInstallSubtext(data.envHint);
        }
        return;
      }

      if (data.hostMismatchWarning) {
        setInstallState("warning");
        setInstallMessage(data.hostMismatchWarning);
        return;
      }

      setInstallState("error");
      setInstallMessage(
        data.error ??
          "Install failed. Check TTYD_BASE_URL and TTYD_KEY in .env match your terminal API.",
      );
    } catch (error) {
      setInstallState("error");
      setInstallMessage(
        error instanceof Error ? error.message : "Install request failed",
      );
    }
  }, [onHealthChange]);

  if (loading) {
    return null;
  }

  if (healthFetchFailed) {
    return (
      <Alert className="w-full border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle>Could not check download tools</AlertTitle>
        <AlertDescription className="text-sm">
          <p>Dependency status is unavailable. Downloads may not work until this is resolved.</p>
          {onRetryHealth && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => onRetryHealth()}
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!health || !shouldShowDownloadHubDepsBanner(health)) {
    return null;
  }

  const local = localDepsSnapshot(health);
  const ttydConfigured = health.ttydConfigured === true;
  const remoteOk = health.remoteInstallOk === true;
  const terminalUrl = health.terminalUrl;
  const missingItems = missingLocalDepLabels(local);
  const needsRemoteInstall = ttydConfigured && !remoteOk;

  const ytHint = health.hints?.ytDlp;
  const ffmpegHint = health.hints?.ffmpeg;

  const bannerTitle = needsRemoteInstall
    ? "Server setup required"
    : "Download tools required";

  const showStatusMessage =
    Boolean(health.statusMessage) &&
    !(remoteOk && (local.ytDlp || local.ffmpeg));

  return (
    <Alert className="w-full whitespace-normal wrap-break-word border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        {bannerTitle}
      </AlertTitle>
      <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
        {showStatusMessage && health.statusMessage && (
          <p className="text-sm wrap-break-word">{health.statusMessage}</p>
        )}

        {missingItems.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {missingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {health.envSuggestions &&
          (health.envSuggestions.YT_DLP_BIN || health.envSuggestions.FFMPEG_BIN) && (
            <p className="mt-2 font-mono text-xs wrap-break-word rounded-md bg-black/10 px-2 py-1.5 dark:bg-black/30">
              {health.envSuggestions.YT_DLP_BIN && (
                <>YT_DLP_BIN={health.envSuggestions.YT_DLP_BIN}</>
              )}
              {health.envSuggestions.YT_DLP_BIN &&
                health.envSuggestions.FFMPEG_BIN &&
                " · "}
              {health.envSuggestions.FFMPEG_BIN && (
                <>FFMPEG_BIN={health.envSuggestions.FFMPEG_BIN}</>
              )}
            </p>
          )}

        {needsRemoteInstall && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={installState === "installing" || rechecking}
              onClick={() => void runRemoteInstall()}
            >
              {installState === "installing"
                ? "Installing on server…"
                : "Install on server"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rechecking || installState === "installing"}
              onClick={() => void recheckHealth()}
            >
              {rechecking ? "Checking…" : "Recheck"}
            </Button>
            {terminalUrl && (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={terminalUrl} target="_blank" rel="noopener noreferrer">
                  Open terminal
                </Link>
              </Button>
            )}
          </div>
        )}

        {!ttydConfigured && (ytHint || ffmpegHint) && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {!local.ytDlp && ytHint && (
              <li className="wrap-break-word">
                <span className="font-medium">yt-dlp:</span> {ytHint}
              </li>
            )}
            {!local.ffmpeg && ffmpegHint && (
              <li className="wrap-break-word">
                <span className="font-medium">ffmpeg:</span> {ffmpegHint}
              </li>
            )}
          </ul>
        )}

        {ttydConfigured && !needsRemoteInstall && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rechecking}
              onClick={() => void recheckHealth()}
            >
              {rechecking ? "Checking…" : "Recheck"}
            </Button>
            {terminalUrl && (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={terminalUrl} target="_blank" rel="noopener noreferrer">
                  Open terminal
                </Link>
              </Button>
            )}
          </div>
        )}

        {installMessage && (
          <div className="mt-3 space-y-1">
            <p
              className={`text-sm wrap-break-word ${
                installState === "success"
                  ? "text-green-800 dark:text-green-300"
                  : installState === "warning"
                    ? "text-amber-900 dark:text-amber-100"
                    : installState === "error"
                      ? "text-red-800 dark:text-red-300"
                      : ""
              }`}
            >
              {installMessage}
            </p>
            {installSubtext && (
              <p className="text-sm text-green-800/90 dark:text-green-300/90 wrap-break-word">
                {installSubtext}
              </p>
            )}
          </div>
        )}

        {installOutput && (
          <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              Install output
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap wrap-break-word rounded-md bg-black/10 px-3 py-2 font-mono text-xs dark:bg-black/30">
              {installOutput}
            </pre>
          </details>
        )}

        <p className="mt-3 text-sm wrap-break-word">
          <Link
            href="https://github.com/yt-dlp/yt-dlp#installation"
            className="underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            yt-dlp installation docs
          </Link>
          {" · "}
          See{" "}
          <code className="break-all rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-black/30">
            {YT_DLP_README_PATH}
          </code>{" "}
          in this repo.
        </p>
      </AlertDescription>
    </Alert>
  );
}
