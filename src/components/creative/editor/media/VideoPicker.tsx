/**
 * Reusable Video Picker Component
 * Supports YouTube embeds and video file uploads
 */

"use client";

import { useState } from "react";
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
import { Youtube, Upload, Loader2, Video, Grid, Check } from "lucide-react";
import { toast } from "sonner";
import { useMediaUpload } from "../hooks/useMediaUpload";
import { useMediaGallery } from "../hooks/useMediaGallery";
import { cn } from "@/lib/utils";
import type { VideoInsertOptions, MediaAsset } from "../types";

interface VideoPickerProps {
  onInsert: (video: VideoInsertOptions) => void;
  projectName?: string;
  trigger?: React.ReactNode;
}

export function VideoPicker({
  onInsert,
  projectName = "blog",
  trigger,
}: VideoPickerProps) {
  const [open, setOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeCaption, setYoutubeCaption] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [activeTab, setActiveTab] = useState("youtube");
  const { uploadFile, isUploading, progress, error } = useMediaUpload();
  const { assets, isLoading, loadAssets } = useMediaGallery({
    assetType: "videos",
    projectName,
    autoLoad: false,
  });
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(
    null
  );
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  };

  const handleYouTubeEmbed = () => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    onInsert({
      url: youtubeUrl, // Pass original URL for extension to parse
      type: "youtube",
      caption: youtubeCaption || undefined,
    });
    setYoutubeUrl("");
    setYoutubeCaption("");
    setOpen(false);
  };

  const handleVideoUpload = async (file: File) => {
    console.log("[VideoPicker] Starting video upload:", file.name, file.type);
    setUploadingFileName(file.name);

    try {
      const result = await uploadFile(file, {
        assetType: "videos",
        projectName,
        tags: ["video", projectName],
      });

      console.log("[VideoPicker] Upload result:", result);

      if (result) {
        const videoData = {
          url: result.publicUrl || result.url,
          type: "upload" as const,
          title: file.name,
          caption: youtubeCaption || undefined,
          width: result.width,
          height: result.height,
        };
        console.log("[VideoPicker] Video data prepared:", videoData);
        console.log("[VideoPicker] Calling onInsert callback");

        onInsert(videoData);
        setYoutubeCaption("");
        setOpen(false);
        toast("Video uploaded", { description: `${file.name} is ready in your editor` });
        console.log("[VideoPicker] Video insertion completed successfully");
      } else {
        console.error("[VideoPicker] Upload failed - result is null");
      }
    } catch (error) {
      console.error("[VideoPicker] Upload error:", error);
      toast.error("Failed to upload video. Please try again.");
    }

    setUploadingFileName(null);
  };

  const handleGallerySelect = (asset: MediaAsset) => {
    setSelectedAsset(asset);
  };

  const handleUseSelected = () => {
    if (selectedAsset) {
      onInsert({
        url: selectedAsset.publicUrl || selectedAsset.url,
        type: "upload",
        title: selectedAsset.name || "Video",
        caption: youtubeCaption || undefined,
        width: selectedAsset.width,
        height: selectedAsset.height,
      });
      setYoutubeCaption("");
      setSelectedAsset(null);
      setOpen(false);
      toast("Video inserted", { description: "Video added to your editor" });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "gallery" && assets.length === 0) {
      loadAssets();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Video</DialogTitle>
          <DialogDescription>
            Embed a YouTube video, upload new, or select from gallery
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-primary/10 to-secondary/10">
            <TabsTrigger
              value="youtube"
              className="data-[state=active]:bg-secondary/20"
            >
              <Youtube className="h-4 w-4 mr-2" />
              YouTube
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-secondary/20"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              className="data-[state=active]:bg-secondary/20"
            >
              <Grid className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-4">
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="text-muted-foreground border-border focus:border-secondary/50"
              />
              <p className="text-sm text-muted-foreground">
                Paste a YouTube video URL
              </p>
            </div>
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                placeholder="e.g., Tutorial introduction video"
                value={youtubeCaption}
                onChange={(e) => setYoutubeCaption(e.target.value)}
                className="text-muted-foreground border-border focus:border-secondary/50"
              />
              <p className="text-sm text-muted-foreground">
                Add a descriptive caption for the video
              </p>
            </div>
            <Button
              onClick={handleYouTubeEmbed}
              disabled={!youtubeUrl}
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
            >
              <Youtube className="h-4 w-4 mr-2" />
              Embed Video
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                placeholder="e.g., Product demo video"
                value={youtubeCaption}
                onChange={(e) => setYoutubeCaption(e.target.value)}
                className="text-muted-foreground border-border focus:border-secondary/50"
              />
              <p className="text-sm text-muted-foreground">
                Add a descriptive caption for the video
              </p>
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-secondary/50 transition-colors border-border"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "video/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleVideoUpload(file);
                };
                input.click();
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Uploading {uploadingFileName || "video"}...</p>
                  <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive text-center">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    MP4, WebM, MOV up to 100MB
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                placeholder="e.g., Product demo video"
                value={youtubeCaption}
                onChange={(e) => setYoutubeCaption(e.target.value)}
                className="text-muted-foreground border-border focus:border-secondary/50"
              />
              <p className="text-sm text-muted-foreground">
                Add a descriptive caption for the video
              </p>
            </div>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No videos uploaded yet</p>
                <p className="text-sm">Upload videos to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
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
                    <div className="aspect-video relative bg-black flex items-center justify-center">
                      <Video className="h-12 w-12 text-white/50" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white truncate bg-black/50 px-2 py-1 rounded">
                          {asset.name || "Video"}
                        </p>
                      </div>
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
                Use Selected Video
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
