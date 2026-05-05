"use client";

import { useState } from "react";
import { Upload, X, Loader2, FolderOpen } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import { uploadImageClient } from "@/lib/creative/shims/lib/image-upload-client";
import { AssetBrowser, type AssetItem } from "@/lib/creative/shims/email/asset-browser";

interface ImageUploadProps {
  value: string;
  onChange: (url: string, fileId?: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  entityType?: string;
  entityId?: string;
  /** Show "Browse Library" button to pick from previously uploaded assets */
  showAssetBrowser?: boolean;
}

export const ImageUpload = ({
  value,
  onChange,
  onRemove,
  disabled,
  entityType,
  entityId,
  showAssetBrowser = false,
}: ImageUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [assetBrowserOpen, setAssetBrowserOpen] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Make sure it's an image
    if (!file.type.includes("image")) {
      alert("Please upload an image file");
      return;
    }

    try {
      setIsLoading(true);

      // Use the centralized image upload utility
      const result = await uploadImageClient(file, {
        folder: "uploads",
        entityType,
        entityId,
      });

      onChange(result.url, result.fileId);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssetSelect = (asset: AssetItem) => {
    onChange(asset.url, asset.id);
    setAssetBrowserOpen(false);
  };

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-4">
        {value && (
          <div className="relative h-[200px] w-[200px] rounded-md overflow-hidden">
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={onRemove}
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full"
                disabled={isLoading || disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image fill src={value} alt="Upload" className="object-cover" />
          </div>
        )}
        {!value && (
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-60 w-60 border-dashed"
              disabled={isLoading || disabled}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleUpload}
                disabled={isLoading || disabled}
              />
              <div className="flex flex-col items-center justify-center">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SVG, PNG, JPG or GIF (max. 5MB)
                    </p>
                  </div>
                )}
              </div>
            </Button>
            {showAssetBrowser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssetBrowserOpen(true)}
                disabled={isLoading || disabled}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
            )}
          </div>
        )}
      </div>
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
};
