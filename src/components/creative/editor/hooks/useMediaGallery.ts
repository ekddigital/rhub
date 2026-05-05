/**
 * Shared hook for loading and managing media gallery
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { listAssetsClient } from "@/lib/creative/shims/lib/ekd-assets-client";
import type { MediaAsset } from "../types";

interface UseMediaGalleryOptions {
  assetType?: "images" | "videos" | "documents" | "audios";
  projectName?: string;
  limit?: number;
  autoLoad?: boolean;
}

interface UseMediaGalleryReturn {
  assets: MediaAsset[];
  isLoading: boolean;
  error: string | null;
  loadAssets: () => Promise<void>;
  refresh: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useMediaGallery(
  options: UseMediaGalleryOptions = {}
): UseMediaGalleryReturn {
  const {
    assetType = "images",
    projectName = "blog",
    limit = 30,
    autoLoad = true,
  } = options;

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const loadAssets = useCallback(
    async (resetOffset = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const currentOffset = resetOffset ? 0 : offset;
        console.log("[useMediaGallery] Loading assets:", {
          assetType,
          projectName,
          limit,
          offset: currentOffset,
          resetOffset
        });
        
        const result = await listAssetsClient({
          assetType,
          projectName,
          limit,
          offset: currentOffset,
        });

        console.log("[useMediaGallery] Received result:", {
          total: result.total,
          assetsCount: result.assets?.length || 0,
          assets: result.assets
        });

        const mappedAssets: MediaAsset[] = result.assets.map((raw) => {
          const asset = raw as Record<string, unknown>;
          const id = String(asset.id ?? asset.asset_id ?? "");
          const url = String(
            asset.url ??
              asset.public_url ??
              asset.secure_url ??
              asset.download_url ??
              "",
          );
          return {
            id,
            url,
            publicUrl: (asset.public_url ?? asset.secure_url) as
              | string
              | undefined,
            width: asset.width as number | undefined,
            height: asset.height as number | undefined,
            format: asset.format as string | undefined,
            fileSize: (asset.file_size ?? asset.size) as number | undefined,
            createdAt: asset.created_at as string | undefined,
            publicId: (asset.public_id ?? asset.name) as string | undefined,
            name: asset.name as string | undefined,
          };
        });

        console.log("[useMediaGallery] Mapped assets:", mappedAssets.length);

        if (resetOffset) {
          setAssets(mappedAssets);
          setOffset(limit);
        } else {
          setAssets((prev) => [...prev, ...mappedAssets]);
          setOffset((prev) => prev + limit);
        }

        setTotal(result.total);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load assets";
        setError(errorMessage);
        console.error("[useMediaGallery] Failed to load assets:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [assetType, projectName, limit, offset]
  );

  const refresh = useCallback(async () => {
    await loadAssets(true);
  }, [loadAssets]);

  const loadMore = useCallback(async () => {
    if (!isLoading && assets.length < total) {
      await loadAssets(false);
    }
  }, [isLoading, assets.length, total, loadAssets]);

  useEffect(() => {
    if (autoLoad) {
      loadAssets(true);
    }
  }, [autoLoad, loadAssets]); // Only run on mount

  return {
    assets,
    isLoading,
    error,
    loadAssets: () => loadAssets(true),
    refresh,
    hasMore: assets.length < total,
    loadMore,
  };
}
