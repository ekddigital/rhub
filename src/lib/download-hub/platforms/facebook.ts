import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const facebookPlatform = createPlatform({
  id: "fb",
  routeSlug: "fb",
  name: "facebook",
  displayName: "Facebook",
  icon: "📘",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch|fb\.com)\/(watch|reel|reels|videos|share\/v|video\.php)/,
  urlPlaceholder: "https://www.facebook.com/watch?v=...",
  videoQualities: pickVideoQualities(["1080p", "720p", "480p"]),
  audioQualities: pickAudioQualities(["192k", "128k"]),
  supportedFormats: [formats.mp4, formats.m4a],
  features: ["Watch videos", "Reels", "Audio extraction", "HD quality"],
});
