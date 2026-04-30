"use client";

import { useEffect } from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Undo2,
  UnderlineIcon,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextChange = {
  html: string;
  text: string;
};

type RichTextEditorProps = {
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: RichTextChange) => void;
};

function normalizeHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "<p></p>") return "<p></p>";

  // Legacy drafts may store markdown/plain text in bodyRich.
  // Convert those to structured HTML so # headings and markdown tables render.
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (!hasHtmlTags && isLikelyMarkdown(trimmed)) {
    return markdownToHtml(trimmed);
  }

  // Some older drafts wrap markdown in minimal HTML (<p>### ...</p>).
  // If there are no structured nodes yet, unwrap and convert markdown syntax.
  if (hasHtmlTags && !hasStructuredHtml(trimmed)) {
    const plainFromHtml = trimmed
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div)>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (isLikelyMarkdown(plainFromHtml)) {
      return markdownToHtml(plainFromHtml);
    }
  }

  return trimmed;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function splitTableLine(line: string): string[] {
  let work = line.trim();
  if (work.startsWith("|")) work = work.slice(1);
  if (work.endsWith("|")) work = work.slice(0, -1);
  return work.split("|").map((cell) => cell.trim());
}

function isMarkdownTable(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const hasPipes = lines[0].includes("|");
  const separator = lines[1].trim();
  const isSeparator = /^[:|\-\s]+$/.test(separator) && separator.includes("-");
  return hasPipes && isSeparator;
}

function markdownBlockToHtml(block: string): string {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const compact = lines.filter((line) => line.trim().length > 0);
  if (compact.length === 0) return "<p></p>";

  if (isMarkdownTable(compact)) {
    const headerCells = splitTableLine(compact[0]).map(
      (cell) => `<th>${escapeHtml(cell)}</th>`,
    );
    const bodyRows = compact
      .slice(2)
      .map((row) => {
        const cells = splitTableLine(row).map(
          (cell) => `<td>${escapeHtml(cell)}</td>`,
        );
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");
    return `<table><thead><tr>${headerCells.join("")}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  }

  const heading = compact[0].match(/^(#{1,2})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length;
    const content = escapeHtml(heading[2]);
    return `<h${level}>${content}</h${level}>`;
  }

  const unordered = compact.every((line) => /^[-*]\s+/.test(line));
  if (unordered) {
    const items = compact
      .map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }

  const ordered = compact.every((line) => /^\d+\.\s+/.test(line));
  if (ordered) {
    const items = compact
      .map((line) => `<li>${escapeHtml(line.replace(/^\d+\.\s+/, ""))}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  }

  const paragraph = compact
    .map((line) => escapeHtml(line))
    .join("<br />")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return `<p>${paragraph}</p>`;
}

function markdownToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "<p></p>";
  const blocks = normalized.split(/\n{2,}/);
  return blocks.map(markdownBlockToHtml).join("");
}

function isLikelyMarkdown(text: string): boolean {
  return (
    /^\s*#{1,6}\s+/m.test(text) ||
    /^\s*[-*]\s+/m.test(text) ||
    /^\s*\d+\.\s+/m.test(text) ||
    /^\s*\|.+\|\s*$/m.test(text)
  );
}

function hasStructuredHtml(html: string): boolean {
  // Treat only semantically-rich structures as "already formatted".
  // Plain wrappers like <p>/<div>/<span>/<br> should still allow markdown conversion.
  return /<(table|thead|tbody|tr|th|td|ul|ol|li|h[1-6]|blockquote|pre|code)\b/i.test(
    html,
  );
}

const MarkdownPasteExtension = Extension.create({
  name: "markdownPaste",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const clipboard = event.clipboardData;
            if (!clipboard) return false;

            const html = clipboard.getData("text/html");
            const text = clipboard.getData("text/plain");
            if (!text) return false;

            const markdownLike = isLikelyMarkdown(text);
            if (!markdownLike) return false;

            // Some clipboard sources provide a lightweight HTML wrapper even when
            // the real payload is markdown text. Convert in that case too.
            if (html && hasStructuredHtml(html)) return false;

            const converted = markdownToHtml(text);
            if (!converted.trim()) return false;
            event.preventDefault();
            this.editor.chain().focus().insertContent(converted).run();
            return true;
          },
        },
      }),
    ];
  },
});

export function RichTextEditor({
  value,
  placeholder = "Start typing...",
  className,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      MarkdownPasteExtension,
    ],
    content: normalizeHtml(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[340px] max-h-[420px] overflow-y-auto px-3 py-2 text-sm leading-6 focus:outline-hidden [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mb-1.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:my-1 [&_a]:text-[#002868] [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-[#d9dfe9] [&_th]:bg-[#f3f6fb] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-[#d9dfe9] [&_td]:px-2 [&_td]:py-1",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange({
        html: current.getHTML(),
        text: current.getText({ blockSeparator: "\n\n" }),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = normalizeHtml(value);
    const current = normalizeHtml(editor.getHTML());
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const buttonClass =
    "h-8 min-w-8 rounded-md border border-border bg-background px-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:border-[#002868]/35 data-[active=true]:bg-[#002868]/8 data-[active=true]:text-[#002868]";

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Enter link URL", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted list"
        >
          <List className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <AlignLeft className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <AlignCenter className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <AlignRight className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          data-active={editor.isActive("link")}
          onClick={setLink}
          title="Add or edit link"
        >
          <Link2 className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove link"
        >
          <Unlink className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <RemoveFormatting className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 className="size-3.5" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 className="size-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
