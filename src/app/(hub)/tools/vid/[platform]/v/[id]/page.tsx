import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WatchPage } from "@/components/tools/vid/watch-page";
import { getPlatformByRouteSlug } from "@/lib/download-hub/routes";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ platform: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { platform: routeSlug } = await params;
  const platform = getPlatformByRouteSlug(routeSlug);

  return {
    title: platform
      ? `${platform.displayName} Download | EKD Digital Resource Hub`
      : "Download | EKD Digital Resource Hub",
    description: "Choose format and download your media.",
  };
}

export default async function WatchSessionPage({ params }: PageProps) {
  const { platform: routeSlug, id: sessionId } = await params;
  const platform = getPlatformByRouteSlug(routeSlug);

  if (!platform || !sessionId) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-0 sm:px-4">
      <Suspense
        fallback={
          <div className="py-12 text-center text-muted-foreground" aria-busy="true">
            Loading video…
          </div>
        }
      >
        <WatchPage platformRouteSlug={routeSlug} sessionId={sessionId} />
      </Suspense>
    </div>
  );
}
