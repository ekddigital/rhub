"use client";

type AdaptivePhotoFrameProps = {
  src: string;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
};

export function AdaptivePhotoFrame({
  src,
  alt,
  containerClassName,
  imageClassName,
}: AdaptivePhotoFrameProps) {
  const containerClasses = [
    "relative overflow-hidden bg-muted",
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const foregroundClasses = [
    "relative z-10 h-full w-full object-contain object-top",
    imageClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {/* Use the same uploaded image as a blurred backdrop for dynamic color adaptation. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl saturate-125"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-white/15 via-transparent to-black/20"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-black/10 via-transparent to-black/10"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={foregroundClasses} />
    </div>
  );
}
