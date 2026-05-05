/**
 * Custom YouTube Extension with Edit/Preview Mode Support
 * Shows editable link text in edit mode, embedded player in preview
 */

import { Node, mergeAttributes, nodePasteRule } from "@tiptap/core";

export interface YoutubeOptions {
  addPasteHandler: boolean;
  allowFullscreen: boolean;
  autoplay: boolean;
  controls: boolean;
  modestBranding: boolean;
  nocookie: boolean;
  width: number;
  height: number;
  HTMLAttributes: Record<string, unknown>;
  inline: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: {
        src: string;
        width?: number;
        height?: number;
        caption?: string;
      }) => ReturnType;
    };
  }
}

const YOUTUBE_REGEX_GLOBAL =
  /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/g;

const isValidYoutubeUrl = (url: string) => {
  return url.match(
    /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/
  );
};

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const getEmbedUrl = (url: string, nocookie: boolean = true): string => {
  const videoId = extractVideoId(url);
  if (!videoId) return url;

  const baseUrl = nocookie
    ? "https://www.youtube-nocookie.com/embed/"
    : "https://www.youtube.com/embed/";

  return `${baseUrl}${videoId}`;
};

export const Youtube = Node.create<YoutubeOptions>({
  name: "youtube",

  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      autoplay: false,
      controls: true,
      modestBranding: true,
      nocookie: true,
      width: 640,
      height: 360,
      HTMLAttributes: {},
      inline: false,
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-youtube-video] iframe",
      },
    ];
  },

  addCommands() {
    return {
      setYoutubeVideo:
        (options: {
          src: string;
          width?: number;
          height?: number;
          caption?: string;
        }) =>
        ({ commands }) => {
          if (!isValidYoutubeUrl(options.src)) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return [];
    }

    return [
      nodePasteRule({
        find: YOUTUBE_REGEX_GLOBAL,
        type: this.type,
        getAttributes: (match) => {
          return { src: match.input };
        },
      }),
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement("div");
      container.className = "youtube-node-wrapper my-4";
      container.setAttribute("data-youtube-video", "");

      // const videoId = extractVideoId(node.attrs.src);
      const embedUrl = getEmbedUrl(node.attrs.src, this.options.nocookie);

      if (editor.isEditable) {
        // Edit mode: Show editable link text
        const editContainer = document.createElement("div");
        editContainer.className =
          "flex items-center gap-3 p-4 border-2 border-secondary/30 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer";
        editContainer.contentEditable = "false";

        // YouTube icon
        const icon = document.createElement("div");
        icon.className = "flex-shrink-0 text-red-600";
        icon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        `;
        editContainer.appendChild(icon);

        // Text content
        const textContainer = document.createElement("div");
        textContainer.className = "flex-1 min-w-0";

        const linkText = document.createElement("div");
        linkText.className = "font-medium text-secondary truncate";
        linkText.textContent = node.attrs.caption || "YouTube Video";

        const urlText = document.createElement("div");
        urlText.className = "text-xs text-muted-foreground truncate";
        urlText.textContent = node.attrs.src;

        textContainer.appendChild(linkText);
        textContainer.appendChild(urlText);
        editContainer.appendChild(textContainer);

        // Edit button
        const editButton = document.createElement("button");
        editButton.className =
          "flex-shrink-0 px-3 py-1 text-sm bg-secondary/20 hover:bg-secondary/30 rounded border border-secondary/30 transition-colors";
        editButton.textContent = "Edit";
        editButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const newCaption = prompt(
            "Enter caption:",
            node.attrs.caption || "YouTube Video"
          );
          if (newCaption !== null && typeof getPos === "function") {
            const pos = getPos();
            if (typeof pos === "number") {
              const transaction = editor.state.tr.setNodeMarkup(
                pos,
                undefined,
                {
                  ...node.attrs,
                  caption: newCaption || "YouTube Video",
                }
              );
              editor.view.dispatch(transaction);
            }
          }
        };
        editContainer.appendChild(editButton);

        // Preview on click
        editContainer.onclick = (e) => {
          if (e.target !== editButton) {
            window.open(node.attrs.src, "_blank");
          }
        };

        container.appendChild(editContainer);
      } else {
        // Preview mode: Show embedded iframe
        const iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.width = String(node.attrs.width || this.options.width);
        iframe.height = String(node.attrs.height || this.options.height);
        iframe.frameBorder = "0";
        iframe.allowFullscreen = this.options.allowFullscreen;
        iframe.className =
          "video-embed youtube-embed rounded-xl overflow-hidden shadow-xl w-full";

        const videoWrapper = document.createElement("div");
        videoWrapper.className = "aspect-video";
        videoWrapper.appendChild(iframe);
        container.appendChild(videoWrapper);

        // Caption below video (if provided)
        if (node.attrs.caption) {
          const caption = document.createElement("p");
          caption.className =
            "text-sm text-muted-foreground text-center mt-2 italic";
          caption.textContent = node.attrs.caption;
          container.appendChild(caption);
        }
      }

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "youtube") {
            return false;
          }

          // Re-render on attribute changes by clearing and rebuilding
          container.innerHTML = "";

          // const newVideoId = extractVideoId(updatedNode.attrs.src);
          const newEmbedUrl = getEmbedUrl(
            updatedNode.attrs.src,
            this.options.nocookie
          );

          if (editor.isEditable) {
            // Rebuild edit view
            const editContainer = document.createElement("div");
            editContainer.className =
              "flex items-center gap-3 p-4 border-2 border-secondary/30 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer";
            editContainer.contentEditable = "false";

            const icon = document.createElement("div");
            icon.className = "flex-shrink-0 text-red-600";
            icon.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            `;
            editContainer.appendChild(icon);

            const textContainer = document.createElement("div");
            textContainer.className = "flex-1 min-w-0";

            const linkText = document.createElement("div");
            linkText.className = "font-medium text-secondary truncate";
            linkText.textContent = updatedNode.attrs.caption || "YouTube Video";

            const urlText = document.createElement("div");
            urlText.className = "text-xs text-muted-foreground truncate";
            urlText.textContent = updatedNode.attrs.src;

            textContainer.appendChild(linkText);
            textContainer.appendChild(urlText);
            editContainer.appendChild(textContainer);

            const editButton = document.createElement("button");
            editButton.className =
              "flex-shrink-0 px-3 py-1 text-sm bg-secondary/20 hover:bg-secondary/30 rounded border border-secondary/30 transition-colors";
            editButton.textContent = "Edit";
            editButton.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();

              const newCaption = prompt(
                "Enter caption:",
                updatedNode.attrs.caption || "YouTube Video"
              );
              if (newCaption !== null && typeof getPos === "function") {
                const pos = getPos();
                if (typeof pos === "number") {
                  const transaction = editor.state.tr.setNodeMarkup(
                    pos,
                    undefined,
                    {
                      ...updatedNode.attrs,
                      caption: newCaption || "YouTube Video",
                    }
                  );
                  editor.view.dispatch(transaction);
                }
              }
            };
            editContainer.appendChild(editButton);

            editContainer.onclick = (e) => {
              if (e.target !== editButton) {
                window.open(updatedNode.attrs.src, "_blank");
              }
            };

            container.appendChild(editContainer);
          } else {
            // Rebuild preview view
            const iframe = document.createElement("iframe");
            iframe.src = newEmbedUrl;
            iframe.width = String(
              updatedNode.attrs.width || this.options.width
            );
            iframe.height = String(
              updatedNode.attrs.height || this.options.height
            );
            iframe.frameBorder = "0";
            iframe.allowFullscreen = this.options.allowFullscreen;
            iframe.className =
              "video-embed youtube-embed rounded-xl overflow-hidden shadow-xl w-full";

            const videoWrapper = document.createElement("div");
            videoWrapper.className = "aspect-video";
            videoWrapper.appendChild(iframe);
            container.appendChild(videoWrapper);

            if (updatedNode.attrs.caption) {
              const caption = document.createElement("p");
              caption.className =
                "text-sm text-muted-foreground text-center mt-2 italic";
              caption.textContent = updatedNode.attrs.caption;
              container.appendChild(caption);
            }
          }

          return true;
        },
      };
    };
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = getEmbedUrl(HTMLAttributes.src, this.options.nocookie);

    return [
      "div",
      { "data-youtube-video": "" },
      [
        "iframe",
        mergeAttributes(this.options.HTMLAttributes, {
          src: embedUrl,
          width: this.options.width,
          height: this.options.height,
          frameborder: 0,
          allowfullscreen: this.options.allowFullscreen,
        }),
      ],
    ];
  },
});
