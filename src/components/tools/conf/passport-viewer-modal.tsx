"use client";

import { useState } from "react";
import { Eye, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Inline-proxy URL: /api/conf/[confId]/delegates/[delegateId]/secure-document?kind=... */
  proxyUrl: string;
  /** Whether this is a PDF (detected by original path extension) */
  isPdf: boolean;
  /** Button label */
  label?: string;
  /** Extra class for the trigger button */
  triggerClassName?: string;
  /** Viewer title */
  title?: string;
};

export function PassportViewerModal({
  proxyUrl,
  isPdf,
  label = "Full View",
  triggerClassName = "",
  title = "Passport Document",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent ${triggerClassName}`}
      >
        <Maximize2 className="size-3.5" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 flex max-h-[92vh] w-[92vw] max-w-4xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Eye className="size-4 text-muted-foreground" />
                {title}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
              {isPdf ? (
                <iframe
                  src={proxyUrl}
                  title={title}
                  className="h-[75vh] w-full rounded-lg border border-border bg-white"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proxyUrl}
                  alt={title}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
