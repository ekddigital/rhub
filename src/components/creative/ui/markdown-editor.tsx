/**
 * MarkdownEditor - Markdown textarea with formatting, images, attachments
 * Uses AssetBrowser for unified file browsing/uploading
 * Shows visual file previews for attached files
 *
 * NOTE: This is NOT the TipTap WYSIWYG editor (components/editor/rich-text/RichTextEditor.tsx).
 * This is a markdown-based textarea with toolbar buttons.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/creative/ui/button";
import { Textarea } from "@/components/creative/ui/textarea";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link,
  Quote,
  Code,
  Type,
  Loader2,
  X,
  Upload,
  FolderOpen,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetBrowser, type AssetItem } from "@/lib/creative/shims/email/asset-browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/creative/ui/dialog";
import { Label } from "@/components/creative/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/creative/ui/radio-group";
import { toast } from "sonner";
import { FilePreviewList } from "@/lib/creative/shims/shared/file-preview";
import {
  parseAttachmentMd,
  parseInlineImages,
  getFileCategory,
  type FileCategory,
} from "@/lib/creative/shims/lib/file-helpers";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  entityType?: string;
  entityId?: string;
  allowImages?: boolean;
  allowFormatting?: boolean;
  allowAttachments?: boolean;
}

interface ImageUpload {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

interface PendingImage {
  url: string;
  fileName: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your message...",
  disabled = false,
  minHeight = "200px",
  maxHeight = "500px",
  className,
  entityType = "support-ticket",
  entityId,
  allowImages = true,
  allowFormatting = true,
  allowAttachments = true,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<ImageUpload[]>([]);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const [showImageConfig, setShowImageConfig] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [imageAlignment, setImageAlignment] = useState<
    "left" | "center" | "right"
  >("center");
  const [imageSize, setImageSize] = useState<
    "small" | "medium" | "large" | "original"
  >("medium");

  // Parse current attachments & inline images from content for preview
  const attachments = parseAttachmentMd(value);
  const inlineImages = parseInlineImages(value);

  // Handle asset selection from browser
  const handleAssetSelect = (asset: AssetItem) => {
    if (asset.fileType === "image") {
      // Show configuration dialog for images
      setPendingImage({ url: asset.url, fileName: asset.originalName });
      setShowImageConfig(true);
    } else {
      // Insert attachment markdown
      const md = `\n[📎 ${asset.originalName}](${asset.url})\n`;
      onChange(value + md);
      toast("File attached", {
        description: `${asset.originalName} added as attachment.`,
      });
    }
  };

  // Remove an attachment by index
  const handleRemoveAttachment = (index: number) => {
    const att = attachments[index];
    if (!att) return;
    // Remove the matching markdown pattern
    const pattern = `[📎 ${att.name}](${att.url})`;
    const newVal = value
      .replace(pattern, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    onChange(newVal);
  };

  // Remove an inline image by index
  const handleRemoveImage = (index: number) => {
    const img = inlineImages[index];
    if (!img) return;
    // Remove the <img> tag containing this URL
    const escaped = img.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `\\n?<img\\s+[^>]*src="${escaped}"[^>]*/?>\\n?`,
      "g",
    );
    const newVal = value
      .replace(regex, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    onChange(newVal);
  };

  // Insert image with configuration
  const insertConfiguredImage = () => {
    if (!pendingImage) return;

    const alignStyle =
      imageAlignment === "center"
        ? "margin: 0 auto; display: block;"
        : imageAlignment === "right"
          ? "float: right; margin-left: 10px;"
          : "float: left; margin-right: 10px;";

    const sizeStyle =
      imageSize === "small"
        ? "max-width: 300px;"
        : imageSize === "medium"
          ? "max-width: 500px;"
          : imageSize === "large"
            ? "max-width: 700px;"
            : "max-width: 100%;";

    const imageHtml = `\n<img src="${pendingImage.url}" alt="${pendingImage.fileName}" style="${sizeStyle} ${alignStyle} height: auto; border-radius: 4px;" />\n`;
    onChange(value + imageHtml);

    setShowImageConfig(false);
    setPendingImage(null);
    setImageAlignment("center");
    setImageSize("medium");
  };

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const minPx = parseInt(minHeight);
      const maxPx = parseInt(maxHeight);
      textarea.style.height = `${Math.min(Math.max(scrollHeight, minPx), maxPx)}px`;
    }
  }, [minHeight, maxHeight]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  // Text formatting
  const insertAtCursor = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selected +
      after +
      value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    }, 0);
  };

  const formatText = (type: string) => {
    const fmtMap: Record<string, [string, string]> = {
      bold: ["**", "**"],
      italic: ["*", "*"],
      underline: ["<u>", "</u>"],
      code: ["`", "`"],
      quote: ["> ", ""],
      "unordered-list": ["- ", ""],
      "ordered-list": ["1. ", ""],
      link: ["[link text](", ")"],
      heading: ["## ", ""],
    };
    const pair = fmtMap[type];
    if (pair) insertAtCursor(pair[0], pair[1]);
  };

  // Image upload via file input
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(uploadImage);
    e.target.value = "";
  };

  const uploadImage = async (file: File) => {
    const uploadId = Math.random().toString(36).substr(2, 9);
    setUploadingImages((prev) => [
      ...prev,
      { id: uploadId, file, progress: 0 },
    ]);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Email assets route through the EKD Assets API proxy
      let uploadUrl: string;
      if (entityType === "email") {
        formData.append("asset_type", "images");
        formData.append("project_name", "email-assets");
        uploadUrl = "/api/assets";
      } else if (entityType.includes("support")) {
        formData.append("entityType", entityType);
        if (entityId) formData.append("entityId", entityId);
        uploadUrl = "/api/uploads/support";
      } else {
        formData.append("entityType", entityType);
        if (entityId) formData.append("entityId", entityId);
        uploadUrl = "/api/upload";
      }

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to upload image");
      }

      const result = await response.json();
      // EKD Assets API returns public_url; regular upload returns url
      const imageUrl = result.public_url || result.url;
      setUploadingImages((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, progress: 100, url: imageUrl } : u,
        ),
      );

      setPendingImage({ url: imageUrl, fileName: file.name });
      setShowImageConfig(true);
      toast("Image uploaded", {
        description: `${file.name} ready to configure.`,
      });

      setTimeout(() => {
        setUploadingImages((prev) => prev.filter((u) => u.id !== uploadId));
      }, 1000);
    } catch (error) {
      setUploadingImages((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? {
                ...u,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : u,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadingImage = (id: string) => {
    setUploadingImages((prev) => prev.filter((u) => u.id !== id));
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    files.forEach(uploadImage);
  };

  // Determine allowed types for asset browser
  const browserTypes: string[] = [];
  if (allowImages) browserTypes.push("image");
  if (allowAttachments) browserTypes.push("pdf", "document", "other");

  return (
    <div
      className={cn(
        "border-2 border-border rounded-lg overflow-hidden bg-card",
        className,
      )}
    >
      {/* Toolbar */}
      {allowFormatting && (
        <div className="border-b border-border bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
          {/* Text formatting */}
          <div className="flex gap-0.5">
            {[
              { key: "bold", icon: Bold, title: "Bold" },
              { key: "italic", icon: Italic, title: "Italic" },
              { key: "underline", icon: Underline, title: "Underline" },
            ].map(({ key, icon: Icon, title }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => formatText(key)}
                disabled={disabled}
                title={title}
                className="h-8 w-8 p-0 text-foreground hover:bg-[#C8A061]/10 hover:text-[#C8A061]"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <div className="h-5 border-l border-border mx-0.5" />

          <div className="flex gap-0.5">
            {[
              { key: "heading", icon: Type, title: "Heading" },
              { key: "quote", icon: Quote, title: "Quote" },
              { key: "code", icon: Code, title: "Code" },
            ].map(({ key, icon: Icon, title }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => formatText(key)}
                disabled={disabled}
                title={title}
                className="h-8 w-8 p-0 text-foreground hover:bg-[#C8A061]/10 hover:text-[#C8A061]"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <div className="h-5 border-l border-border mx-0.5" />

          <div className="flex gap-0.5">
            {[
              { key: "unordered-list", icon: List, title: "Bullet List" },
              {
                key: "ordered-list",
                icon: ListOrdered,
                title: "Numbered List",
              },
              { key: "link", icon: Link, title: "Link" },
            ].map(({ key, icon: Icon, title }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => formatText(key)}
                disabled={disabled}
                title={title}
                className="h-8 w-8 p-0 text-foreground hover:bg-[#C8A061]/10 hover:text-[#C8A061]"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Image upload button */}
          {allowImages && (
            <>
              <div className="h-5 border-l border-border mx-0.5" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                title="Upload Image"
                className="h-8 w-8 p-0 text-foreground hover:bg-[#C8A061]/10 hover:text-[#C8A061]"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
            </>
          )}

          {/* Unified Asset Browser button (images + attachments) */}
          {(allowImages || allowAttachments) && (
            <>
              {!allowImages && (
                <div className="h-5 border-l border-border mx-0.5" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssetBrowser(true)}
                disabled={disabled}
                title="Browse Asset Library (images, files, attachments)"
                className="h-8 px-2 gap-1.5 text-foreground hover:bg-[#C8A061]/10 hover:text-[#C8A061]"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Assets</span>
              </Button>
            </>
          )}
        </div>
      )}

      {/* Text Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground bg-transparent"
          style={{ minHeight, maxHeight }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>

      {/* Uploading Images Progress */}
      {uploadingImages.length > 0 && (
        <div className="border-t border-border p-2 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            Uploading Images
          </p>
          {uploadingImages.map((upload) => (
            <div key={upload.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-foreground text-xs">
                    {upload.file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingImage(upload.id)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      upload.error ? "bg-destructive" : "bg-[#C8A061]",
                    )}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                {upload.error && (
                  <p className="text-xs text-destructive mt-0.5">
                    {upload.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attached Files Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-border p-2">
          <FilePreviewList
            files={attachments.map((a) => ({
              name: a.name,
              url: a.url,
              type: a.type,
              size: a.size,
            }))}
            onRemove={handleRemoveAttachment}
          />
        </div>
      )}

      {/* Inline Images Preview */}
      {inlineImages.length > 0 && (
        <div className="border-t border-border p-2">
          <FilePreviewList
            files={inlineImages.map((img) => ({
              name: img.name,
              url: img.url,
              type: "image" as FileCategory,
            }))}
            onRemove={handleRemoveImage}
          />
        </div>
      )}

      {/* Green indicator dot */}
      <div className="flex justify-end p-1">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            value.trim() ? "bg-green-500" : "bg-muted-foreground/30",
          )}
          title={value.trim() ? "Content entered" : "Empty"}
        />
      </div>

      {/* Hidden file input for quick image upload */}
      {allowImages && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      )}

      {/* Asset Browser Dialog */}
      <AssetBrowser
        open={showAssetBrowser}
        onOpenChange={setShowAssetBrowser}
        onSelect={handleAssetSelect}
        allowedTypes={browserTypes}
      />

      {/* Image Configuration Dialog */}
      <Dialog open={showImageConfig} onOpenChange={setShowImageConfig}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-card flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-foreground">
              Configure Image
            </DialogTitle>
            <DialogDescription>
              Choose the alignment and size for your image
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 overflow-y-auto flex-1">
            {/* Image Preview */}
            {pendingImage && (
              <div className="flex justify-center p-4 rounded-lg border-2 border-border bg-muted/30">
                <img
                  src={pendingImage.url}
                  alt={pendingImage.fileName}
                  className={cn(
                    "rounded-md shadow-lg max-h-[300px] object-contain",
                    imageSize === "small" && "max-w-[300px]",
                    imageSize === "medium" && "max-w-[500px]",
                    imageSize === "large" && "max-w-[700px]",
                    imageSize === "original" && "max-w-full",
                  )}
                />
              </div>
            )}

            {/* Alignment */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">
                Alignment
              </Label>
              <RadioGroup
                value={imageAlignment}
                onValueChange={(val) => setImageAlignment(val as any)}
              >
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "left", icon: AlignLeft, label: "Left" },
                    { val: "center", icon: AlignCenter, label: "Center" },
                    { val: "right", icon: AlignRight, label: "Right" },
                  ].map(({ val, icon: Icon, label }) => (
                    <div
                      key={val}
                      className={cn(
                        "flex items-center space-x-2 border-2 rounded-lg p-3 cursor-pointer hover:border-[#C8A061] transition-colors",
                        imageAlignment === val &&
                          "border-[#C8A061] bg-[#C8A061]/5",
                      )}
                      onClick={() => setImageAlignment(val as any)}
                    >
                      <RadioGroupItem value={val} id={`align-${val}`} />
                      <Label
                        htmlFor={`align-${val}`}
                        className="flex items-center gap-2 cursor-pointer font-medium text-foreground"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Size */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">
                Size
              </Label>
              <RadioGroup
                value={imageSize}
                onValueChange={(val) => setImageSize(val as any)}
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "small", label: "Small", desc: "300px max width" },
                    { val: "medium", label: "Medium", desc: "500px max width" },
                    { val: "large", label: "Large", desc: "700px max width" },
                    { val: "original", label: "Original", desc: "Full width" },
                  ].map(({ val, label, desc }) => (
                    <div
                      key={val}
                      className={cn(
                        "flex items-center space-x-2 border-2 rounded-lg p-3 cursor-pointer hover:border-[#C8A061] transition-colors",
                        imageSize === val && "border-[#C8A061] bg-[#C8A061]/5",
                      )}
                      onClick={() => setImageSize(val as any)}
                    >
                      <RadioGroupItem value={val} id={`size-${val}`} />
                      <Label htmlFor={`size-${val}`} className="cursor-pointer">
                        <div className="font-medium text-foreground">
                          {label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {desc}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowImageConfig(false)}>
              Cancel
            </Button>
            <Button
              onClick={insertConfiguredImage}
              className="bg-[#C8A061] hover:bg-[#B89051] text-white font-semibold"
            >
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
