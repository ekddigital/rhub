import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DownloadHub } from "@/components/tools/vid/video-downloader";
import { getPlatformByRouteSlug } from "@/lib/download-hub/routes";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ platform: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { platform: routeSlug } = await params;
  const platform = getPlatformByRouteSlug(routeSlug);

  if (!platform) {
    return { title: "Download Hub | EKD Digital Resource Hub" };
  }

  return {
    title: `${platform.displayName} Download | EKD Digital Resource Hub`,
    description: `Download videos and audio from ${platform.displayName}.`,
  };
}

export default async function DownloadHubPlatformPage({ params }: PageProps) {
  const { platform: routeSlug } = await params;
  const platform = getPlatformByRouteSlug(routeSlug);

  if (!platform) {
    notFound();
  }

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
