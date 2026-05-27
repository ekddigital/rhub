import { audioQualities, formats, videoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const vimeoPlatform = createPlatform({
  id: "vm",
  routeSlug: "vimeo",
  name: "vimeo",
  displayName: "Vimeo",
  icon: "🎬",
  status: "live",
  urlPattern:
    /^(https?:\/\/)?(www\.)?(vimeo\.com\/(?:.*\/)?\d+(?:$|[/?#])|player\.vimeo\.com\/video\/\d+)/i,
  urlPlaceholder:
    "https://vimeo.com/123456789 or vimeo.com/channels/.../123456789",
  videoQualities,
  audioQualities,
  supportedFormats: [formats.mp4, formats.m4a],
  features: [
    "High quality",
    "Multiple formats",
    "Audio extraction",
    "Professional content",
  ],
});
