import { audioQualities, formats, videoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const youtubePlatform = createPlatform({
  id: "yt",
  routeSlug: "yt",
  name: "youtube",
  displayName: "YouTube",
  icon: "🎥",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?((?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  urlPlaceholder:
    "https://www.youtube.com/watch?v=... or youtu.be/... or /shorts/...",
  videoQualities,
  audioQualities,
  supportedFormats: [formats.mp4, formats.webm, formats.mp3, formats.m4a],
  features: [
    "Multiple quality options",
    "Audio extraction",
    "Shorts and live URLs",
    "yt-dlp extraction",
  ],
  extractGroupIndex: 3,
});
