"use client";

import { useState } from "react";
import { EKDAssetImage } from "./ekd-asset-image";
import { Button } from "./button";
import { Loader2, Upload, X, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageClient } from "@/lib/creative/shims/lib/image-upload-client";
import { AssetBrowser, type AssetItem } from "@/lib/creative/shims/email/asset-browser";

interface ImageUploadFieldProps {
  initialImageUrl?: string;
  onImageChange: (url: string, fileId?: string) => void;
  className?: string;
  label?: string;
  helpText?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  width?: number;
  height?: number;
  entityType?: string; // e.g., "project", "post", etc.
  entityId?: string;
  /** Show "Browse Library" button to pick from previously uploaded assets */
  showAssetBrowser?: boolean;
}

export function ImageUploadField({
  initialImageUrl,
  onImageChange,
  className,
  label = "Image",
  helpText = "Upload an image",
  required = false,
  accept = "image/jpeg, image/png, image/webp, image/gif",
  maxSizeMB = 5,
  width = 400,
  height = 300,
  entityType,
  entityId,
  showAssetBrowser = false,
}: ImageUploadFieldProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetBrowserOpen, setAssetBrowserOpen] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the centralized image upload utility with retries
      let result;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          // Use AbortController to set a timeout
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 seconds timeout

          result = await uploadImageClient(file, {
            folder: "uploads",
            entityType,
            entityId,
          });

          clearTimeout(timeoutId);
          break; // Success, exit the retry loop
        } catch (err) {
          console.warn(`Upload attempt ${retries + 1} failed:`, err);
          retries++;

          if (retries >= maxRetries) throw err;

          // Wait before retrying (exponential backoff)
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retries)));
        }
      }

      if (!result) {
        throw new Error("Failed to upload image");
      }

      setImageUrl(result.url);
      onImageChange(result.url, result.fileId);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setImageUrl(undefined);
    onImageChange("", "");
  };

  const handleAssetSelect = (asset: AssetItem) => {
    setImageUrl(asset.url);
    onImageChange(asset.url, asset.id);
    setAssetBrowserOpen(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <EKDAssetImage
            src={imageUrl}
            alt={label}
            width={width}
            height={height}
            crop="fill"
            className="object-cover w-full"
            fallbackSrc="/images/placeholder.png"
            retryCount={3}
            timeout={10000}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-md p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-center">
                  Click to upload an image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {accept.replace(/image\//g, "").toUpperCase()} (max.{" "}
                  {maxSizeMB}
                  MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  onChange={handleUpload}
                />
              </label>
              {showAssetBrowser && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAssetBrowserOpen(true)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Browse Library
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <p className="text-sm text-muted-foreground">{helpText}</p>

      {showAssetBrowser && (
        <AssetBrowser
          open={assetBrowserOpen}
          onOpenChange={setAssetBrowserOpen}
          onSelect={handleAssetSelect}
          allowedTypes={["image"]}
          title="Select Image"
        />
      )}
    </div>
  );
}
