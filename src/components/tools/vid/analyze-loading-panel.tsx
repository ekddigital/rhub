"use client";

import { Check, Loader2 } from "lucide-react";
import {
  ANALYZE_UI_PHASES,
  ANALYZE_SLOW_WARN_MS,
  analyzeProgressPercent,
  analyzeUiPhaseIndex,
  resolveAnalyzeUiPhase,
  type AnalyzePhase,
} from "@/lib/download-hub/analyze-progress";
import { cn } from "@/lib/utils";
import {
  FormatPickerSkeleton,
  VideoPreviewSkeleton,
} from "./video-preview-skeleton";

type AnalyzeLoadingPanelProps = {
  statusMessage: string;
  currentPhase?: AnalyzePhase;
  elapsedMs?: number;
  compact?: boolean;
  showSkeleton?: boolean;
  showFormatSkeleton?: boolean;
  indeterminate?: boolean;
};

export function AnalyzeLoadingPanel({
  statusMessage,
  currentPhase = "validate",
  elapsedMs = 0,
  compact = false,
  showSkeleton = true,
  showFormatSkeleton = false,
  indeterminate = false,
}: AnalyzeLoadingPanelProps) {
  const uiPhase = resolveAnalyzeUiPhase(currentPhase);
  const activeIndex = analyzeUiPhaseIndex(uiPhase);
  const progress = indeterminate
    ? undefined
    : analyzeProgressPercent(uiPhase, elapsedMs);
  const showSlowHint = elapsedMs >= ANALYZE_SLOW_WARN_MS[0];

  return (
    <div
      className={cn(
        "animate-in fade-in duration-300",
        compact ? "space-y-3" : "space-y-5",
      )}
      aria-busy="true"
      aria-live="polite"
      aria-label="Analyzing video link"
    >
      <div
        className={cn(
          "flex flex-col items-center text-center",
          compact ? "gap-2" : "gap-4",
        )}
      >
        <AnalyzeSpinner compact={compact} />

        <PhaseChips activeIndex={activeIndex} compact={compact} />

        <ProgressBar
          compact={compact}
          indeterminate={indeterminate}
          progress={progress}
        />

        <StatusLine
          compact={compact}
          message={statusMessage}
          showSlowHint={showSlowHint}
          slowTier={
            elapsedMs >= ANALYZE_SLOW_WARN_MS[1]
              ? 2
              : elapsedMs >= ANALYZE_SLOW_WARN_MS[0]
                ? 1
                : 0
          }
        />
      </div>

      {showSkeleton && (
        <div className={cn(compact ? "space-y-3" : "space-y-4")}>
          <VideoPreviewSkeleton />
          {showFormatSkeleton && <FormatPickerSkeleton />}
        </div>
      )}
    </div>
  );
}

function AnalyzeSpinner({ compact }: { compact: boolean }) {
  const size = compact ? "w-10 h-10" : "w-14 h-14";
  const iconSize = compact ? "w-5 h-5" : "w-7 h-7";

  return (
    <div className={cn("relative flex items-center justify-center", size)}>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full border-2 border-gold/25",
          "motion-safe:animate-ping motion-reduce:opacity-60",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-1 rounded-full border border-gold/40",
          "motion-safe:animate-pulse motion-reduce:border-gold/60",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full bg-gold/5",
          "motion-safe:animate-pulse motion-reduce:bg-gold/10",
        )}
      />
      <Loader2
        className={cn(
          "relative z-10 text-gold",
          iconSize,
          "motion-safe:animate-spin motion-reduce:opacity-90",
        )}
      />
    </div>
  );
}

function PhaseChips({
  activeIndex,
  compact,
}: {
  activeIndex: number;
  compact: boolean;
}) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center justify-center gap-1.5 sm:gap-2",
        compact ? "max-w-md" : "max-w-lg",
      )}
      aria-label="Analysis progress"
    >
      {ANALYZE_UI_PHASES.map((step, index) => {
        const state =
          index < activeIndex
            ? "done"
            : index === activeIndex
              ? "active"
              : "pending";

        return (
          <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border font-medium transition-colors",
                compact
                  ? "px-2 py-0.5 text-[10px]"
                  : "px-2.5 py-1 text-xs",
                state === "done" &&
                  "border-gold/30 bg-gold/10 text-gold dark:text-gold",
                state === "active" &&
                  "border-gold bg-gold/15 text-dark-brown dark:text-gold ring-2 ring-gold/25 motion-safe:animate-pulse motion-reduce:ring-gold/40",
                state === "pending" &&
                  "border-gray-200 dark:border-gray-700 bg-muted/40 text-muted-foreground",
              )}
              aria-current={state === "active" ? "step" : undefined}
            >
              {state === "done" ? (
                <Check
                  className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")}
                  aria-hidden
                />
              ) : state === "active" ? (
                <span
                  className={cn(
                    "rounded-full bg-gold",
                    compact ? "w-1.5 h-1.5" : "w-2 h-2",
                    "motion-safe:animate-pulse",
                  )}
                  aria-hidden
                />
              ) : null}
              {step.label}
            </span>
            {index < ANALYZE_UI_PHASES.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "text-muted-foreground/50",
                  compact ? "text-[10px]" : "text-xs",
                )}
              >
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ProgressBar({
  compact,
  indeterminate,
  progress,
}: {
  compact: boolean;
  indeterminate?: boolean;
  progress?: number;
}) {
  return (
    <div
      className={cn("w-full", compact ? "max-w-sm px-1" : "max-w-md px-2")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={
        indeterminate ? "Analyzing…" : `${progress ?? 0}% complete`
      }
      aria-valuenow={indeterminate ? undefined : progress}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gold/15",
          compact ? "h-1" : "h-1.5",
        )}
      >
        {indeterminate ? (
          <div className="h-full w-2/5 rounded-full bg-gold analyze-progress-indeterminate" />
        ) : (
          <div
            className="h-full rounded-full bg-linear-to-r from-gold/80 to-gold transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${progress ?? 0}%` }}
          />
        )}
      </div>
    </div>
  );
}

function StatusLine({
  message,
  compact,
  showSlowHint,
  slowTier,
}: {
  message: string;
  compact: boolean;
  showSlowHint: boolean;
  slowTier: 0 | 1 | 2;
}) {
  return (
    <div className={cn("space-y-1", compact ? "max-w-sm" : "max-w-md")}>
      <p
        className={cn(
          "font-medium text-gray-800 dark:text-gray-200",
          compact ? "text-sm" : "text-base",
        )}
      >
        <span
          key={message}
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
        >
          {message}
        </span>
      </p>
      {showSlowHint && (
        <p
          className={cn(
            "text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {slowTier >= 2
            ? "This is taking longer than usual — you can wait or try a direct watch/reel URL."
            : "Still fetching metadata from the source…"}
        </p>
      )}
    </div>
  );
}
