"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListVideo } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VideoSessionResponse } from "@/lib/download-hub/client";
import { watchSessionPath } from "@/lib/download-hub/client";
import {
  parseErrorResponse,
  parseJsonResponse,
} from "@/lib/http/client-response";
import { SESSION_LOAD_MESSAGE } from "@/lib/download-hub/analyze-progress";
import {
  VideoPreviewFromSession,
  PlaylistEntryCard,
} from "./video-preview-card";
import { AnalyzeLoadingPanel } from "./analyze-loading-panel";
import { FormatPicker } from "./format-picker";
import { DownloadProgress } from "./download-progress";
import { AnalyzeStatusTicker } from "./analyze-status-ticker";
import { useAnalyzeProgress } from "./use-analyze-progress";

type WatchPageProps = {
  platformRouteSlug: string;
  sessionId: string;
};

export function WatchPage({ platformRouteSlug, sessionId }: WatchPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<VideoSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [resolvingEntryUrl, setResolvingEntryUrl] = useState<string | null>(
    null,
  );

  const {
    loading: resolvingPlaylist,
    statusMessage: resolveStatus,
    elapsedMs: resolveElapsed,
    analyze: analyzeEntryUrl,
  } = useAnalyzeProgress();

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tools/vid/info/${sessionId}`);
      if (!response.ok) {
        const message = await parseErrorResponse(response, "Session not found");
        throw new Error(message);
      }
      const data = await parseJsonResponse<VideoSessionResponse>(
        response,
        "Failed to load session",
      );
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleDownload = async (formatOptionId: string) => {
    const selectedFormat = session?.formats.find(
      (f) => f.id === formatOptionId,
    );

    setDownloadingId(formatOptionId);
    setDownloadSuccess(false);
    setDownloadError("");

    try {
      const response = await fetch("/api/tools/vid/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          formatOptionId,
          ...(session && selectedFormat
            ? {
                fallbackSession: {
                  url: session.url,
                  title: session.title,
                  platformId: session.platformId,
                  platformDisplayName: session.platformDisplayName,
                  formatOption: {
                    id: selectedFormat.id,
                    kind: selectedFormat.kind,
                    ext: selectedFormat.ext,
                    mime: selectedFormat.mime,
                    ytdlpSelector: selectedFormat.ytdlpSelector,
                    requiresFfmpeg: selectedFormat.requiresFfmpeg,
                  },
                },
              }
            : {}),
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
        "media";

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName.replace(/"/g, "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePlaylistEntry = async (entryUrl: string) => {
    setResolvingEntryUrl(entryUrl);
    setError("");

    const result = await analyzeEntryUrl(entryUrl);
    if (result.ok) {
      router.push(
        watchSessionPath(result.session.platformRouteSlug, result.session.id),
      );
      return;
    }

    setResolvingEntryUrl(null);
    setError(result.error);
  };

  const backHref = `/tools/vid/${platformRouteSlug}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <BackLink href={backHref} />
        <AnalyzeLoadingPanel
          compact
          statusMessage={SESSION_LOAD_MESSAGE}
          currentPhase="session"
          showSkeleton
          showFormatSkeleton
        />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="space-y-4">
        <BackLink href={backHref} />
        <Alert className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertDescription className="whitespace-normal wrap-break-word leading-relaxed">
            {error}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={backHref}>Paste a new URL</Link>
        </Button>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <BackLink href={backHref} />

      {session.isPlaylist && session.entries?.length ? (
        <>
          <Card className="p-4 border-2 border-gold/20">
            <div className="flex items-center gap-2 mb-1">
              <ListVideo className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-bold">
                {session.playlistTitle || session.title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {session.entries.length} videos — select one to choose download
              formats
            </p>
          </Card>

          {resolvingPlaylist && resolvingEntryUrl && (
            <AnalyzeStatusTicker
              message={resolveStatus}
              elapsedMs={resolveElapsed}
              compact
            />
          )}

          <div className="grid gap-3" role="list" aria-label="Playlist videos">
            {session.entries.map((entry) => (
              <div key={entry.id} role="listitem">
                <PlaylistEntryCard
                  entry={entry}
                  session={session}
                  loading={resolvingEntryUrl === entry.url}
                  onSelect={() => handlePlaylistEntry(entry.url)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <VideoPreviewFromSession session={session} />

          <Card className="p-4 sm:p-6 border-2 border-gold/20 space-y-4">
            <h2 className="text-lg font-bold">Choose format</h2>
            <p className="text-sm text-muted-foreground">
              Pick a quality and format below. Sizes are estimates from source
              metadata.
            </p>
            <FormatPicker
              formats={session.formats}
              downloadingId={downloadingId}
              ffmpegAvailable={session.ffmpegAvailable}
              onDownload={handleDownload}
            />
          </Card>

          <DownloadProgress
            active={Boolean(downloadingId)}
            label="Downloading from source…"
            success={downloadSuccess}
            error={downloadError}
          />
        </>
      )}

      {error && session && (
        <Alert className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertDescription className="whitespace-normal wrap-break-word leading-relaxed">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function BackLink({ href }: { href: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="px-0 text-muted-foreground hover:text-gold"
    >
      <Link href={href}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to paste link
      </Link>
    </Button>
  );
}
