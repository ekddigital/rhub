"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Loader2,
  Video,
  Music,
  CheckCircle,
  ExternalLink,
  Eye,
  Clock,
  User,
  Sparkles,
} from "lucide-react";
import type { DownloadFormat, DownloadPlatform } from "@/lib/download-hub";
import {
  detectPlatform,
  getAllPlatforms,
  getLivePlatforms,
  getPlatformByRouteSlug,
  isPlatformReady,
  parsePlatformRouteSlug,
} from "@/lib/download-hub";
import { DOWNLOAD_HUB_PATH } from "@/lib/download-hub/nav";
import {
  parseErrorResponse,
  parseJsonResponse,
} from "@/lib/http/client-response";

function formatDuration(seconds: number): string {
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

interface VideoInfo {
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  description: string;
  views: number;
  uploadDate: string;
  availableQualities: string[];
}

export function DownloadHub() {
  const pathname = usePathname();
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

  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    null,
  );
  const [url, setUrl] = useState("");
  const [detectedPlatform, setDetectedPlatform] =
    useState<DownloadPlatform | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat | null>(
    null,
  );
  const [selectedQuality, setSelectedQuality] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (platformFromPath) {
      setSelectedPlatformId(platformFromPath);
      return;
    }
    if (pathname === DOWNLOAD_HUB_PATH) {
      setSelectedPlatformId(null);
    }
  }, [platformFromPath, pathname]);

  const activePlatform =
    detectedPlatform ??
    (selectedPlatformId
      ? (allPlatforms.find((p) => p.id === selectedPlatformId) ?? null)
      : null);

  const urlPlaceholder =
    activePlatform?.urlPlaceholder ??
    "Paste a video URL from YouTube, Facebook, Instagram, and more...";

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setError("");
    setSuccess(false);
    setVideoInfo(null);
    setSelectedFormat(null);
    setSelectedQuality("");

    if (value.trim()) {
      const detected = detectPlatform(value);
      setDetectedPlatform(detected);
      if (detected) {
        setSelectedPlatformId(detected.id);
      }
    } else {
      setDetectedPlatform(null);
    }
  }, []);

  const handleGetInfo = async () => {
    if (!url.trim()) {
      setError("Please enter a media URL");
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      setError("Unsupported platform or invalid URL");
      return;
    }

    if (!isPlatformReady(platform)) {
      setError(
        `${platform.displayName} is coming soon. Currently live: ${livePlatformNames}.`,
      );
      return;
    }

    setLoading(true);
    setError("");
    setVideoInfo(null);

    try {
      const response = await fetch(
        `/api/tools/vid/download?url=${encodeURIComponent(url)}&platform=${platform.id}`,
      );

      if (!response.ok) {
        const message = await parseErrorResponse(
          response,
          "Failed to fetch media info",
        );
        throw new Error(message);
      }

      const info = await parseJsonResponse<VideoInfo>(
        response,
        "Failed to parse media info",
      );
      setVideoInfo(info);

      if (platform.supportedFormats.length > 0) {
        setSelectedFormat(platform.supportedFormats[0]);
        const defaultQuality =
          platform.supportedFormats[0].type === "video"
            ? platform.videoQualities[0]?.id
            : platform.audioQualities[0]?.id;
        setSelectedQuality(defaultQuality || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get media info");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const platform = detectPlatform(url);
    if (!platform || !selectedFormat || !selectedQuality) {
      setError("Please select format and quality");
      return;
    }

    if (!isPlatformReady(platform)) {
      setError(
        `${platform.displayName} is coming soon. Currently live: ${livePlatformNames}.`,
      );
      return;
    }

    setDownloading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/tools/vid/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          formatId: selectedFormat.id,
          qualityId: selectedQuality,
          action: "download",
        }),
      });

      if (!response.ok) {
        const message = await parseErrorResponse(response, "Download failed");
        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const fileName =
        response.headers.get("Content-Disposition")?.split("filename=")[1] ||
        `media${selectedFormat.ext}`;

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName.replace(/"/g, "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Paste a link
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We detect the platform automatically. Choose a source below or paste
          any supported URL.
        </p>
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
            className="flex-1"
          />
          <Button
            onClick={handleGetInfo}
            disabled={
              loading ||
              !url.trim() ||
              (detectedPlatform !== null && !isPlatformReady(detectedPlatform))
            }
            className="bg-gold hover:bg-gold/90 text-dark-brown font-semibold shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Get info"
            )}
          </Button>
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

        {activePlatform && !detectedPlatform && selectedPlatformId && (
          <p className="text-xs text-muted-foreground">
            Tip: paste a {activePlatform.displayName} link and we&apos;ll detect
            it automatically.
          </p>
        )}
      </Card>

      {videoInfo && detectedPlatform && isPlatformReady(detectedPlatform) && (
        <>
          <Card className="p-6 space-y-4 border-2 border-green-500/30 bg-green-500/5">
            <div className="flex gap-4">
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-40 h-24 object-cover rounded-lg border-2 border-gold/20"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                  {videoInfo.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{videoInfo.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(videoInfo.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{videoInfo.views.toLocaleString()} views</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-gold hover:text-gold/80"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open original
                  </a>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 border-2 border-gold/20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Download options
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Format
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {detectedPlatform.supportedFormats.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(format);
                      const defaultQuality =
                        format.type === "video"
                          ? detectedPlatform.videoQualities[0]?.id
                          : detectedPlatform.audioQualities[0]?.id;
                      setSelectedQuality(defaultQuality || "");
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedFormat?.id === format.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-gray-300 dark:border-gray-700 hover:border-gold/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {format.type === "video" ? (
                        <Video className="w-6 h-6" />
                      ) : (
                        <Music className="w-6 h-6" />
                      )}
                      <span className="font-semibold">{format.name}</span>
                      <span className="text-xs text-gray-500">
                        {format.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {selectedFormat && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quality
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-gold focus:ring-2 focus:ring-gold/20"
                >
                  {selectedFormat.type === "video"
                    ? detectedPlatform.videoQualities.map((quality) => (
                        <option key={quality.id} value={quality.id}>
                          {quality.label} - {quality.resolution}
                        </option>
                      ))
                    : detectedPlatform.audioQualities.map((quality) => (
                        <option key={quality.id} value={quality.id}>
                          {quality.label}
                        </option>
                      ))}
                </select>
              </div>
            )}
            <Button
              onClick={handleDownload}
              disabled={downloading || !selectedFormat || !selectedQuality}
              className="w-full h-12 bg-gold hover:bg-gold/90 text-dark-brown font-bold text-base"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download {selectedFormat?.name}
                </>
              )}
            </Button>
          </Card>
        </>
      )}

      {error && (
        <Alert className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
          {error}
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Download started. Check your downloads folder.
        </Alert>
      )}
    </div>
  );
}

export const VideoDownloader = DownloadHub;
