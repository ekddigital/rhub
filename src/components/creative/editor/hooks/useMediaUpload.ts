/**
 * Shared hook for media uploads (images, videos, etc.)
 */

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { uploadAssetClient } from "@/lib/creative/shims/lib/ekd-assets-client";
import { inferMimeTypeFromFile } from "@/lib/conf/upload-validation";
import { resolveFileByteSize } from "@/lib/conf/resolve-file-size";
import type { MediaAsset, UploadOptions } from "../types";

interface UseMediaUploadReturn {
  uploadFile: (
    file: File,
    options?: UploadOptions
  ) => Promise<MediaAsset | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const DEFAULT_MAX_SIZE = {
  images: 20 * 1024 * 1024, // 20MB
  videos: 100 * 1024 * 1024, // 100MB
  documents: 10 * 1024 * 1024, // 10MB
  audios: 50 * 1024 * 1024, // 50MB
};

const DEFAULT_ALLOWED_TYPES = {
  images: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  videos: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
    "video/x-msvideo",
  ],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  audios: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
};

export function useMediaUpload(): UseMediaUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const validateFile = useCallback(
    async (file: File, options?: UploadOptions): Promise<boolean> => {
      const assetType = options?.assetType || "images";
      const maxSize = options?.maxSize || DEFAULT_MAX_SIZE[assetType];
      const allowedTypes =
        options?.allowedTypes || DEFAULT_ALLOWED_TYPES[assetType];

      const resolvedSize = await resolveFileByteSize(file);
      if (!Number.isFinite(resolvedSize) || resolvedSize <= 0) {
        toast.error(
          "Could not read file size. Try saving a copy as JPEG or PNG first.",
        );
        return false;
      }

      if (resolvedSize > maxSize) {
        const sizeMB = Math.round(maxSize / 1024 / 1024);
        toast.error(`File must be less than ${sizeMB}MB`);
        return false;
      }

      const inferredMime = inferMimeTypeFromFile(file);
      const mimeOk =
        (inferredMime && allowedTypes.includes(inferredMime)) ||
        allowedTypes.includes(file.type);

      if (!mimeOk) {
        toast.error(`Please upload a valid ${assetType.slice(0, -1)} file`);
        return false;
      }

      return true;
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File, options?: UploadOptions): Promise<MediaAsset | null> => {
      if (!(await validateFile(file, options))) {
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Simulate progress (since fetch doesn't provide upload progress)
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const result = await uploadAssetClient(file, {
          assetType: options?.assetType || "images",
          projectName: options?.projectName || options?.folder || "blog",
          tags: options?.tags || ["upload"],
          publicId: options?.publicId,
        });

        clearInterval(progressInterval);
        setProgress(100);

        toast("Upload successful", { description: `${file.name} has been uploaded successfully` });

        return {
          id: result.id ?? "",
          url: result.download_url || result.url || "",
          publicUrl:
            result.public_url ??
            result.secure_url ??
            result.download_url ??
            undefined,
          width: result.width,
          height: result.height,
          format: result.format,
          fileSize: result.file_size || result.size,
          mimeType: result.mime_type,
          createdAt: result.created_at,
          publicId: result.public_id,
          name: result.name,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, toast]
  );

  return {
    uploadFile,
    isUploading,
    progress,
    error,
  };
}
