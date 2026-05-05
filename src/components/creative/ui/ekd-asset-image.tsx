/**
 * EKD Assets Image Component
 * Image component for EKD Digital asset URLs (optimizations via EKD API only — no third-party CDN SDKs).
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/creative/shims/lib/ekd-assets-api";

interface EKDAssetImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
  retryCount?: number;
  timeout?: number;
  placeholderColor?: string;
  useNextImage?: boolean;
  quality?: number;
  format?: "auto" | "jpg" | "png" | "webp";
  crop?: "fill" | "scale" | "auto" | "thumb";
}

export function EKDAssetImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority = false,
  fallbackSrc = "/images/placeholder.png",
  retryCount = 2,
  timeout = 8000,
  placeholderColor = "#f3f4f6",
  useNextImage = true,
  quality = 80,
  format = "auto",
  crop = "fill",
}: EKDAssetImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate optimized URL for EKD Assets
  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format,
  });

  // Reset state when src changes
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setRetries(0);
  }, [src]);

  // Set up timeout for image loading
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isLoading && !error) {
      const id = setTimeout(() => {
        if (retries < retryCount) {
          console.warn(`EKD Asset image load timeout (${timeout}ms): ${src}`);
          setRetries((prev) => prev + 1);
        } else {
          console.error(
            `EKD Asset image failed after ${retryCount} retries: ${src}`
          );
          setError(true);
          setIsLoading(false);
        }
      }, timeout);

      timeoutRef.current = id;

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [src, isLoading, retries, retryCount, timeout, error]);

  const clearImageTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleLoad = () => {
    clearImageTimeout();
    setIsLoading(false);
  };

  const handleError = () => {
    clearImageTimeout();
    if (retries < retryCount) {
      setRetries((prev) => prev + 1);
    } else {
      setIsLoading(false);
      setError(true);
    }
  };

  // Render fallback image if there's an error or exceeded retries
  if (error) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={!useNextImage}
        data-crop-mode={crop}
      />
    );
  }

  return (
    <div className="relative" data-crop-mode={crop}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: placeholderColor }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        sizes={sizes}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        unoptimized={!useNextImage}
        data-crop-mode={crop}
      />
    </div>
  );
}

// Alias for backward compatibility
export const AssetImage = EKDAssetImage;
export default EKDAssetImage;
