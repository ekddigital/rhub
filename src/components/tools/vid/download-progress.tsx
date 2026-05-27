"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DownloadProgressProps = {
  active: boolean;
  label?: string;
  success?: boolean;
  error?: string;
};

export function DownloadProgress({
  active,
  label = "Preparing download…",
  success,
  error,
}: DownloadProgressProps) {
  if (!active && !success && !error) return null;

  return (
    <div className="space-y-2" aria-live="polite">
      {active && (
        <Alert
          className="border-gold/30 bg-gold/5 flex items-center gap-3"
          aria-busy="true"
        >
          <Loader2 className="w-5 h-5 animate-spin text-gold shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gold/20">
              <div className="h-full w-2/5 rounded-full bg-gold animate-pulse" />
            </div>
          </div>
        </Alert>
      )}

      {success && !active && (
        <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Download started — check your downloads folder.
        </Alert>
      )}

      {error && !active && (
        <Alert className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertDescription className="whitespace-normal wrap-break-word leading-relaxed">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
