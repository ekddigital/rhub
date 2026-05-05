/**
 * TipTap node to handle uploaded/local video embeds inside the editor
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface VideoNodeAttrs {
  src: string;
  title?: string | null;
  poster?: string | null;
  width?: string | number | null;
  height?: string | number | null;
  caption?: string | null;
}

export const VideoBlock = Node.create({
  name: "videoBlock",

  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "video-embed my-6",
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      poster: {
        default: null,
      },
      width: {
        default: "100%",
      },
      height: {
        default: null,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    const parseFromContainer = (element: HTMLElement) => {
      const videoEl = element.querySelector("video") as HTMLVideoElement | null;
      const sourceEl =
        videoEl?.getAttribute("src") ||
        videoEl?.querySelector("source")?.getAttribute("src") ||
        element.getAttribute("data-src");

      if (!sourceEl) {
        return false;
      }

      const readDimension = (value?: string | null) => {
        if (!value) return null;
        return value;
      };

      return {
        src: sourceEl,
        title:
          element.getAttribute("data-title") ||
          videoEl?.getAttribute("title") ||
          videoEl?.getAttribute("aria-label"),
        poster:
          element.getAttribute("data-poster") ||
          videoEl?.getAttribute("poster") ||
          null,
        width:
          element.getAttribute("data-width") ||
          readDimension(videoEl?.getAttribute("width")) ||
          null,
        height:
          element.getAttribute("data-height") ||
          readDimension(videoEl?.getAttribute("height")) ||
          null,
      };
    };

    const parseFromVideoElement = (element: HTMLVideoElement) => {
      const sourceEl =
        element.getAttribute("src") ||
        element.querySelector("source")?.getAttribute("src") ||
        element.dataset.src;

      if (!sourceEl) {
        return false;
      }

      return {
        src: sourceEl,
        title:
          element.getAttribute("title") ||
          element.getAttribute("aria-label") ||
          null,
        poster: element.getAttribute("poster") || null,
        width: element.getAttribute("width") || null,
        height: element.getAttribute("height") || null,
      };
    };

    return [
      {
        tag: 'div[data-type="video-block"]',
        getAttrs: (element) => parseFromContainer(element as HTMLElement),
      },
      {
        tag: 'figure[data-type="video-block"]',
        getAttrs: (element) => parseFromContainer(element as HTMLElement),
      },
      {
        tag: "figure[data-rendered-video]",
        getAttrs: (element) => parseFromContainer(element as HTMLElement),
      },
      {
        tag: "video",
        getAttrs: (element) =>
          parseFromVideoElement(element as HTMLVideoElement),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, title, poster, width, height, caption } = HTMLAttributes;

    if (!src) {
      return ["div", { class: "hidden" }];
    }

    const videoAttributes: Record<string, string> = {
      src,
      controls: "true",
      preload: "metadata",
      class:
        "w-full h-auto rounded-2xl shadow-xl border border-black/5 dark:border-white/10",
    };

    if (title) {
      videoAttributes.title = title;
    }
    if (poster) {
      videoAttributes.poster = poster;
    }
    if (width) {
      videoAttributes.width = String(width);
    }
    if (height) {
      videoAttributes.height = String(height);
    }

    videoAttributes["data-rendered-video"] = "true";

    const wrapperAttributes = mergeAttributes(this.options.HTMLAttributes, {
      "data-type": "video-block",
      "data-src": src,
      "data-title": title || "",
      "data-poster": poster || "",
      "data-width": width ? String(width) : "",
      "data-height": height ? String(height) : "",
      "data-caption": caption || "",
      "data-rendered-video": "true",
    });

    const elements: [
      string,
      Record<string, string> | string | null,
      string?
    ][] = [["video", videoAttributes]];

    if (caption) {
      elements.push([
        "p",
        { class: "text-sm text-muted-foreground text-center mt-2 italic" },
        caption,
      ]);
    }

    return ["div", wrapperAttributes, ...elements];
  },

  addCommands() {
    return {
      setVideo:
        (options: VideoNodeAttrs) =>
        ({ commands }) => {
          console.log("[VideoBlock] setVideo command called with:", options);

          if (!options?.src) {
            console.error("[VideoBlock] setVideo failed - no src provided");
            return false;
          }

          const result = commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              title: options.title || '',
              poster: options.poster,
              width: options.width || 640,
              height: options.height || 360,
              caption: options.caption,
            },
          });

          console.log("[VideoBlock] insertContent result:", result);
          return result;
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoBlock: {
      /**
       * Insert a video block
       */
      setVideo: (options: VideoNodeAttrs) => ReturnType;
    };
  }
}
