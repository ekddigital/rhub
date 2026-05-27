import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, Eye, User } from "lucide-react";
import type { VideoEntryPreview, VideoSessionResponse } from "@/lib/download-hub/client";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

type VideoPreviewCardProps = {
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  views?: number;
  platformDisplayName: string;
  platformIcon: string;
  sourceUrl?: string;
  compact?: boolean;
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
};

export function VideoPreviewCard({
  title,
  author,
  duration,
  thumbnail,
  views = 0,
  platformDisplayName,
  platformIcon,
  sourceUrl,
  compact = false,
  href,
  onSelect,
  selected,
}: VideoPreviewCardProps) {
  const content = (
    <Card
      className={`overflow-hidden border-2 transition-all duration-200 ${
        selected
          ? "border-gold bg-gold/5 ring-2 ring-gold/20"
          : "border-gold/20 hover:border-gold/40"
      } ${href || onSelect ? "cursor-pointer" : ""}`}
    >
      <div className={`flex ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
        <div className="relative shrink-0">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              className={`object-cover rounded-lg border border-gold/20 bg-muted ${
                compact ? "w-28 h-16" : "w-44 h-28 sm:w-48 sm:h-28"
              }`}
            />
          ) : (
            <div
              className={`rounded-lg bg-muted flex items-center justify-center text-2xl ${
                compact ? "w-28 h-16" : "w-44 h-28"
              }`}
            >
              {platformIcon}
            </div>
          )}
          {duration > 0 && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {formatDuration(duration)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] bg-gold/10 text-gold border-gold/20"
            >
              {platformIcon} {platformDisplayName}
            </Badge>
          </div>
          <h3
            className={`font-bold text-gray-900 dark:text-white line-clamp-2 ${
              compact ? "text-sm" : "text-lg"
            }`}
          >
            {title}
          </h3>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {author}
            </span>
            {duration > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(duration)}
              </span>
            )}
            {views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {views.toLocaleString()}
              </span>
            )}
          </div>
          {sourceUrl && !compact && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2 text-gold hover:text-gold/80"
              onClick={(e) => e.stopPropagation()}
            >
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open original
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block" onClick={onSelect}>
        {content}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button type="button" className="w-full text-left" onClick={onSelect}>
        {content}
      </button>
    );
  }

  return content;
}

export function VideoPreviewFromSession({
  session,
}: {
  session: VideoSessionResponse;
}) {
  return (
    <VideoPreviewCard
      title={session.title}
      author={session.author}
      duration={session.duration}
      thumbnail={session.thumbnail}
      views={session.views}
      platformDisplayName={session.platformDisplayName}
      platformIcon={session.platformIcon}
      sourceUrl={session.url}
    />
  );
}

export function PlaylistEntryCard({
  entry,
  session,
  onSelect,
  loading,
}: {
  entry: VideoEntryPreview;
  session: VideoSessionResponse;
  onSelect: () => void;
  loading?: boolean;
}) {
  return (
    <VideoPreviewCard
      title={entry.title}
      author={entry.uploader || session.author}
      duration={entry.duration}
      thumbnail={entry.thumbnail}
      platformDisplayName={session.platformDisplayName}
      platformIcon={session.platformIcon}
      compact
      onSelect={loading ? undefined : onSelect}
    />
  );
}
