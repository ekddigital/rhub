import { NextRequest, NextResponse } from "next/server";
import { downloadVideo, downloadVideoFromSession } from "@/lib/vid/engine";
import {
  validateUrl,
  getPlatformById,
  isPlatformReady,
} from "@/lib/vid/platforms-config";
import { getLivePlatforms } from "@/lib/download-hub/client";
import {
  downloadWithSelector,
  getVideoSession,
  httpStatusForYtDlpError,
  isYtDlpUnavailableMessage,
  mapYtDlpError,
  sanitizeMediaUrl,
} from "@/lib/download-hub/server";
import { prisma } from "@/lib/prisma";
import type { VideoQuality, AudioQuality } from "@/lib/vid/platforms-config";

export const runtime = "nodejs";
export const maxDuration = 300;

type SessionDownloadFallback = {
  url: string;
  title: string;
  platformId: string;
  platformDisplayName: string;
  formatOption: {
    id: string;
    kind: "video" | "audio";
    ext: string;
    mime: string;
    ytdlpSelector: string;
    requiresFfmpeg?: boolean;
  };
};

function buildComingSoonError(platformName: string): string {
  const liveList = getLivePlatforms()
    .map((platform) => platform.displayName)
    .join(", ");
  return `${platformName} downloads are coming soon. Currently live: ${liveList}.`;
}

function errorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes("coming soon")) return 501;
  if (lower.includes("invalid url") || lower.includes("unsupported")) {
    return 400;
  }
  if (lower.includes("session expired")) return 404;
  return httpStatusForYtDlpError(message);
}

function jsonError(message: string, url?: string) {
  return NextResponse.json(
    { error: mapYtDlpError(message, { phase: "download", url }) },
    { status: errorStatus(message) },
  );
}

async function logDownloadJob(
  platformId: string,
  platformName: string,
  formatId: string,
  formatType: string,
  qualityId: string,
  result: Awaited<ReturnType<typeof downloadVideo>>,
) {
  await prisma.conversionJob.create({
    data: {
      resourceSlug: `vid-${platformId}`,
      inputFormat: platformName,
      outputFormat: formatId,
      status: "COMPLETED",
      sourceName: result.metadata.title || "video",
      sourceSize: result.size,
      entryCount: 1,
      warningCount: 0,
      errorCount: 0,
      durationMs: result.processingTime,
      metadata: {
        platform: platformName,
        formatType,
        quality: qualityId,
        duration: result.duration,
        author: result.metadata.author,
        views: result.metadata.views,
      },
    },
  });
}

async function handleSessionDownload(
  sessionId: string,
  formatOptionId: string,
  fallback?: SessionDownloadFallback,
): Promise<NextResponse> {
  const session = getVideoSession(sessionId);

  if (!session && fallback) {
    const safeUrl = sanitizeMediaUrl(fallback.url);
    const option = fallback.formatOption;

    if (option.id !== formatOptionId) {
      return jsonError("Invalid download option for this session.", safeUrl);
    }

    const result = await downloadWithSelector(
      safeUrl,
      option.ytdlpSelector,
      option.ext,
      fallback.title,
    );

    await logDownloadJob(
      fallback.platformId,
      fallback.platformDisplayName,
      option.id,
      option.kind,
      option.id,
      {
        ...result,
        processingTime: 0,
      },
    );

    const fileName = result.fileName.endsWith(option.ext)
      ? result.fileName
      : `${result.fileName.replace(/\.[^.]+$/, "")}${option.ext}`;

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": option.mime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-File-Size": result.size.toString(),
        "X-Duration": result.duration?.toString() || "0",
        "X-Platform": fallback.platformDisplayName,
      },
    });
  }

  if (!session) {
    return jsonError("Session expired or not found. Paste the URL again.");
  }

  const result = await downloadVideoFromSession(sessionId, formatOptionId);
  const formatOption = session.formats.find((f) => f.id === formatOptionId);

  await logDownloadJob(
    session.platformId,
    session.platformDisplayName,
    formatOptionId,
    formatOption?.kind ?? "video",
    formatOptionId,
    result,
  );

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": formatOption?.mime ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "X-Processing-Time": result.processingTime.toString(),
      "X-File-Size": result.size.toString(),
      "X-Duration": result.duration?.toString() || "0",
      "X-Platform": session.platformDisplayName,
    },
  });
}

