"use client";

import { Loader2 } from "lucide-react";
import { ANALYZE_SLOW_WARN_MS } from "@/lib/download-hub/analyze-progress";

type AnalyzeStatusTickerProps = {
  message: string;
  elapsedMs?: number;
  compact?: boolean;
};

export function AnalyzeStatusTicker({
  message,
  elapsedMs = 0,
  compact = false,
}: AnalyzeStatusTickerProps) {
  const showSlowHint = elapsedMs >= ANALYZE_SLOW_WARN_MS[0];

  return (
    <div
      className={`text-center space-y-1 ${compact ? "" : "px-2"}`}
      aria-live="polite"
      aria-busy="true"
    >
      <p
        className={`inline-flex items-center justify-center gap-2 font-medium text-gray-800 dark:text-gray-200 ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        <Loader2 className="w-4 h-4 shrink-0 animate-spin text-gold" />
        <span key={message} className="animate-in fade-in duration-300">
          {message}
        </span>
      </p>
      {showSlowHint && (
        <p className="text-xs text-muted-foreground animate-in fade-in duration-500">
          {elapsedMs >= ANALYZE_SLOW_WARN_MS[1]
            ? "This is taking longer than usual — you can wait or try a direct watch/reel URL."
            : "Still fetching metadata from the source…"}
        </p>
      )}
    </div>
  );
}
