// Shared types for the Download Hub platform registry

export interface VideoQuality {
  id: string;
  label: string;
  resolution: string;
  format: string;
  bitrate?: string;
}

export interface AudioQuality {
  id: string;
  label: string;
  bitrate: string;
  format: string;
}

export interface DownloadFormat {
  id: string;
  name: string;
  ext: string;
  mime: string;
  type: "video" | "audio";
  supportsQuality: boolean;
}

export type PlatformStatus = "live" | "coming-soon";

export interface DownloadPlatform {
  id: string;
  /** URL segment under `/tools/vid/{routeSlug}` */
  routeSlug: string;
  /** Canonical page URL, e.g. `/tools/vid/yt` */
  href: string;
  name: string;
  displayName: string;
  icon: string;
  status: PlatformStatus;
  urlPattern: RegExp;
  urlPlaceholder: string;
  videoQualities: VideoQuality[];
  audioQualities: AudioQuality[];
  supportedFormats: DownloadFormat[];
  features: string[];
  canHandle(url: string): boolean;
  extract(url: string): string | null;
}

/** Legacy alias used by the video engine and API routes */
export type Platform = DownloadPlatform;

/** A downloadable format option derived from yt-dlp metadata */
export interface VideoFormatOption {
  id: string;
  label: string;
  kind: "video" | "audio";
  ext: string;
  mime: string;
  height?: number;
  width?: number;
  fps?: number;
  codec?: string;
  filesize?: number;
  filesizeLabel?: string;
  /** yt-dlp `-f` selector string */
  ytdlpSelector: string;
  recommended?: boolean;
  /** True when server-side post-processing (ffmpeg) is required */
  requiresFfmpeg?: boolean;
}

/** Preview item for playlist / multi-entry results */
export interface VideoEntryPreview {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  url: string;
  uploader?: string;
}

/** Cached media session returned by `/api/tools/vid/info` */
export interface VideoSession {
  id: string;
  url: string;
  platformId: string;
  platformRouteSlug: string;
  platformDisplayName: string;
  platformIcon: string;
  sourceVideoId: string;
  createdAt: number;
  expiresAt: number;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  description: string;
  views: number;
  uploadDate: string;
  formats: VideoFormatOption[];
  isPlaylist: boolean;
  playlistTitle?: string;
  entries?: VideoEntryPreview[];
  /** Whether ffmpeg is available for MP3 conversion on this server */
  ffmpegAvailable: boolean;
}

/** Public session payload (no internal URL secrets beyond original link) */
export type VideoSessionResponse = Omit<
  VideoSession,
  "createdAt" | "expiresAt"
> & {
  expiresAt: number;
};
