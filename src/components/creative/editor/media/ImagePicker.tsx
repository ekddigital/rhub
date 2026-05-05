/**
 * Reusable Image Picker Component
 * Can be used for cover images, inline images, avatars, etc.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/creative/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/creative/ui/dialog";
import {
  Upload,
  Link as LinkIcon,
  Grid,
  Check,
  Loader2,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaUpload } from "../hooks/useMediaUpload";
import { useMediaGallery } from "../hooks/useMediaGallery";
import { getOptimizedImageUrl } from "@/lib/creative/shims/lib/ekd-assets-api";
import type { MediaAsset, AspectRatio } from "../types";

interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string, asset?: MediaAsset, caption?: string) => void;
  onRemove?: () => void;
  projectName?: string;
  aspectRatio?: AspectRatio;
  className?: string;
  showRemove?: boolean;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function ImagePicker({
  value,
  onChange,
  onRemove,
  projectName = "blog",
  aspectRatio = "auto",
  className,
  showRemove = true,
  disabled = false,
  trigger,
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [captionInput, setCaptionInput] = useState("");
  const [activeTab, setActiveTab] = useState("upload");

  const { uploadFile, isUploading } = useMediaUpload();
  const { assets, isLoading, loadAssets } = useMediaGallery({
    assetType: "images",
    projectName,
    autoLoad: false,
  });

  const handleFileSelect = async (file: File) => {
    const result = await uploadFile(file, {
      assetType: "images",
      projectName,
      tags: ["image", projectName],
    });

    if (result) {
      onChange(
        result.publicUrl || result.url,
        result,
        captionInput || undefined
      );
      setCaptionInput("");
      setOpen(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onChange(urlInput, undefined, captionInput || undefined);
      setUrlInput("");
      setCaptionInput("");
      setOpen(false);
    }
  };

  const handleGallerySelect = (asset: MediaAsset) => {
    setSelectedAsset(asset);
  };

  const handleUseSelected = () => {
    if (selectedAsset) {
      onChange(
        selectedAsset.publicUrl || selectedAsset.url,
        selectedAsset,
        captionInput || undefined
      );
      setCaptionInput("");
      setOpen(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "gallery") {
      // Always try to load when switching to gallery tab
      console.log("[ImagePicker] Gallery tab activated, loading assets...");
      loadAssets();
    }
  };

  const aspectRatioClass = {
    auto: "aspect-video",
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    "3:2": "aspect-[3/2]",
    "21:9": "aspect-[21/9]",
  }[aspectRatio];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !value ? (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full h-32 border-dashed", className)}
            disabled={disabled}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-6 w-6" />
              <span>Choose Image</span>
            </div>
          </Button>
        </DialogTrigger>
      ) : (
        <div
          className={cn(
            "relative group rounded-lg overflow-hidden border",
            className
          )}
        >
          <div className={aspectRatioClass}>
            <Image
              src={value}
              alt="Selected"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              unoptimized={value.includes('/download') || value.includes('assets.andgroupco.com')}
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  Change
                </Button>
              </DialogTrigger>
              {showRemove && onRemove && (
                <Button size="sm" variant="destructive" onClick={onRemove}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Image</DialogTitle>
          <DialogDescription>
            Upload a new image, select from gallery, or provide a URL
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Grid className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                placeholder="e.g., Product showcase image"
                className="text-muted-foreground"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Add a descriptive caption for the image
              </p>
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, WebP up to 20MB
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                placeholder="e.g., Product showcase image"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                className="text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Add a descriptive caption for the image
              </p>
            </div>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Grid className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No images found in gallery
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload some images to see them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(
                      "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                      selectedAsset?.id === asset.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => handleGallerySelect(asset)}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={getOptimizedImageUrl(asset.url, {
                          width: 150,
                          height: 150,
                        })}
                        alt={asset.name || ""}
                        fill
                        className="object-cover"
                        unoptimized={asset.url.includes('/download') || asset.url.includes('assets.andgroupco.com')}
                      />
                    </div>
                    {selectedAsset?.id === asset.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedAsset && (
              <Button onClick={handleUseSelected} className="w-full">
                Use Selected Image
              </Button>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleUrlSubmit}>Add</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                placeholder="e.g., Product showcase image"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                className="text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Add a descriptive caption for the image
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
