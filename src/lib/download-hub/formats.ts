import type { AudioQuality, DownloadFormat, VideoQuality } from "./types";

export const formats: Record<string, DownloadFormat> = {
  mp4: {
    id: "mp4",
    name: "MP4",
    ext: ".mp4",
    mime: "video/mp4",
    type: "video",
    supportsQuality: true,
  },
  webm: {
    id: "webm",
    name: "WebM",
    ext: ".webm",
    mime: "video/webm",
    type: "video",
    supportsQuality: true,
  },
  mp3: {
    id: "mp3",
    name: "MP3",
    ext: ".mp3",
    mime: "audio/mpeg",
    type: "audio",
    supportsQuality: true,
  },
  m4a: {
    id: "m4a",
    name: "M4A",
    ext: ".m4a",
    mime: "audio/mp4",
    type: "audio",
    supportsQuality: true,
  },
  wav: {
    id: "wav",
    name: "WAV",
    ext: ".wav",
    mime: "audio/wav",
    type: "audio",
    supportsQuality: false,
  },
};

export const videoQualities: VideoQuality[] = [
  {
    id: "2160p",
    label: "4K (2160p)",
    resolution: "3840x2160",
    format: "mp4",
    bitrate: "40-50 Mbps",
  },
  {
    id: "1440p",
    label: "2K (1440p)",
    resolution: "2560x1440",
    format: "mp4",
    bitrate: "16-20 Mbps",
  },
  {
    id: "1080p",
    label: "Full HD (1080p)",
    resolution: "1920x1080",
    format: "mp4",
    bitrate: "8-10 Mbps",
  },
  {
    id: "720p",
    label: "HD (720p)",
    resolution: "1280x720",
    format: "mp4",
    bitrate: "5 Mbps",
  },
  {
    id: "480p",
    label: "SD (480p)",
    resolution: "854x480",
    format: "mp4",
    bitrate: "2.5 Mbps",
  },
  {
    id: "360p",
    label: "Low (360p)",
    resolution: "640x360",
    format: "mp4",
    bitrate: "1 Mbps",
  },
];

export const audioQualities: AudioQuality[] = [
  { id: "320k", label: "High (320 kbps)", bitrate: "320k", format: "mp3" },
  { id: "256k", label: "Very Good (256 kbps)", bitrate: "256k", format: "mp3" },
  { id: "192k", label: "Good (192 kbps)", bitrate: "192k", format: "mp3" },
  { id: "128k", label: "Standard (128 kbps)", bitrate: "128k", format: "mp3" },
];

export function pickVideoQualities(
  ids: Array<VideoQuality["id"]>,
): VideoQuality[] {
  return ids
    .map((id) => videoQualities.find((q) => q.id === id))
    .filter((q): q is VideoQuality => q !== undefined);
}

export function pickAudioQualities(
  ids: Array<AudioQuality["id"]>,
): AudioQuality[] {
  return ids
    .map((id) => audioQualities.find((q) => q.id === id))
    .filter((q): q is AudioQuality => q !== undefined);
}
