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
