import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const twitterPlatform = createPlatform({
  id: "tw",
  routeSlug: "x",
  name: "twitter",
  displayName: "Twitter/X",
  icon: "🐦",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?((www\.|mobile\.)?(twitter\.com|x\.com)\/([\w.]+\/status\/\d+|i\/(web\/)?status\/\d+)|t\.co\/[A-Za-z0-9]+)/i,
  urlPlaceholder: "https://x.com/user/status/... or t.co/...",
  videoQualities: pickVideoQualities(["1080p", "720p", "480p"]),
  audioQualities: pickAudioQualities(["128k"]),
  supportedFormats: [formats.mp4, formats.m4a],
  features: ["HD quality", "Audio extraction", "Quick processing"],
});
