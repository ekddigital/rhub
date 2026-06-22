"use client";

import { AdaptivePhotoFrame } from "@/components/tools/conf/adaptive-photo-frame";

type DelegateTravelDocumentFrameProps = {
  src: string;
  alt: string;
  isPdf: boolean;
  containerClassName?: string;
};

/** Inline preview for passport / visa / entry-stamp via secure-document proxy. */
export function DelegateTravelDocumentFrame({
  src,
  alt,
  isPdf,
  containerClassName,
}: DelegateTravelDocumentFrameProps) {
  const containerClasses = [
    "relative overflow-hidden bg-muted",
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  if (isPdf) {
    return (
      <div className={containerClasses}>
        <iframe
          src={src}
          title={alt}
          className="h-full w-full border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <AdaptivePhotoFrame
      src={src}
      alt={alt}
      containerClassName={containerClassName}
    />
  );
}
