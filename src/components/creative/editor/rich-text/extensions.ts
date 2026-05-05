/**
 * TipTap Editor Extensions Setup
 *
 * The editor intentionally shows PLAIN monochrome code (no syntax highlighting).
 * Syntax highlighting is applied only in Preview / published views via Shiki
 * (see lib/utils/code-formatter.ts → enhanceCodeBlocks).
 */

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { mergeAttributes } from "@tiptap/core";
import { Markdown } from "tiptap-markdown";
import { VideoBlock } from "./video-extension";
import { CodeTabs } from "../extensions/CodeTabs";
import { Youtube } from "../extensions/youtube";
import { ResizableImage } from "../extensions/resizable-image";
import { FontSize } from "../extensions/font-size";

const EnhancedCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "text",
        parseHTML: (element) => {
          const dom = element as HTMLElement;
          const attrLang = dom.getAttribute("data-language");
          if (attrLang) return attrLang;

          const codeEl = dom.querySelector("code");
          const classList = codeEl?.getAttribute("class")?.split(" ") || [];
          const langClass = classList.find((cls) =>
            cls.startsWith("language-"),
          );
          return langClass ? langClass.replace("language-", "") : "text";
        },
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const language = node.attrs.language || "text";
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-language": language,
      }),
      ["code", language ? { class: `language-${language}` } : {}, 0],
    ];
  },
});

export function createEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      codeBlock: false, // We use our own EnhancedCodeBlock instead
      horizontalRule: false, // We use the standalone extension
      heading: {
        levels: [1, 2, 3, 4],
      },
    }),
    Placeholder.configure({
      placeholder: placeholder || "Start writing...",
    }),
    Underline,
    FontSize,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    HorizontalRule.configure({
      HTMLAttributes: {
        class: "my-4 border-border/50",
      },
    }),
    Table.configure({
      resizable: true,
      lastColumnResizable: true,
      cellMinWidth: 60,
      HTMLAttributes: {
        class: "border-collapse border border-border my-4",
      },
    }),
    TableRow,
    TableCell.configure({
      HTMLAttributes: {
        class: "border border-border p-2 min-w-[80px]",
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: "border border-border p-2 bg-muted font-bold min-w-[80px]",
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline cursor-pointer",
      },
    }),
    ResizableImage.configure({
      HTMLAttributes: {
        class: "max-w-full h-auto",
      },
    }),
    VideoBlock,
    CodeTabs,
    Youtube.configure({
      width: 640,
      height: 360,
      HTMLAttributes: {
        class:
          "video-embed youtube-embed my-6 rounded-xl overflow-hidden shadow-xl",
      },
      inline: false,
      allowFullscreen: true,
      autoplay: false,
      nocookie: true,
      modestBranding: true,
      controls: true,
      addPasteHandler: true,
    }),
    EnhancedCodeBlock.configure({
      HTMLAttributes: {
        class: "rounded-md my-3 font-mono text-sm overflow-x-auto not-prose",
      },
    }),
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: false,
    }),
  ];
}
