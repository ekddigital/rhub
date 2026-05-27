import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function VideoDownloadHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-light-gray dark:bg-charcoal">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2"
          >
            <Link href="/#resources" className="hover:text-gold transition-colors">
              Tools
            </Link>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
            <span className="text-foreground font-medium">Download Hub</span>
          </nav>
          <h1 className="text-3xl font-bold text-dark-brown dark:text-light-gray">
            Download Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Download videos and audio from YouTube, Facebook, Instagram, and
            more — one place for all supported platforms.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
