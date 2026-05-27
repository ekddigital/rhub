import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const tiktokPlatform = createPlatform({
  id: "tk",
  routeSlug: "tiktok",
  name: "tiktok",
  displayName: "TikTok",
  icon: "🎵",
  status: "coming-soon",
  urlPattern:
    /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/,
  urlPlaceholder: "https://www.tiktok.com/@user/video/...",
  videoQualities: pickVideoQualities(["1080p", "720p"]),
  audioQualities: pickAudioQualities(["192k", "128k"]),
  supportedFormats: [formats.mp4, formats.mp3],
  features: [
    "No watermark option",
    "Audio extraction",
    "HD quality",
    "Fast download",
  ],
});
