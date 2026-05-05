/**
 * Shared types for editor components
 */

export interface MediaAsset {
  id: string;
  url: string;
  publicUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: string;
  publicId?: string;
  name?: string;
}

export interface ImageInsertOptions {
  url: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  caption?: string;
}

export interface VideoInsertOptions {
  url: string;
  type: "youtube" | "vimeo" | "upload";
  title?: string;
  caption?: string;
  width?: string | number;
  height?: string | number;
  poster?: string;
}

export interface UploadOptions {
  assetType?: "images" | "videos" | "documents" | "audios";
  projectName?: string;
  folder?: string;
  tags?: string[];
  publicId?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface EditorToolbarConfig {
  showFormatting?: boolean;
  showHeadings?: boolean;
  showLists?: boolean;
  showMedia?: boolean;
  showCode?: boolean;
  showAlignment?: boolean;
  showUndo?: boolean;
}

export type AspectRatio = "auto" | "16:9" | "4:3" | "1:1" | "3:2" | "21:9";