export async function POST(req: NextRequest) {
  let requestUrl: string | undefined;
  try {
    const body = await req.json();
    const {
      url,
      formatId,
      qualityId,
      action,
      platformId,
      sessionId,
      formatOptionId,
      fallbackSession,
    } = body as {
      url?: string;
      formatId?: string;
      qualityId?: string;
      action?: "info" | "download";
      platformId?: string;
      sessionId?: string;
      formatOptionId?: string;
      fallbackSession?: SessionDownloadFallback;
    };

    if (sessionId && formatOptionId) {
      return await handleSessionDownload(
        sessionId,
        formatOptionId,
        fallbackSession,
      );
    }

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    requestUrl = url;
    let safeUrl: string;
    try {
      safeUrl = sanitizeMediaUrl(url);
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "Invalid URL",
      );
    }

    let platform;
    if (platformId) {
      platform = getPlatformById(platformId);
      if (!platform) {
        return NextResponse.json(
          { error: "Invalid platform" },
          { status: 400 },
        );
      }
      if (!platform.canHandle(safeUrl)) {
        return NextResponse.json(
          { error: `URL does not match ${platform.displayName}` },
          { status: 400 },
        );
      }
    }

    const validation = validateUrl(safeUrl);
    if (!validation.valid || !validation.platform) {
      return NextResponse.json(
        { error: validation.error || "Invalid URL" },
        { status: 400 },
      );
    }

    const resolvedPlatform = platform ?? validation.platform;
    const { videoId } = validation;

    if (!isPlatformReady(resolvedPlatform)) {
      return jsonError(buildComingSoonError(resolvedPlatform.displayName));
    }

    if (action === "info") {
      return NextResponse.json(
        {
          error:
            "Use POST /api/tools/vid/info to create a session, then open the watch page.",
        },
        { status: 400 },
      );
    }

    if (!formatId || !qualityId) {
      return NextResponse.json(
        { error: "Format and quality are required for download" },
        { status: 400 },
      );
    }

    const format = resolvedPlatform.supportedFormats.find(
      (f) => f.id === formatId,
    );
    if (!format) {
      return NextResponse.json(
        { error: "Unsupported format" },
        { status: 400 },
      );
    }

    const quality =
      format.type === "video"
        ? resolvedPlatform.videoQualities.find((q) => q.id === qualityId)
        : resolvedPlatform.audioQualities.find((q) => q.id === qualityId);

    if (!quality) {
      return NextResponse.json(
        { error: "Unsupported quality" },
        { status: 400 },
      );
    }

    const result = await downloadVideo({
      url: safeUrl,
      platform: resolvedPlatform,
      format,
      quality: quality as VideoQuality | AudioQuality,
      videoId: videoId!,
    });

    await logDownloadJob(
      resolvedPlatform.id,
      resolvedPlatform.name,
      format.id,
      format.type,
      qualityId,
      result,
    );

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": format.mime,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Processing-Time": result.processingTime.toString(),
        "X-File-Size": result.size.toString(),
        "X-Duration": result.duration?.toString() || "0",
        "X-Platform": resolvedPlatform.name,
      },
    });
  } catch (error) {
    console.error("Video download error:", error);
    const message =
      error instanceof Error ? error.message : "Download failed";
    return jsonError(message, requestUrl);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const formatOptionId = searchParams.get("formatOptionId");

    if (sessionId && formatOptionId) {
      return await handleSessionDownload(sessionId, formatOptionId);
    }

    return NextResponse.json(
      {
        error:
          "Use POST /api/tools/vid/info to resolve a URL, or pass sessionId and formatOptionId to download.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Video download error:", error);
    const message =
      error instanceof Error ? error.message : "Download failed";
    const sessionId = new URL(req.url).searchParams.get("sessionId");
    const sessionUrl = sessionId
      ? getVideoSession(sessionId)?.url
      : undefined;
    return jsonError(message, sessionUrl);
  }
}
