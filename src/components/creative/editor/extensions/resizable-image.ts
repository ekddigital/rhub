/**
 * Resizable Image Extension with Caption, Alignment, Free-Position & SVG Support
 * - Drag-to-resize in edit mode
 * - Alignment controls (left / center / right / inline)
 * - "In Front of Text" absolute positioning with drag-to-reposition
 * - Optional caption display (figcaption-style)
 * - SVG support (inline & file)
 * - No decorative borders on images
 * - Outputs <img> with width, data-caption, data-alignment, data-x, data-y attributes
 */

import Image from "@tiptap/extension-image";

export const ResizableImage = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("width") || element.style.width || null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("height") || element.style.height || null,
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-caption"),
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return { "data-caption": attributes.caption };
        },
      },
      alignment: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-alignment") || "center",
        renderHTML: (attributes) => {
          return { "data-alignment": attributes.alignment || "center" };
        },
      },
      // Absolute position offsets for "In Front of Text" mode
      posX: {
        default: null,
        parseHTML: (element) => {
          const v = element.getAttribute("data-pos-x");
          return v ? parseFloat(v) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.posX == null) return {};
          return { "data-pos-x": String(attributes.posX) };
        },
      },
      posY: {
        default: null,
        parseHTML: (element) => {
          const v = element.getAttribute("data-pos-y");
          return v ? parseFloat(v) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.posY == null) return {};
          return { "data-pos-y": String(attributes.posY) };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlignment:
        (alignment: "left" | "center" | "right" | "inline") =>
        ({
          commands,
        }: {
          commands: Record<string, (...args: unknown[]) => boolean>;
        }) => {
          return commands.updateAttributes(this.name, {
            alignment,
            // Clear absolute position when switching to flow alignment
            posX: alignment === "inline" ? undefined : null,
            posY: alignment === "inline" ? undefined : null,
          });
        },
    };
  },

  // Ensure proper HTML serialization for clipboard copy/paste
  renderHTML({ HTMLAttributes }) {
    const attrs: Record<string, string> = {};
    if (HTMLAttributes.src) attrs.src = HTMLAttributes.src;
    if (HTMLAttributes.alt) attrs.alt = HTMLAttributes.alt;
    if (HTMLAttributes.width) attrs.width = String(HTMLAttributes.width);
    if (HTMLAttributes.height) attrs.height = String(HTMLAttributes.height);
    if (HTMLAttributes["data-caption"])
      attrs["data-caption"] = HTMLAttributes["data-caption"];
    if (HTMLAttributes["data-alignment"])
      attrs["data-alignment"] = HTMLAttributes["data-alignment"];
    if (HTMLAttributes["data-pos-x"])
      attrs["data-pos-x"] = HTMLAttributes["data-pos-x"];
    if (HTMLAttributes["data-pos-y"])
      attrs["data-pos-y"] = HTMLAttributes["data-pos-y"];
    return ["img", attrs];
  },

  // Parse pasted HTML images back into ResizableImage nodes
  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let currentNode = node;

      const wrapper = document.createElement("div");
      wrapper.className = "image-node-wrapper";
      wrapper.style.margin = "8px 0";

      const applyAlignment = (
        align: string,
        posX?: number | null,
        posY?: number | null,
      ) => {
        // "inline" mode = absolute positioning in front of text
        // posX/posY are stored as percentages of the container for portability
        if (align === "inline" && posX != null && posY != null) {
          wrapper.style.display = "block";
          wrapper.style.position = "absolute";
          wrapper.style.left = `${posX}%`;
          wrapper.style.top = `${posY}%`;
          wrapper.style.zIndex = "10";
          wrapper.style.flexDirection = "";
          wrapper.style.alignItems = "";
        } else {
          wrapper.style.position = "relative";
          wrapper.style.left = "";
          wrapper.style.top = "";
          wrapper.style.zIndex = "";
          wrapper.style.display = "flex";
          wrapper.style.flexDirection = "column";
          wrapper.style.alignItems =
            align === "left"
              ? "flex-start"
              : align === "right"
                ? "flex-end"
                : "center";
        }
      };
      applyAlignment(
        currentNode.attrs.alignment || "center",
        currentNode.attrs.posX,
        currentNode.attrs.posY,
      );

      const container = document.createElement("div");
      container.className = "relative inline-block group cursor-pointer";
      container.style.maxWidth = "100%";
      container.style.transition = "box-shadow 0.15s ease";

      // References for update() — set inside if(editor.isEditable) block
      let toolbarEl: HTMLDivElement | null = null;
      let captionBtn: HTMLButtonElement | null = null;

      const img = document.createElement("img");
      // Clean image — no borders, no rounded corners by default
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";

      /** Detect SVG sources (URL ending in .svg or data:image/svg+xml) */
      const isSvgSrc = (src: string | null | undefined): boolean => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return (
          lower.endsWith(".svg") ||
          lower.includes(".svg?") ||
          lower.startsWith("data:image/svg+xml")
        );
      };

      const normalize = (value?: string | number | null) => {
        if (!value && value !== 0) return null;
        const s = String(value);
        return /^(\d+(?:\.\d+)?)$/.test(s) ? `${s}px` : s;
      };

      const applyDimensions = (attrs: typeof currentNode.attrs) => {
        img.src = attrs.src;
        img.alt = attrs.alt || "";
        const w = normalize(attrs.width);
        const h = normalize(attrs.height);
        if (w) {
          img.style.width = w;
        } else if (isSvgSrc(attrs.src)) {
          // SVGs without explicit dimensions collapse to 0 in <img> tags.
          // Default to full container width so they're visible and resizable.
          img.style.width = "100%";
        } else {
          img.style.removeProperty("width");
        }
        if (h) {
          img.style.height = h;
        } else {
          img.style.removeProperty("height");
        }
      };

      applyDimensions(currentNode.attrs);

      const commitAttrs = (extra: Record<string, unknown> = {}) => {
        if (!editor?.view.editable) return;
        const pos = typeof getPos === "function" ? getPos() : null;
        if (typeof pos !== "number") return;
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...currentNode.attrs,
          ...extra,
        });
        editor.view.dispatch(tr);
      };

      container.appendChild(img);

      // After the image loads, if it rendered at tiny/zero size (common with
      // SVGs or images lacking intrinsic dimensions), auto-size it and
      // persist the width so the user can resize from a visible state.
      img.addEventListener("load", () => {
        const renderedW = img.offsetWidth;
        const renderedH = img.offsetHeight;
        if (renderedW < 20 || renderedH < 20) {
          const containerW =
            container.offsetWidth || wrapper.offsetWidth || 400;
          img.style.width = `${containerW}px`;
          img.style.height = "auto";
          // Persist so the width survives re-renders
          commitAttrs({ width: containerW });
        }
      });

      if (editor.isEditable) {
        /* ─── Toolbar overlay (alignment + inline mode) ─── */
        const toolbar = document.createElement("div");
        toolbarEl = toolbar;
        toolbar.className =
          "absolute -top-8 left-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all bg-background/95 backdrop-blur border border-border rounded-md shadow-lg px-1 py-0.5";
        toolbar.style.transform = "translateX(-50%)";
        toolbar.style.zIndex = "20";

        const makeBtn = (
          label: string,
          title: string,
          onClick: (e: MouseEvent) => void,
          isActive?: () => boolean,
        ) => {
          const btn = document.createElement("button");
          btn.className =
            "px-1.5 py-0.5 text-[10px] rounded leading-none transition-colors";
          btn.textContent = label;
          btn.title = title;
          const updateActive = () => {
            if (isActive?.()) {
              btn.style.backgroundColor = "rgb(200 160 97 / 0.3)";
              btn.style.color = "#8E0E00";
            } else {
              btn.style.backgroundColor = "transparent";
              btn.style.color = "";
            }
          };
          updateActive();
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
            // Refresh active state after a tick
            setTimeout(updateActive, 50);
          });
          (btn as unknown as { _updateActive: () => void })._updateActive =
            updateActive;
          return btn;
        };

        const alignBtns = [
          makeBtn(
            "◀",
            "Align left",
            () =>
              commitAttrs({
                alignment: "left",
                posX: null,
                posY: null,
                width: img.offsetWidth || currentNode.attrs.width,
                height: img.offsetHeight || currentNode.attrs.height,
              }),
            () => currentNode.attrs.alignment === "left",
          ),
          makeBtn(
            "◆",
            "Align center",
            () =>
              commitAttrs({
                alignment: "center",
                posX: null,
                posY: null,
                width: img.offsetWidth || currentNode.attrs.width,
                height: img.offsetHeight || currentNode.attrs.height,
              }),
            () =>
              currentNode.attrs.alignment === "center" ||
              !currentNode.attrs.alignment,
          ),
          makeBtn(
            "▶",
            "Align right",
            () =>
              commitAttrs({
                alignment: "right",
                posX: null,
                posY: null,
                width: img.offsetWidth || currentNode.attrs.width,
                height: img.offsetHeight || currentNode.attrs.height,
              }),
            () => currentNode.attrs.alignment === "right",
          ),
          makeBtn(
            "▣",
            "In front of text (drag to position)",
            () => {
              // Switch to inline mode at current visual position
              // Convert pixel position to percentage for portability across containers
              const rect = wrapper.getBoundingClientRect();
              const parentRect =
                wrapper.offsetParent?.getBoundingClientRect() || rect;
              const pxX = rect.left - parentRect.left;
              const pxY = rect.top - parentRect.top;
              commitAttrs({
                alignment: "inline",
                posX: parentRect.width
                  ? Math.round((pxX / parentRect.width) * 10000) / 100
                  : 0,
                posY: parentRect.height
                  ? Math.round((pxY / parentRect.height) * 10000) / 100
                  : 0,
                width: img.offsetWidth || currentNode.attrs.width,
                height: img.offsetHeight || currentNode.attrs.height,
              });
            },
            () => currentNode.attrs.alignment === "inline",
          ),
        ];

        // Separator
        const sep = document.createElement("div");
        sep.style.width = "1px";
        sep.style.height = "14px";
        sep.style.backgroundColor = "rgb(0 0 0 / 0.15)";
        sep.style.margin = "0 2px";
        sep.style.alignSelf = "center";

        alignBtns.forEach((btn, idx) => {
          toolbar.appendChild(btn);
          if (idx === 2) toolbar.appendChild(sep); // separator before "inline" btn
        });

        container.appendChild(toolbar);

        /* ─── Free drag handle (for repositioning in any mode) ─── */
        const dragHandle = document.createElement("div");
        dragHandle.className =
          "absolute top-0 left-0 w-6 h-6 cursor-grab opacity-0 group-hover:opacity-80 transition-all flex items-center justify-center";
        dragHandle.style.zIndex = "15";
        dragHandle.title = "Drag to reposition";
        dragHandle.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>';

        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let origLeft = 0;
        let origTop = 0;

        dragHandle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          dragStartX = e.clientX;
          dragStartY = e.clientY;

          // Compute starting position
          const parentRect =
            wrapper.offsetParent?.getBoundingClientRect() ||
            wrapper.parentElement?.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();
          origLeft = wrapperRect.left - (parentRect?.left || 0);
          origTop = wrapperRect.top - (parentRect?.top || 0);

          // Switch to absolute positioning immediately
          wrapper.style.position = "absolute";
          wrapper.style.left = `${origLeft}px`;
          wrapper.style.top = `${origTop}px`;
          wrapper.style.zIndex = "10";
          dragHandle.style.cursor = "grabbing";

          const onMouseMove = (ev: MouseEvent) => {
            if (!isDragging) return;
            const dx = ev.clientX - dragStartX;
            const dy = ev.clientY - dragStartY;
            wrapper.style.left = `${origLeft + dx}px`;
            wrapper.style.top = `${origTop + dy}px`;
          };

          const onMouseUp = (ev: MouseEvent) => {
            if (!isDragging) return;
            isDragging = false;
            dragHandle.style.cursor = "grab";

            const dx = ev.clientX - dragStartX;
            const dy = ev.clientY - dragStartY;
            const finalPxX = origLeft + dx;
            const finalPxY = origTop + dy;

            // Convert pixel position to percentage for portability across containers
            const parentRect =
              wrapper.offsetParent?.getBoundingClientRect() ||
              wrapper.parentElement?.getBoundingClientRect();
            const finalX = parentRect?.width
              ? Math.round((finalPxX / parentRect.width) * 10000) / 100
              : 0;
            const finalY = parentRect?.height
              ? Math.round((finalPxY / parentRect.height) * 10000) / 100
              : 0;

            commitAttrs({
              alignment: "inline",
              posX: finalX,
              posY: finalY,
              width: img.offsetWidth || currentNode.attrs.width,
              height: img.offsetHeight || currentNode.attrs.height,
            });

            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        container.appendChild(dragHandle);

        /* ─── Resize handle ─── */
        const resizeHandle = document.createElement("div");
        resizeHandle.className =
          "absolute bottom-1 right-1 w-5 h-5 bg-primary hover:bg-primary/80 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-all shadow-md flex items-center justify-center";
        resizeHandle.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizeHandle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          startX = e.clientX;
          startWidth = img.offsetWidth;

          container.style.boxShadow = "0 0 0 2px rgb(200 160 97 / 0.5)";
          resizeHandle.style.opacity = "1";

          const onMouseMove = (ev: MouseEvent) => {
            if (!isResizing) return;
            const newW = Math.max(50, startWidth + (ev.clientX - startX));
            img.style.width = `${newW}px`;
            img.style.height = "auto";
          };

          const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            container.style.boxShadow = "none";
            commitAttrs({
              width: img.offsetWidth,
              height: img.offsetHeight,
            });
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
        container.appendChild(resizeHandle);

        /* ─── Caption button ─── */
        const captionButton = document.createElement("button");
        captionBtn = captionButton;
        captionButton.className =
          "absolute top-1 right-1 px-2 py-0.5 text-[10px] bg-background/90 hover:bg-background text-foreground border border-border rounded opacity-0 group-hover:opacity-100 transition-all shadow-sm";
        captionButton.textContent = currentNode.attrs.caption
          ? "Edit Caption"
          : "Add Caption";
        captionButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newCaption = prompt(
            "Enter image caption:",
            currentNode.attrs.caption || "",
          );
          if (newCaption !== null) {
            commitAttrs({ caption: newCaption });
          }
        };
        container.appendChild(captionButton);
      }

      wrapper.appendChild(container);

      // Caption below image
      const renderCaption = () => {
        const existing = wrapper.querySelector(".image-caption");
        if (existing) existing.remove();
        if (currentNode.attrs.caption) {
          const cap = document.createElement("p");
          cap.className =
            "image-caption text-sm text-muted-foreground text-center mt-2 italic";
          cap.textContent = currentNode.attrs.caption;
          wrapper.appendChild(cap);
        }
      };
      renderCaption();

      return {
        dom: wrapper,
        // Allow node selection for copy/paste operations
        selectNode() {
          wrapper.classList.add("ProseMirror-selectednode");
          container.style.boxShadow = "0 0 0 2px rgb(200 160 97 / 0.4)";
        },
        deselectNode() {
          wrapper.classList.remove("ProseMirror-selectednode");
          container.style.boxShadow = "none";
        },
        // Don't stop selection events — let ProseMirror handle copy/paste
        stopEvent(event: Event) {
          // Allow mouse events on buttons (resize, align, caption, drag)
          if (
            event.target !== wrapper &&
            event.target !== container &&
            event.target !== img
          ) {
            if (event instanceof MouseEvent) return true;
          }
          return false;
        },
        update(updatedNode) {
          if (updatedNode.type !== currentNode.type) return false;
          currentNode = updatedNode;
          applyDimensions(updatedNode.attrs);
          applyAlignment(
            updatedNode.attrs.alignment || "center",
            updatedNode.attrs.posX,
            updatedNode.attrs.posY,
          );
          renderCaption();

          // Update active states on alignment buttons
          if (toolbarEl) {
            const allBtns = toolbarEl.querySelectorAll("button");
            allBtns.forEach((btn) => {
              const fn = (btn as unknown as { _updateActive?: () => void })
                ._updateActive;
              fn?.();
            });
          }

          // Update caption button text
          if (captionBtn) {
            captionBtn.textContent = updatedNode.attrs.caption
              ? "Edit Caption"
              : "Add Caption";
          }

          return true;
        },
      };
    };
  },
});
