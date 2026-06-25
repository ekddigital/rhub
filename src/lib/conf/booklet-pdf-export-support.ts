/**
 * Client-side helpers so booklet PDF export is reliable before html2canvas capture:
 * fonts, static cover assets, React paint, and image decode in #booklet-print-root.
 */

import {
  preloadUrl,
  settleAfterPrintRootUpdate,
  waitForImagesInContainer,
  waitForLetterPagesInDom,
} from "./letter-pdf-batch-support";

export { settleAfterPrintRootUpdate };

/** Static booklet assets referenced on cover / headers (same paths as booklet/constants ASSETS). */
const BOOKLET_PDF_STATIC_ASSETS = [
  "/conf/lsuic_logo.png",
  "/conf/liberia-seal.svg",
  "/conf/assets/jinan_city/evening_view_portrait.png",
  "/conf/assets/hotel/main_entrance_view.png",
  "/conf/president_boakai_Liberia.png",
  "/conf/president_xi_China.png",
  "/conf/placeholder-delegate.svg",
] as const;

/** Warm fonts + recurring static images (reduces first-frame blank captures). */
export async function warmupBookletPdfExport(): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  await Promise.all(BOOKLET_PDF_STATIC_ASSETS.map((src) => preloadUrl(src)));
}

export async function waitForBookletPagesInDom(
  containerId: string,
  minPages: number,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<boolean> {
  return waitForLetterPagesInDom(
    containerId,
    ".booklet-page",
    minPages,
    opts,
  );
}

export async function waitForBookletImagesInDom(
  containerId: string,
): Promise<void> {
  await waitForImagesInContainer(containerId, { timeoutMs: 30_000 });
}

/** Hide images that failed to decode before html2canvas capture. */
export function hideZeroSizeImages(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      img.style.visibility = "hidden";
    }
  });
}

/**
 * Full pre-capture pipeline for booklet Live Preview export.
 * Returns false when `.booklet-page` nodes never appear in the print root.
 */
export async function prepareBookletPdfExport(
  minPages: number = 1,
): Promise<boolean> {
  await warmupBookletPdfExport();

  const pagesReady = await waitForBookletPagesInDom(
    "booklet-print-root",
    minPages,
    { timeoutMs: 12_000, intervalMs: 40 },
  );
  if (!pagesReady) return false;

  await waitForBookletImagesInDom("booklet-print-root");
  await settleAfterPrintRootUpdate();
  return true;
}
