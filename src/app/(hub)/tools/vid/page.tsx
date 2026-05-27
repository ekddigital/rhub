import { Suspense } from "react";
import { DownloadHub } from "@/components/tools/vid/video-downloader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Hub | EKD Digital Resource Hub",
  description:
    "Download videos and audio from YouTube, Facebook, Instagram, TikTok, X, and Vimeo. Multi-platform media downloader with quality options.",
};

export default function DownloadHubLandingPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 px-0 sm:px-4">
      <Suspense
        fallback={
          <div className="py-12 text-center text-muted-foreground">
            Loading Download Hub…
          </div>
        }
      >
        <DownloadHub />
      </Suspense>
    </div>
  );
}
