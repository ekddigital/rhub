"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Video } from "lucide-react";
import type {
  DownloadHubToolHealth,
  DownloadPlatform,
} from "@/lib/download-hub/client";
import {
  detectPlatform,
  getAllPlatforms,
  getLivePlatforms,
  getPlatformByRouteSlug,
  isPlatformReady,
  parsePlatformRouteSlug,
  validateMediaUrlInput,
  watchSessionPath,
} from "@/lib/download-hub/client";
import { AnalyzeStatusTicker } from "./analyze-status-ticker";
import { useAnalyzeProgress } from "./use-analyze-progress";
import { VideoPreviewSkeleton } from "./video-preview-skeleton";
import { VidDepsHealthBanner } from "./vid-deps-health-banner";

export function DownloadHub() {
  const pathname = usePathname();
  const router = useRouter();
  const allPlatforms = useMemo(() => getAllPlatforms(), []);
  const livePlatformNames = useMemo(
    () =>
      getLivePlatforms()
        .map((platform) => platform.displayName)
        .join(", "),
    [],
  );

  const platformFromPath = useMemo(() => {
    const routeSlug = parsePlatformRouteSlug(pathname);
    if (!routeSlug) return null;
    return getPlatformByRouteSlug(routeSlug)?.id ?? null;
  }, [pathname]);

  const [manualPlatformId, setManualPlatformId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [detectedPlatform, setDetectedPlatform] =
    useState<DownloadPlatform | null>(null);
  const [toolHealth, setToolHealth] = useState<DownloadHubToolHealth | null>(
    null,
  );
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthFetchFailed, setHealthFetchFailed] = useState(false);

  const loadToolHealth = useCallback(() => {
    setHealthLoading(true);
    setHealthFetchFailed(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    return fetch("/api/tools/vid/health", { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as DownloadHubToolHealth;
        setToolHealth(data);
      })
      .catch(() => {
        setToolHealth(null);
        setHealthFetchFailed(true);
      })
      .finally(() => {
        clearTimeout(timeout);
        setHealthLoading(false);
      });
  }, []);

  useEffect(() => {
    void loadToolHealth();
  }, [loadToolHealth]);

  const ytDlpReady =
    !healthLoading &&
    !healthFetchFailed &&
    toolHealth?.readyForDownloads === true;

  const {
    loading,
    error,
    setError,
    statusMessage,
    elapsedMs,
    analyze,
    cancel,
  } = useAnalyzeProgress({ livePlatformNames });

  const selectedPlatformId = platformFromPath ?? manualPlatformId;

  const activePlatform =
    detectedPlatform ??
    (selectedPlatformId
      ? (allPlatforms.find((p) => p.id === selectedPlatformId) ?? null)
      : null);

  const urlPlaceholder =
    activePlatform?.urlPlaceholder ??
    "Paste a video URL from YouTube, Facebook, Instagram, and more...";

  const instantValidation = useMemo(() => {
    if (!url.trim() || loading) return null;
    const result = validateMediaUrlInput(url, { livePlatformNames });
    return result.ok ? null : result.error;
  }, [url, livePlatformNames, loading]);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      setError("");

      if (value.trim()) {
        const detected = detectPlatform(value);
        setDetectedPlatform(detected);
        if (detected) {
          setManualPlatformId(detected.id);
        }
      } else {
        setDetectedPlatform(null);
      }
    },
    [setError],
  );

  const handleAnalyze = async () => {
    const result = await analyze(url);
    if (result.ok) {
      router.push(
        watchSessionPath(result.session.platformRouteSlug, result.session.id),
      );
    }
  };

  const showInstantError = Boolean(instantValidation && url.trim().length > 8);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Paste a link
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We detect the platform and open a download page with format options —
          MP4, WebM, audio, and more.
        </p>
      </div>

      <div className="w-full min-w-0">
        <VidDepsHealthBanner
          health={toolHealth}
          loading={healthLoading}
          healthFetchFailed={healthFetchFailed}
          onHealthChange={setToolHealth}
          onRetryHealth={() => void loadToolHealth()}
        />
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        role="tablist"
        aria-label="Download platforms"
      >
        {allPlatforms.map((platform) => {
          const isSelected =
            selectedPlatformId === platform.id ||
            detectedPlatform?.id === platform.id;
          const isLive = platform.status === "live";
          return (
            <Link
              key={platform.id}
              href={platform.href}
              role="tab"
              aria-selected={isSelected}
              className={`block rounded-lg border-2 p-3 text-left transition-all ${
                isSelected
                  ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gold/40"
              }`}
            >
              <div className="text-2xl mb-1">{platform.icon}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {platform.displayName}
              </div>
              <Badge
                variant="secondary"
                className={`mt-2 text-[10px] ${
                  isLive
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {isLive ? "Available" : "Soon"}
              </Badge>
            </Link>
          );
        })}
      </div>

      <Card className="p-6 space-y-4 border-2 border-gold/20">
        <div className="flex items-center gap-3 mb-2">
          <Video className="w-6 h-6 text-gold" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Media URL
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="url"
            placeholder={urlPlaceholder}
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                void handleAnalyze();
              }
            }}
            disabled={loading}
            className="flex-1"
            aria-busy={loading}
            aria-invalid={Boolean(showInstantError || error)}
          />
          {loading ? (
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              className="shrink-0 min-w-35"
            >
              Cancel
            </Button>
          ) : (
            <Button
              onClick={handleAnalyze}
              disabled={
                !url.trim() ||
                !ytDlpReady ||
                Boolean(instantValidation) ||
                (detectedPlatform !== null &&
                  !isPlatformReady(detectedPlatform))
              }
              className="bg-gold hover:bg-gold/90 text-dark-brown font-semibold shrink-0 min-w-35"
            >
              Analyze
            </Button>
          )}
        </div>

        {detectedPlatform && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="text-2xl">{detectedPlatform.icon}</span>
            <span>
              Detected: <strong>{detectedPlatform.displayName}</strong>
            </span>
            {!isPlatformReady(detectedPlatform) && (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Coming soon
              </Badge>
            )}
          </div>
        )}

        {showInstantError && (
          <p
            className="text-sm text-amber-700 dark:text-amber-400"
            role="alert"
          >
            {instantValidation}
          </p>
        )}

        {activePlatform && !detectedPlatform && selectedPlatformId && (
          <p className="text-xs text-muted-foreground">
            Tip: paste a {activePlatform.displayName} link and we&apos;ll detect
            it automatically.
          </p>
        )}
      </Card>

      {loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <AnalyzeStatusTicker message={statusMessage} elapsedMs={elapsedMs} />
          <VideoPreviewSkeleton />
        </div>
      )}

      {error && (
        <div className="space-y-3">
          <Alert className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertDescription className="whitespace-normal wrap-break-word leading-relaxed">
              {error}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setError("");
                void handleAnalyze();
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const VideoDownloader = DownloadHub;
