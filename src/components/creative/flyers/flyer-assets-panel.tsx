"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/creative/ui/label";
import { Button } from "@/components/creative/ui/button";

import { Separator } from "@/components/creative/ui/separator";
import { Badge } from "@/components/creative/ui/badge";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Plus,
  FolderOpen,
  Download,
} from "lucide-react";
import { FlyerTemplateData } from "./flyer-preview";

interface FlyerAssetsPanelProps {
  template: FlyerTemplateData;
  onUpdateTemplate: (path: string, value: unknown) => void;
}

interface UploadedAsset {
  id: string;
  name: string;
  url: string;
  type: "logo" | "background" | "image" | "qr";
  timestamp: number;
}

export function FlyerAssetsPanel({
  template,
  onUpdateTemplate,
}: FlyerAssetsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [draggedAsset, setDraggedAsset] = useState<UploadedAsset | null>(null);

  // Handle multiple file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        const newAsset: UploadedAsset = {
          id: `asset-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: imageUrl,
          type: "image",
          timestamp: Date.now(),
        };

        setAssets((prev) => [...prev, newAsset]);
        toast("Image Uploaded!", { description: `${file.name} has been added to your assets.` });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, asset: UploadedAsset) => {
    setDraggedAsset(asset);
    // Set the image URL in the drag data so the canvas can receive it
    e.dataTransfer.setData("text/plain", asset.url);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedAsset(null);
  };

  // Apply asset as logo
  const applyAsLogo = (asset: UploadedAsset) => {
    onUpdateTemplate("branding.logo", asset.url);
    toast("Logo Updated!", { description: `${asset.name} is now your logo.` });
  };

  // Apply asset as background
  const applyAsBackground = (asset: UploadedAsset) => {
    onUpdateTemplate("layout.backgroundImage", asset.url);
    toast("Background Updated!", { description: `${asset.name} is now your background.` });
  };

  // Delete asset
  const deleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    toast("Asset Deleted", { description: "The asset has been removed from your library." });
  };

  // Download asset
  const downloadAsset = (asset: UploadedAsset) => {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("Downloaded!", { description: `${asset.name} has been downloaded.` });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Asset Library
        </Label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Images
        </Button>

        <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="font-medium mb-1">💡 Drag & Drop Ready!</p>
          <p>
            Upload images, then drag them onto the canvas to add to your design.
          </p>
        </div>
      </div>

      <Separator />

      {/* Current Template Assets */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Template Assets</Label>

        {/* Logo */}
        {template.branding?.logo && (
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="relative mx-auto h-20 w-40">
              <Image
                src={template.branding.logo}
                alt="Current logo"
                fill
                sizes="160px"
                className="object-contain rounded border bg-white dark:bg-gray-800 p-2"
                unoptimized
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => onUpdateTemplate("branding.logo", "")}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
          </div>
        )}

        {/* Background Image */}
        {template.layout?.backgroundImage && (
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">
                Background Image
              </Label>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="relative mx-auto h-20 w-full max-w-xs">
              <Image
                src={template.layout.backgroundImage}
                alt="Current background"
                fill
                sizes="(max-width: 320px) 100vw, 320px"
                className="object-cover rounded border"
                unoptimized
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => onUpdateTemplate("layout.backgroundImage", "")}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Uploaded Assets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Uploaded Assets</Label>
          <Badge variant="outline" className="text-xs">
            {assets.length} {assets.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No assets uploaded yet</p>
            <p className="text-xs">
              Click &ldquo;Upload Images&rdquo; to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {assets.map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => handleDragStart(e, asset)}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-3 hover:border-primary transition-all cursor-move ${
                  draggedAsset?.id === asset.id ? "opacity-50 scale-95" : ""
                }`}
              >
                <div className="flex gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      fill
                      sizes="64px"
                      className="object-cover rounded border"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(asset.timestamp).toLocaleTimeString()}
                    </p>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => applyAsLogo(asset)}
                      >
                        Set as Logo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => applyAsBackground(asset)}
                      >
                        Set as BG
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => downloadAsset(asset)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteAsset(asset.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Tips */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Asset Management Tips</Label>
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              🎯 Quick Actions
            </p>
            <ul className="space-y-1 text-amber-800 dark:text-amber-200">
              <li>
                • <strong>Drag</strong> images onto canvas to add them
              </li>
              <li>
                • <strong>Click buttons</strong> to set as logo/background
              </li>
              <li>
                • <strong>Upload multiple</strong> images at once
              </li>
              <li>
                • <strong>Reuse</strong> assets across your design
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
