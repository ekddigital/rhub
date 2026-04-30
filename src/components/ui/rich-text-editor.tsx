"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
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
  return !trimmed || trimmed === "<p></p>" ? "<p></p>" : trimmed;
}

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
        heading: { levels: [1, 2] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: normalizeHtml(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[340px] max-h-[420px] overflow-y-auto px-3 py-2 text-sm leading-6 focus:outline-hidden [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:my-1 [&_a]:text-[#002868] [&_a]:underline",
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
