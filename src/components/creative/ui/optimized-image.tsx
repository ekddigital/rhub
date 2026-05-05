import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
}: OptimizedImageProps) {
  const [isLoading, setLoading] = useState(true);

  return (
    <div className={`overflow-hidden ${fill ? "relative w-full h-full" : ""}`}>
      <Image
        src={src}
        alt={alt || ""}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={`
          duration-700 ease-in-out
          ${isLoading ? "scale-110 blur-lg" : "scale-100 blur-0"}
          ${className || ""}
        `}
        onLoad={() => setLoading(false)}
        priority={priority}
        quality={85}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 1920px"
        fill={fill}
      />
    </div>
  );
}
