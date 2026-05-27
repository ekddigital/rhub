import type { VideoFormatOption } from "./types";

type RawYtDlpFormat = {
  format_id?: string;
  ext?: string;
  format_note?: string;
  height?: number;
  width?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  protocol?: string;
  url?: string;
  resolution?: string;
};

type SizeEstimate = {
  bytes?: number;
  approximate: boolean;
};

function formatBytes(bytes?: number, approximate = true): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const prefix = approximate ? "~" : "";
  if (bytes < 1024 * 1024) return `${prefix}${(bytes / 1024).toFixed(0)} KB`;
  return `${prefix}${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeForExt(ext: string, kind: "video" | "audio"): string {
  switch (ext) {
    case "mp4":
      return kind === "audio" ? "audio/mp4" : "video/mp4";
    case "webm":
      return kind === "video" ? "video/webm" : "audio/webm";
    case "m4a":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    default:
      return kind === "audio" ? "application/octet-stream" : "video/mp4";
  }
}

function isUsableFormat(format: RawYtDlpFormat): boolean {
  const v = format.vcodec ?? "none";
  const a = format.acodec ?? "none";
  if (v === "none" && a === "none") return false;
  if (format.protocol === "mhtml" || format.protocol === "m3u8_native") {
    return false;
  }
  if (format.format_note?.toLowerCase().includes("storyboard")) return false;
  return true;
}

function bitrateEstimate(
  format: RawYtDlpFormat | undefined,
  durationSec: number,
): SizeEstimate {
  if (!format?.tbr || !durationSec) {
    return { bytes: undefined, approximate: true };
  }

  return {
    bytes: Math.round((format.tbr * 1000 * durationSec) / 8),
    approximate: true,
  };
}

function pickFilesize(
  format: RawYtDlpFormat | undefined,
  durationSec: number,
): SizeEstimate {
  if (format?.filesize && format.filesize > 0) {
    return { bytes: format.filesize, approximate: false };
  }

  if (format?.filesize_approx && format.filesize_approx > 0) {
    return { bytes: format.filesize_approx, approximate: true };
  }

  return bitrateEstimate(format, durationSec);
}

function estimatePresetSize(
  mergedFormats: RawYtDlpFormat[],
  ext: string,
  maxHeight?: number,
  durationSec = 0,
): SizeEstimate {
  const candidates = mergedFormats.filter((format) => {
    const matchesExt = (format.ext === "webm" ? "webm" : "mp4") === ext;
    const withinHeight =
      maxHeight === undefined ||
      (typeof format.height === "number" && format.height <= maxHeight);
    return matchesExt && withinHeight;
  });

  const candidate = candidates.sort((a, b) => {
    const ah = a.height ?? 0;
    const bh = b.height ?? 0;
    if (ah !== bh) return bh - ah;
    return (b.tbr ?? 0) - (a.tbr ?? 0);
  })[0];

  return pickFilesize(candidate, durationSec);
}

export function buildFormatOptions(
  rawFormats: RawYtDlpFormat[] | undefined,
  durationSec: number,
): VideoFormatOption[] {
  const formats = (rawFormats ?? []).filter(isUsableFormat);
  const options: VideoFormatOption[] = [];
  const seen = new Set<string>();

  const addOption = (option: VideoFormatOption) => {
    if (seen.has(option.id)) return;
    seen.add(option.id);
    options.push(option);
  };

  // Merged video formats (video + audio in one stream)
  const merged = formats
    .filter(
      (f) =>
        f.vcodec &&
        f.vcodec !== "none" &&
        f.acodec &&
        f.acodec !== "none" &&
        typeof f.height === "number",
    )
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0) || (b.tbr ?? 0) - (a.tbr ?? 0));

  const heightsSeen = new Set<number>();
  for (const format of merged) {
    const height = format.height!;
    if (heightsSeen.has(height)) continue;
    heightsSeen.add(height);

    const ext = format.ext === "webm" ? "webm" : "mp4";
    const filesizeMeta = pickFilesize(format, durationSec);
    const filesize = filesizeMeta.bytes;

    addOption({
      id: `video-${ext}-${height}p`,
      label: `${height}p ${ext.toUpperCase()}`,
      kind: "video",
      ext: `.${ext}`,
      mime: mimeForExt(ext, "video"),
      height,
      width: format.width,
      fps: format.fps,
      codec: format.vcodec,
      filesize,
      filesizeLabel: formatBytes(filesize, filesizeMeta.approximate),
      ytdlpSelector: `best[height<=${height}][ext=${ext}]/best[height<=${height}]/best[ext=${ext}]/best`,
      recommended: height === merged[0]?.height,
    });
  }

  // Preset quality tiers (works even when merged streams aren't listed)
  const presets: Array<{
    id: string;
    label: string;
    ext: string;
    selector: string;
    maxHeight?: number;
  }> =
    [
      {
        id: "video-mp4-best",
        label: "Best quality MP4",
        ext: "mp4",
        selector: "best[ext=mp4]/best",
      },
      {
        id: "video-webm-best",
        label: "Best quality WebM",
        ext: "webm",
        selector: "best[ext=webm]/best",
      },
      {
        id: "video-1080p",
        label: "1080p MP4",
        ext: "mp4",
        maxHeight: 1080,
        selector:
          "best[height<=1080][ext=mp4]/best[height<=1080]/best[ext=mp4]/best",
      },
      {
        id: "video-720p",
        label: "720p MP4",
        ext: "mp4",
        maxHeight: 720,
        selector:
          "best[height<=720][ext=mp4]/best[height<=720]/best[ext=mp4]/best",
      },
      {
        id: "video-480p",
        label: "480p MP4",
        ext: "mp4",
        maxHeight: 480,
        selector:
          "best[height<=480][ext=mp4]/best[height<=480]/best[ext=mp4]/best",
      },
    ];

  for (const preset of presets) {
    const sizeMeta = estimatePresetSize(
      merged,
      preset.ext,
      preset.maxHeight,
      durationSec,
    );

    addOption({
      id: preset.id,
      label: preset.label,
      kind: "video",
      ext: `.${preset.ext}`,
      mime: mimeForExt(preset.ext, "video"),
      filesize: sizeMeta.bytes,
      filesizeLabel: formatBytes(sizeMeta.bytes, sizeMeta.approximate),
      ytdlpSelector: preset.selector,
      recommended: preset.id === "video-mp4-best",
    });
  }

  // Audio options
  const bestAudio = formats
    .filter((f) => f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none"))
    .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];

  const audioSizeMeta = pickFilesize(bestAudio, durationSec);
  const audioSize = audioSizeMeta.bytes;

  addOption({
    id: "audio-m4a",
    label: "Audio M4A (best)",
    kind: "audio",
    ext: ".m4a",
    mime: mimeForExt("m4a", "audio"),
    codec: bestAudio?.acodec,
    filesize: audioSize,
    filesizeLabel: formatBytes(audioSize, audioSizeMeta.approximate),
    ytdlpSelector: "bestaudio[ext=m4a]/bestaudio/best",
    recommended: true,
  });

  addOption({
    id: "audio-mp3",
    label: "Audio MP3 (best)",
    kind: "audio",
    ext: ".mp3",
    mime: mimeForExt("mp3", "audio"),
    codec: bestAudio?.acodec,
    filesize: audioSize,
    filesizeLabel: formatBytes(audioSize, audioSizeMeta.approximate),
    ytdlpSelector: "bestaudio/best",
    requiresFfmpeg: true,
  });

  // Sort: recommended first, then video by height desc, then audio
  return options.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    if (a.kind !== b.kind) return a.kind === "video" ? -1 : 1;
    return (b.height ?? 0) - (a.height ?? 0);
  });
}

export type { RawYtDlpFormat };
