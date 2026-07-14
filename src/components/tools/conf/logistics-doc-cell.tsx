"use client";

import { FileUp } from "lucide-react";
import { PassportViewerModal } from "@/components/tools/conf/passport-viewer-modal";
import { delegateDocumentAcceptAttribute } from "@/lib/conf/file-upload-client";

export function LogisticsDocCell({
  kind,
  previewUrl,
  proxyUrl,
  isPdf,
  label,
  uploading = false,
  onUpload,
  readOnly = false,
}: {
  kind: "passport" | "entry-stamp" | "visa";
  previewUrl: string | null;
  proxyUrl: string;
  isPdf: boolean;
  label: string;
  uploading?: boolean;
  onUpload?: (file: File | null) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="h-[92px] w-[132px] overflow-hidden rounded-md border border-border bg-muted">
        {previewUrl ? (
          isPdf ? (
            <iframe
              src={proxyUrl}
              title={label}
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxyUrl}
              alt={label}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-1 text-center text-[9px] leading-tight text-muted-foreground">
            {label} — missing
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {previewUrl ? (
          <PassportViewerModal
            proxyUrl={proxyUrl}
            isPdf={isPdf}
            label="View"
            title={label}
            triggerClassName="px-1.5 py-0.5 text-[10px] leading-none"
          />
        ) : null}
        {!readOnly && onUpload ? (
          <label
            className={`inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-accent ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <FileUp className="size-3" />
            {uploading ? "…" : "Upload"}
            <input
              type="file"
              className="hidden"
              accept={delegateDocumentAcceptAttribute(kind)}
              onChange={(e) => {
                onUpload(e.target.files?.[0] || null);
                e.currentTarget.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
