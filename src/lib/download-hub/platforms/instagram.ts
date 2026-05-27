import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const instagramPlatform = createPlatform({
  id: "ig",
  routeSlug: "ig",
  name: "instagram",
  displayName: "Instagram",
  icon: "📸",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?(www\.)?instagram\.com\/((p|reel|reels|tv)\/[a-zA-Z0-9_-]+|share\/(p|reel)\/[a-zA-Z0-9_-]+|stories\/[^/?#]+(?:\/\d+)?)/,
  urlPlaceholder:
    "https://www.instagram.com/reel/... or /p/... or /share/reel/...",
  videoQualities: pickVideoQualities(["1080p", "720p", "480p"]),
  audioQualities: pickAudioQualities(["192k", "128k"]),
  supportedFormats: [formats.mp4, formats.m4a],
  features: [
    "Posts, Reels, and IGTV",
    "Share links",
    "Stories (may need cookies)",
    "Audio extraction",
    "Quick download",
  ],
});
