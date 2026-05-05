/**
 * Modular Rich Text Editor
 * Clean implementation using TipTap with separated toolbar and extensions
 */

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./EditorToolbar";
import { createEditorExtensions } from "./extensions";
import type { EditorToolbarConfig } from "../types";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
  toolbarConfig?: EditorToolbarConfig;
  toolbarOffset?: string | number;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
  minHeight = "400px",
  toolbarConfig,
  toolbarOffset = "4.5rem",
}: RichTextEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarMetrics, setToolbarMetrics] = useState({
    isFloating: false,
    width: 0,
    left: 0,
    height: 0,
  });

  const editor = useEditor({
    extensions: createEditorExtensions(placeholder),
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          // Plain editor view — minimal styling, content-focused
          // Full prose styling is applied only in Preview / published views
          "max-w-none focus:outline-none p-6",
          "text-base leading-relaxed",
          // Minimal structural differentiation only
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2",
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2",
          "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1",
          "[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1",
          "[&_p]:mb-3",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
          "[&_li]:my-0.5",
          "[&_hr]:my-4 [&_hr]:border-border/50",
          "[&_table]:border-collapse [&_table]:w-full [&_table]:my-4",
          "[&_td]:border [&_td]:border-border [&_td]:p-2",
          "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-bold",
          className,
        ),
      },
      // Handle image/file drops directly into the editor
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const file = files[0];
        if (!file.type.startsWith("image/") && file.type !== "image/svg+xml") {
          return false;
        }

        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          const { pos } = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          }) || { pos: view.state.selection.from };
          const isSvg =
            file.type === "image/svg+xml" ||
            file.name.toLowerCase().endsWith(".svg");
          const node = view.state.schema.nodes.image?.create({
            src,
            alt: file.name,
            ...(isSvg ? { width: "100%" } : {}),
          });
          if (node) {
            const tr = view.state.tr.insert(pos, node);
            view.dispatch(tr);
          }
        };
        reader.readAsDataURL(file);
        return true;
      },
      // Handle pasted images from clipboard
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        // 1. Check for direct image blobs (e.g. screenshot paste, Ctrl+V from image editor)
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = () => {
              const src = reader.result as string;
              const node = view.state.schema.nodes.image?.create({
                src,
                alt: "Pasted image",
              });
              if (node) {
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }

        // 2. Check for HTML-embedded images (e.g. right-click "Copy Image" from browser)
        const htmlData = event.clipboardData?.getData("text/html");
        if (htmlData) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlData, "text/html");
          const imgs = doc.querySelectorAll("img[src]");
          if (imgs.length > 0) {
            // If the pasted HTML contains ONLY image(s) and no meaningful text,
            // treat it as an image paste
            const textContent = doc.body?.textContent?.trim() || "";
            const hasOnlyImages = textContent.length === 0 || imgs.length > 0;
            if (hasOnlyImages && imgs.length <= 3) {
              event.preventDefault();
              imgs.forEach((img) => {
                const src = img.getAttribute("src");
                if (!src) return;

                // For external URLs, fetch and convert to data URL for reliability
                if (src.startsWith("http")) {
                  fetch(src, { mode: "cors" })
                    .then((res) => res.blob())
                    .then((blob) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const node = view.state.schema.nodes.image?.create({
                          src: dataUrl,
                          alt: img.getAttribute("alt") || "Pasted image",
                        });
                        if (node) {
                          const tr = view.state.tr.replaceSelectionWith(node);
                          view.dispatch(tr);
                        }
                      };
                      reader.readAsDataURL(blob);
                    })
                    .catch(() => {
                      // Fallback: insert with original URL
                      const node = view.state.schema.nodes.image?.create({
                        src,
                        alt: img.getAttribute("alt") || "Pasted image",
                      });
                      if (node) {
                        const tr = view.state.tr.replaceSelectionWith(node);
                        view.dispatch(tr);
                      }
                    });
                } else {
                  // Already a data URL or relative path
                  const node = view.state.schema.nodes.image?.create({
                    src,
                    alt: img.getAttribute("alt") || "Pasted image",
                  });
                  if (node) {
                    const tr = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(tr);
                  }
                }
              });
              return true;
            }
          }
        }

        return false;
      },
    },
  });

  const resolvedToolbarOffset =
    typeof toolbarOffset === "number"
      ? `${toolbarOffset}px`
      : toolbarOffset || "0";

  const updateToolbarMetrics = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !editorContainerRef.current ||
      !toolbarRef.current
    ) {
      return;
    }

    // Detect if the editor is inside an overflow scroll container.
    // If so, position: sticky works correctly — never switch to fixed.
    let hasScrollParent = false;
    let el: HTMLElement | null = editorContainerRef.current.parentElement;
    while (el) {
      const overflow = window.getComputedStyle(el).overflowY;
      if (overflow === "auto" || overflow === "scroll") {
        hasScrollParent = true;
        break;
      }
      el = el.parentElement;
    }

    if (hasScrollParent) {
      // position: sticky is sufficient inside overflow containers.
      // Switching to fixed would place the toolbar at the viewport top
      // (potentially behind the page header), so we never float here.
      setToolbarMetrics((prev) => {
        if (prev.isFloating) {
          return { ...prev, isFloating: false };
        }
        return prev;
      });
      return;
    }

    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const toolbarHeight = toolbarRef.current.offsetHeight || 0;
    const computedTop = window
      .getComputedStyle(toolbarRef.current)
      .top.replace("px", "");
    const offsetPx = parseFloat(computedTop) || 0;
    const shouldFloat =
      containerRect.top < offsetPx &&
      containerRect.bottom - toolbarHeight > offsetPx;

    setToolbarMetrics((prev) => {
      const next = {
        isFloating: shouldFloat,
        width: containerRect.width,
        left: containerRect.left,
        height: toolbarHeight,
      };

      if (
        prev.isFloating !== next.isFloating ||
        Math.abs(prev.width - next.width) > 1 ||
        Math.abs(prev.left - next.left) > 1 ||
        Math.abs(prev.height - next.height) > 1
      ) {
        return next;
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    updateToolbarMetrics();
  }, [updateToolbarMetrics, editor]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => updateToolbarMetrics();

    // Listen on window scroll
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    // Also listen on the nearest scrollable ancestor (for overflow containers)
    let scrollParent: HTMLElement | null = null;
    if (editorContainerRef.current) {
      let el: HTMLElement | null = editorContainerRef.current.parentElement;
      while (el) {
        const overflow = window.getComputedStyle(el).overflowY;
        if (overflow === "auto" || overflow === "scroll") {
          scrollParent = el;
          break;
        }
        el = el.parentElement;
      }
      if (scrollParent) {
        scrollParent.addEventListener("scroll", handleScroll, {
          passive: true,
        });
      }
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollParent) {
        scrollParent.removeEventListener("scroll", handleScroll);
      }
    };
  }, [updateToolbarMetrics]);

  useEffect(() => {
    if (!editorContainerRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => updateToolbarMetrics());
    resizeObserver.observe(editorContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [updateToolbarMetrics]);

  if (!editor) {
    return null;
  }

  const toolbarStyle = toolbarMetrics.isFloating
    ? {
        position: "fixed" as const,
        top: resolvedToolbarOffset,
        width:
          toolbarMetrics.width > 0 ? `${toolbarMetrics.width}px` : undefined,
        left: `${toolbarMetrics.left}px`,
      }
    : {
        position: "sticky" as const,
        top: resolvedToolbarOffset,
      };

  const editorContentStyle: CSSProperties = {
    minHeight,
    paddingTop: toolbarMetrics.isFloating ? toolbarMetrics.height : undefined,
  };

  return (
    <div
      ref={editorContainerRef}
      className="border rounded-lg bg-background relative"
    >
      <div
        ref={toolbarRef}
        className={cn(
          "inset-x-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
          toolbarMetrics.isFloating ? "shadow-lg" : "shadow-sm",
        )}
        style={toolbarStyle}
      >
        <EditorToolbar editor={editor} config={toolbarConfig} />
      </div>
      <div style={editorContentStyle} className="overflow-visible">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
