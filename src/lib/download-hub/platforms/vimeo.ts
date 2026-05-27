import { audioQualities, formats, videoQualities } from "../formats";
import { createPlatform } from "./_shared";

export const vimeoPlatform = createPlatform({
  id: "vm",
  routeSlug: "vimeo",
  name: "vimeo",
  displayName: "Vimeo",
  icon: "🎬",
  status: "coming-soon",
  urlPattern: /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/,
  urlPlaceholder: "https://vimeo.com/123456789",
  videoQualities,
  audioQualities,
  supportedFormats: [formats.mp4, formats.mp3],
  features: [
    "High quality",
    "Multiple formats",
    "Audio extraction",
    "Professional content",
  ],
});
