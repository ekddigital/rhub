/**
 * Editor Toolbar Component
 * Modular toolbar with separated button groups
 */

"use client";

import { type Editor } from "@tiptap/react";
import { Button } from "@/components/creative/ui/button";
import { Separator } from "@/components/creative/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/creative/ui/tooltip";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Rows3,
  Columns3,
  Trash2,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  Combine,
  SplitSquareHorizontal,
  ToggleLeft,
  AArrowUp,
  AArrowDown,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { AssetBrowser } from "@/lib/creative/shims/email/asset-browser";
import { VideoPicker } from "../media/VideoPicker";
import { LinkDialog } from "./LinkDialog";
import { CodeBlockDialog } from "./CodeBlockDialog";
import { CodeTabsDialog } from "./CodeTabsDialog";
import { TableSizePicker } from "./TableSizePicker";
import type { EditorToolbarConfig } from "../types";

interface EditorToolbarProps {
  editor: Editor;
  config?: EditorToolbarConfig;
}

export function EditorToolbar({ editor, config }: EditorToolbarProps) {
  const [codeTabsOpen, setCodeTabsOpen] = useState(false);
  const [assetBrowserOpen, setAssetBrowserOpen] = useState(false);

  const {
    showFormatting = true,
    showHeadings = true,
    showLists = true,
    showMedia = true,
    showCode = true,
    showUndo = true,
  } = config || {};

  const ToolbarButton = ({
    onClick,
    isActive = false,
    icon: Icon,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: LucideIcon;
    tooltip: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={`border transition-all ${
            isActive
              ? "bg-secondary/10 border-secondary/30 text-secondary dark:bg-secondary/20 dark:border-secondary"
              : "border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
          }`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-popover text-popover-foreground border-border"
      >
        <p className="text-sm">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
        {showFormatting && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              icon={Bold}
              tooltip="Bold (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              icon={Italic}
              tooltip="Italic (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              icon={UnderlineIcon}
              tooltip="Underline (Ctrl+U)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              icon={Strikethrough}
              tooltip="Strikethrough"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              icon={Code}
              tooltip="Inline Code"
            />
            <Separator orientation="vertical" className="h-6" />
            {/* Font size controls */}
            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={(() => {
                    const attrs = editor.getAttributes("fontSize");
                    return attrs?.size ? String(attrs.size) : "";
                  })()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      editor.chain().focus().unsetFontSize().run();
                    } else {
                      editor.chain().focus().setFontSize(Number(val)).run();
                    }
                  }}
                  className="h-8 w-[70px] rounded-md border border-border/50 bg-background px-1.5 text-xs hover:border-secondary/50 focus:outline-none focus:ring-1 focus:ring-secondary/30 cursor-pointer"
                >
                  <option value="">Size</option>
                  <option value="10">10px</option>
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                  <option value="36">36px</option>
                  <option value="48">48px</option>
                </select>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-popover text-popover-foreground border-border"
              >
                <p className="text-sm">Font Size</p>
              </TooltipContent>
            </Tooltip>
            <ToolbarButton
              onClick={() => {
                const attrs = editor.getAttributes("fontSize");
                const current = attrs?.size || 16;
                editor
                  .chain()
                  .focus()
                  .setFontSize(Math.min(current + 2, 72))
                  .run();
              }}
              icon={AArrowUp}
              tooltip="Increase Font Size"
            />
            <ToolbarButton
              onClick={() => {
                const attrs = editor.getAttributes("fontSize");
                const current = attrs?.size || 16;
                editor
                  .chain()
                  .focus()
                  .setFontSize(Math.max(current - 2, 8))
                  .run();
              }}
              icon={AArrowDown}
              tooltip="Decrease Font Size"
            />
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {showHeadings && (
          <>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              icon={Heading1}
              tooltip="Heading 1"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              icon={Heading2}
              tooltip="Heading 2"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              icon={Heading3}
              tooltip="Heading 3"
            />
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {showLists && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              icon={List}
              tooltip="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              icon={ListOrdered}
              tooltip="Numbered List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              icon={Quote}
              tooltip="Block Quote"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              icon={Minus}
              tooltip="Horizontal Rule"
            />
            <Separator orientation="vertical" className="h-6" />
            {/* Text alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              icon={AlignLeft}
              tooltip="Align Left"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              icon={AlignCenter}
              tooltip="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              icon={AlignRight}
              tooltip="Align Right"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              isActive={editor.isActive({ textAlign: "justify" })}
              icon={AlignJustify}
              tooltip="Justify"
            />
            <Separator orientation="vertical" className="h-6" />
            {/* Table operations */}
            <TableSizePicker
              onInsert={(rows, cols, withHeaderRow) =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows, cols, withHeaderRow })
                  .run()
              }
              tooltip="Insert Table"
            />
            {editor.isActive("table") ? (
              <>
                {/* Row operations */}
                <ToolbarButton
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  icon={ArrowUpToLine}
                  tooltip="Add Row Above"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  icon={ArrowDownToLine}
                  tooltip="Add Row Below"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  icon={Rows3}
                  tooltip="Delete Row"
                />
                <Separator orientation="vertical" className="h-4" />
                {/* Column operations */}
                <ToolbarButton
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  icon={ArrowLeftToLine}
                  tooltip="Add Column Left"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  icon={ArrowRightToLine}
                  tooltip="Add Column Right"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  icon={Columns3}
                  tooltip="Delete Column"
                />
                <Separator orientation="vertical" className="h-4" />
                {/* Cell operations */}
                <ToolbarButton
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  icon={Combine}
                  tooltip="Merge Cells"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().splitCell().run()}
                  icon={SplitSquareHorizontal}
                  tooltip="Split Cell"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                  icon={ToggleLeft}
                  tooltip="Toggle Header Row"
                />
                <Separator orientation="vertical" className="h-4" />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  icon={Trash2}
                  tooltip="Delete Table"
                />
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 px-1 italic hidden sm:inline">
                Click in table for controls
              </span>
            )}
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {showMedia && (
          <>
            {/* Combined Asset Browser for inserting/uploading images */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssetBrowserOpen(true)}
                  className="border transition-all border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-popover text-popover-foreground border-border"
              >
                <p className="text-sm">Insert/Upload Image</p>
              </TooltipContent>
            </Tooltip>
            <AssetBrowser
              open={assetBrowserOpen}
              onOpenChange={setAssetBrowserOpen}
              onSelect={(asset) => {
                // Delay insertion until after the dialog closes so the
                // Radix focus-trap no longer blocks editor focus.
                const src = asset.url;
                const alt = asset.originalName || asset.filename;
                // SVGs often lack intrinsic raster dimensions — give them
                // an initial width so they're visible and resizable.
                const isSvg =
                  src.toLowerCase().endsWith(".svg") ||
                  src.toLowerCase().includes(".svg?") ||
                  (asset.mimeType || "").includes("svg");
                setTimeout(() => {
                  editor
                    .chain()
                    .focus()
                    .setImage({
                      src,
                      alt,
                      ...(isSvg ? { width: 400 } : {}),
                    })
                    .run();
                }, 150);
              }}
              allowedTypes={["image"]}
              title="Insert or Upload Image"
              apiEndpoint="/api/assets"
            />
            <VideoPicker
              onInsert={(video) => {
                console.log(
                  "[EditorToolbar] VideoPicker onInsert called:",
                  video,
                );

                if (video.type === "youtube") {
                  console.log(
                    "[EditorToolbar] Attempting to insert YouTube video",
                  );

                  const youtubeAttrs = {
                    src: video.url,
                    width: Number(video.width) || 640,
                    height: Number(video.height) || 360,
                    caption: video.caption,
                  };

                  if (typeof editor.commands.setYoutubeVideo === "function") {
                    const youtubeResult = editor
                      .chain()
                      .focus()
                      .setYoutubeVideo(youtubeAttrs)
                      .run();

                    console.log(
                      "[EditorToolbar] setYoutubeVideo result:",
                      youtubeResult,
                    );

                    if (youtubeResult) {
                      editor
                        .chain()
                        .focus()
                        .insertContent({ type: "paragraph" })
                        .run();
                    }
                  } else {
                    console.warn(
                      "[EditorToolbar] setYoutubeVideo command missing. Falling back to insertContent.",
                    );
                    const fallbackResult = editor
                      .chain()
                      .focus()
                      .insertContent({
                        type: "youtube",
                        attrs: youtubeAttrs,
                      })
                      .run();

                    console.log(
                      "[EditorToolbar] YouTube fallback insert result:",
                      fallbackResult,
                    );
                  }

                  return;
                }

                console.log(
                  "[EditorToolbar] Attempting to insert uploaded video",
                  {
                    src: video.url,
                    title: video.title,
                    caption: video.caption,
                    width: video.width,
                    height: video.height,
                  },
                );

                const videoAttrs = {
                  src: video.url,
                  title: video.title || video.caption || "Video",
                  caption: video.caption,
                  width: video.width || 640,
                  height: video.height || 360,
                  poster: video.poster,
                };

                let insertResult = false;

                if (typeof editor.commands.setVideo === "function") {
                  insertResult = editor
                    .chain()
                    .focus()
                    .setVideo(videoAttrs)
                    .run();
                  console.log(
                    "[EditorToolbar] setVideo command result:",
                    insertResult,
                  );
                } else {
                  console.warn(
                    "[EditorToolbar] setVideo command missing. Falling back to insertContent.",
                  );
                  insertResult = editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "videoBlock",
                      attrs: videoAttrs,
                    })
                    .run();
                  console.log(
                    "[EditorToolbar] Video fallback insert result:",
                    insertResult,
                  );
                }

                if (insertResult) {
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: "paragraph" })
                    .run();
                }
              }}
              trigger={
                <Button type="button" variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              }
            />
            <LinkDialog
              editor={editor}
              trigger={
                <Button type="button" variant="ghost" size="sm">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              }
            />
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {showCode && (
          <>
            <CodeTabsDialog
              editor={editor}
              open={codeTabsOpen}
              onOpenChange={setCodeTabsOpen}
            />
            <CodeBlockDialog
              onInsert={(code: string, language: string) => {
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "codeBlock",
                    attrs: { language },
                    content: [
                      {
                        type: "text",
                        text: code,
                      },
                    ],
                  })
                  .insertContent({ type: "paragraph" })
                  .run();
              }}
              trigger={
                <Button type="button" variant="ghost" size="sm">
                  <Code2 className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCodeTabsOpen(true)}
              className="border border-border/50 hover:border-secondary/50"
            >
              Tabs
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {showUndo && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              icon={Undo}
              tooltip="Undo (Ctrl+Z)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              icon={Redo}
              tooltip="Redo (Ctrl+Y)"
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
