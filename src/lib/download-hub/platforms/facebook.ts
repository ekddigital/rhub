import { formats, pickAudioQualities, pickVideoQualities } from "../formats";
import { createPlatform } from "./_shared";

function extractFacebookMediaId(url: string): string | null {
  const trimmed = url.trim();
  const share = trimmed.match(/\/share\/(?:v|r|reel)\/([\w-]+)/i);
  if (share?.[1]) return share[1];
  const fbWatch = trimmed.match(/fb\.watch\/([\w-]+)/i);
  if (fbWatch?.[1]) return fbWatch[1];
  const watch = trimmed.match(/[?&]v=(\d+)/);
  if (watch?.[1]) return watch[1];
  const reel = trimmed.match(/\/reels?\/(\d+)/i);
  if (reel?.[1]) return reel[1];
  const videos = trimmed.match(/\/videos\/(\d+)/i);
  if (videos?.[1]) return videos[1];
  const pageVideo = trimmed.match(/\/[^/?#]+\/videos\/(\d+)/i);
  if (pageVideo?.[1]) return pageVideo[1];
  return trimmed.match(
    /^(https?:\/\/)?((www\.|m\.|web\.)?facebook\.com\/((watch|reel|reels|videos|video\.php|share\.php|share\/(v|r|reel)|groups\/[^/]+\/posts)(\/|\?|$)|[^/?#]+\/videos\/\d+)|fb\.watch\/[\w-]+)/i,
  )?.[0]
    ? trimmed
    : null;
}

export const facebookPlatform = createPlatform({
  id: "fb",
  routeSlug: "fb",
  name: "facebook",
  displayName: "Facebook",
  icon: "📘",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?((www\.|m\.|web\.)?facebook\.com\/((watch|reel|reels|videos|video\.php|share\.php|share\/(?:v|r|reel)(?:\/[\w-]+)?|groups\/[^/]+\/posts)(\/|\?|$)|[^/?#]+\/videos\/\d+)|fb\.watch\/[\w-]+)/i,
  urlPlaceholder:
    "https://www.facebook.com/watch?v=... or /share/v/... or fb.watch/...",
  extractMediaId: extractFacebookMediaId,
  videoQualities: pickVideoQualities(["1080p", "720p", "480p"]),
  audioQualities: pickAudioQualities(["192k", "128k"]),
  supportedFormats: [formats.mp4, formats.m4a],
  features: [
    "Watch videos",
    "Reels and share links",
    "Audio extraction",
    "HD quality",
  ],
});
