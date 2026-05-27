import { Video, type LucideIcon } from "lucide-react";

/** Canonical route for the multi-platform media Download Hub */
export const DOWNLOAD_HUB_PATH = "/tools/vid";

export const downloadHubNav = {
  label: "Download Hub",
  href: DOWNLOAD_HUB_PATH,
  icon: Video as LucideIcon,
  description: "YouTube, Facebook, Instagram, TikTok, X, Vimeo",
  tagline: "Save videos and audio from social platforms",
} as const;

/** Sidebar / nav active state — avoids `/downloads` matching `/tools/vid` */
export function isDownloadHubPath(pathname: string): boolean {
  return (
    pathname === DOWNLOAD_HUB_PATH ||
    pathname.startsWith(`${DOWNLOAD_HUB_PATH}/`)
  );
}

export function isFileDownloadsPath(pathname: string): boolean {
  return pathname === "/downloads" || pathname.startsWith("/downloads/");
}
