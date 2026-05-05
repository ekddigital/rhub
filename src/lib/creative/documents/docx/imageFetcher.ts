/**
 * DOCX Image Fetcher
 * Pre-fetches images from any source (URLs, data-URIs) and returns
 * binary data ready for ImageRun embedding.
 * Shared between DOCX export and potentially other export formats.
 */

import type { DocumentNode, FigureNode, SignatureBlockNode } from "../types";

/* ─── Types ──────────────────────────────────────────────────── */

export type DocxImageType = "jpg" | "png" | "gif" | "bmp";

export interface FetchedImage {
  data: ArrayBuffer;
  width: number;
  height: number;
  imageType: DocxImageType;
}

/* ─── Helpers ────────────────────────────────────────────────── */

/** Map a MIME type string to a DOCX-compatible image type. */
export function mimeToDocxType(mime: string): DocxImageType {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("bmp")) return "bmp";
  return "png"; // Default — PNG is the safest fallback
}

/**
 * Fetch an image from a URL and return its binary data + dimensions.
 * Handles external URLs, local paths, and data URLs.
 * Falls back to a server-side proxy if CORS prevents direct fetch.
 */
export async function fetchImageData(
  src: string,
): Promise<FetchedImage | null> {
  try {
    let blob: Blob;

    if (src.startsWith("data:")) {
      const res = await fetch(src);
      blob = await res.blob();
    } else {
      // Strategy 1: Direct CORS fetch
      let fetched = false;
      try {
        const res = await fetch(src, { mode: "cors", cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty response");
        fetched = true;
        console.log(`[DOCX Export] ✓ Direct fetch: ${src.slice(0, 80)}`);
      } catch (e) {
        console.log(
          `[DOCX Export] Direct fetch failed: ${src.slice(0, 80)}: ${e}`,
        );
        blob = new Blob();
      }

      // Strategy 2: Proxy fallback
      if (!fetched) {
        const proxyUrl = `/api/assets/proxy?url=${encodeURIComponent(src)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Proxy HTTP ${res.status} — ${errBody}`);
        }
        blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty proxy response");
        console.log(`[DOCX Export] ✓ Proxy fetch: ${src.slice(0, 80)}`);
      }
    }

    const imageType = mimeToDocxType(blob.type);

    // Get dimensions via Image element
    const objectUrl = URL.createObjectURL(blob);
    const { width, height } = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    const arrayBuffer = await blob.arrayBuffer();
    return { data: arrayBuffer, width, height, imageType };
  } catch (err) {
    console.warn(`[DOCX Export] ✗ Could not fetch image: ${src}`, err);
    return null;
  }
}

/**
 * Pre-fetch all images referenced in the document model,
 * plus the company logo for embedding in cover page and headers.
 * Returns a Map from src URL → FetchedImage.
 */
export async function prefetchDocumentImages(
  nodes: DocumentNode[],
  extraUrls?: string[],
): Promise<Map<string, FetchedImage>> {
  const map = new Map<string, FetchedImage>();
  const urls = new Set<string>();

  for (const node of nodes) {
    if (node.type === "figure" && (node as FigureNode).src) {
      urls.add((node as FigureNode).src);
    }
    if (
      node.type === "signature-block" &&
      (node as SignatureBlockNode).signatureImage
    ) {
      urls.add((node as SignatureBlockNode).signatureImage!);
    }
  }

  // Include extra URLs (e.g. company logo)
  if (extraUrls) {
    for (const url of extraUrls) {
      if (url) urls.add(url);
    }
  }

  console.log(`[DOCX Export] Pre-fetching ${urls.size} image(s)…`);
  await Promise.all(
    Array.from(urls).map(async (url) => {
      const data = await fetchImageData(url);
      if (data) map.set(url, data);
    }),
  );
  console.log(
    `[DOCX Export] Successfully fetched ${map.size}/${urls.size} images`,
  );

  return map;
}
