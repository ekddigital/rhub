"use client";

import { Download, Loader2, Music, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VideoFormatOption } from "@/lib/download-hub/client";

type FormatPickerProps = {
  formats: VideoFormatOption[];
  downloadingId: string | null;
  ffmpegAvailable: boolean;
  onDownload: (formatId: string) => void;
};

export function FormatPicker({
  formats,
  downloadingId,
  ffmpegAvailable,
  onDownload,
}: FormatPickerProps) {
  const videoFormats = formats.filter((f) => f.kind === "video");
  const audioFormats = formats.filter((f) => f.kind === "audio");
  const showFfmpegHint =
    !ffmpegAvailable && audioFormats.some((f) => f.requiresFfmpeg);

  return (
    <div className="space-y-6" aria-label="Download formats">
      {showFfmpegHint && (
        <p
          className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2"
          role="note"
        >
          MP3 requires ffmpeg on the runtime server.
          Use Audio M4A if MP3 is unavailable.
        </p>
      )}
      {videoFormats.length > 0 && (
        <FormatSection
          title="Video"
          icon={<Video className="w-4 h-4" />}
          formats={videoFormats}
          downloadingId={downloadingId}
          ffmpegAvailable={ffmpegAvailable}
          onDownload={onDownload}
        />
      )}
      {audioFormats.length > 0 && (
        <FormatSection
          title="Audio"
          icon={<Music className="w-4 h-4" />}
          formats={audioFormats}
          downloadingId={downloadingId}
          ffmpegAvailable={ffmpegAvailable}
          onDownload={onDownload}
        />
      )}
    </div>
  );
}

function FormatSection({
  title,
  icon,
  formats,
  downloadingId,
  ffmpegAvailable,
  onDownload,
}: {
  title: string;
  icon: React.ReactNode;
  formats: VideoFormatOption[];
  downloadingId: string | null;
  ffmpegAvailable: boolean;
  onDownload: (formatId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      <div className="grid gap-2 sm:grid-cols-1">
        {formats.map((format) => {
          const isDownloading = downloadingId === format.id;
          const needsFfmpeg = format.requiresFfmpeg && !ffmpegAvailable;
          const disabled = Boolean(downloadingId) || needsFfmpeg;

          return (
            <Card
              key={format.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-2 border-gold/15 hover:border-gold/30 transition-colors"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm">{format.label}</span>
                  {format.recommended && (
                    <Badge className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-0">
                      Recommended
                    </Badge>
                  )}
                  {format.requiresFfmpeg && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-500/30"
                    >
                      Requires ffmpeg
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{format.ext.replace(".", "").toUpperCase()}</span>
                  {format.height && <span>{format.height}p</span>}
                  {format.codec && <span>{format.codec}</span>}
                  {format.filesizeLabel && <span>{format.filesizeLabel}</span>}
                </div>
                {needsFfmpeg && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Install ffmpeg to enable MP3 downloads.
                  </p>
                )}
              </div>
              <Button
                size="sm"
                disabled={disabled}
                onClick={() => onDownload(format.id)}
                className="shrink-0 bg-gold hover:bg-gold/90 text-dark-brown font-semibold w-full sm:w-auto disabled:opacity-50"
                aria-label={`Download ${format.label}`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
