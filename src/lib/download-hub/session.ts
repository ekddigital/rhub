import "server-only";

import { buildFormatOptions } from "./formats-ytdlp";
import { isPlatformReady, validateUrl } from "./registry";
import { extractFullWithYtDlp, sanitizeMediaUrl } from "./yt-dlp";
import { isFfmpegAvailable } from "./ffmpeg";
import { putVideoSession, toSessionResponse } from "./video-cache";
import type { VideoSession, VideoSessionResponse } from "./types";

export async function createVideoSession(
  rawUrl: string,
): Promise<VideoSessionResponse> {
  const safeUrl = sanitizeMediaUrl(rawUrl);
  const validation = validateUrl(safeUrl);

  if (!validation.valid || !validation.platform) {
    throw new Error(validation.error || "Invalid URL");
  }

  const platform = validation.platform;
  if (!isPlatformReady(platform)) {
    throw new Error(`${platform.displayName} downloads are not available yet.`);
  }

  let metadata;
  try {
    metadata = await extractFullWithYtDlp(safeUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media metadata";

    const isFacebookShare =
      platform.id === "fb" &&
      /facebook\.com\/share\/(v|r|reel)\//i.test(safeUrl);

    if (isFacebookShare && /timed out|timeout/i.test(message)) {
      throw new Error(
        "Facebook share links can expire or resolve slowly. Open the share link in Facebook, copy the final watch/reel URL, and paste that here.",
      );
    }

    throw error;
  }

  const ffmpegAvailable = await isFfmpegAvailable();

  const formats = metadata.isPlaylist
    ? []
    : buildFormatOptions(metadata.raw.formats, metadata.duration);

  const session = putVideoSession({
    url: safeUrl,
    platformId: platform.id,
    platformRouteSlug: platform.routeSlug,
    platformDisplayName: platform.displayName,
    platformIcon: platform.icon,
    sourceVideoId: validation.videoId || metadata.raw.id || "unknown",
    title: metadata.title,
    author: metadata.author,
    duration: metadata.duration,
    thumbnail: metadata.thumbnail,
    description: metadata.description,
    views: metadata.views,
    uploadDate: metadata.uploadDate,
    formats,
    isPlaylist: metadata.isPlaylist,
    playlistTitle: metadata.playlistTitle,
    entries: metadata.entries,
    ffmpegAvailable,
  });

  return toSessionResponse(session);
}

export function getFormatFromSession(
  session: VideoSession,
  formatOptionId: string,
) {
  const format = session.formats.find((f) => f.id === formatOptionId);
  if (!format) {
    throw new Error("Unknown format option");
  }
  return format;
}
