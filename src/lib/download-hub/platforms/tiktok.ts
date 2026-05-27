import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const tiktokPlatform = createPlatform({
  id: "tk",
  routeSlug: "tiktok",
  name: "tiktok",
  displayName: "TikTok",
  icon: "🎵",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?((www\.|m\.)?tiktok\.com\/(@[\w.-]+\/video\/\d+|t\/[\w-]+|[\w@./-]+)|(vm|vt)\.tiktok\.com\/[\w-]+\/?)/i,
  urlPlaceholder:
    "https://www.tiktok.com/@user/video/... or /t/... or vm.tiktok.com/...",
  videoQualities: pickVideoQualities(["1080p", "720p"]),
  audioQualities: pickAudioQualities(["192k", "128k"]),
  supportedFormats: [formats.mp4, formats.m4a],
  features: [
    "No watermark option",
    "Audio extraction",
    "HD quality",
    "Fast download",
  ],
});
