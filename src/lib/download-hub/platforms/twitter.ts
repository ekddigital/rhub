import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const twitterPlatform = createPlatform({
  id: "tw",
  routeSlug: "x",
  name: "twitter",
  displayName: "Twitter/X",
  icon: "🐦",
  status: "coming-soon",
  urlPattern:
    /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.*\/status\/\d+/,
  urlPlaceholder: "https://x.com/user/status/...",
  videoQualities: pickVideoQualities(["1080p", "720p", "480p"]),
  audioQualities: pickAudioQualities(["128k"]),
  supportedFormats: [formats.mp4, formats.mp3],
  features: ["HD quality", "Audio extraction", "Quick processing"],
});
