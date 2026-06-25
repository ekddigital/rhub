/**
 * Client-side helpers so booklet PDF export is reliable before html2canvas capture:
 * fonts, static assets, React paint, page presence, and image decode in #booklet-print-root.
 */

import {
  settleAfterPrintRootUpdate,
  waitForLetterPagesInDom,
} from "./letter-pdf-batch-support";

const BOOKLET_STATIC_ASSETS = [
  "/conf/lsuic_logo.png",
  "/conf/liberia-seal.svg",
  "/conf/assets/jinan_city/evening_view_portrait.png",
  "/conf/assets/jinan_city/day_view_landscape.png",
  "/conf/assets/jinan_city/morning_view_landscape.png",
  "/conf/assets/hotel/main_entrance_view.png",
  "/conf/assets/hotel/conference_hall.jpg",
  "/conf/president_boakai_Liberia.png",
  "/conf/president_xi_China.png",
  "/conf/placeholder-delegate.svg",
] as const;

function preloadUrl(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = src;
  });
}

/** Warm fonts + booklet artwork used across cover, headers, and delegate placeholders. */
export async function warmupBookletPdfExport(): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  await Promise.all(BOOKLET_STATIC_ASSETS.map(preloadUrl));
}

export { settleAfterPrintRootUpdate };

/** Poll until `.booklet-page` nodes exist under the print root (or timeout). */
export async function waitForBookletPagesInDom(
  containerId = "booklet-print-root",
  minPages = 1,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<boolean> {
  return waitForLetterPagesInDom(containerId, ".booklet-page", minPages, opts);
}

/**
 * Wait until images in the print root have loaded or errored.
 * Unloaded 0×0 images break html2canvas `createPattern` during capture.
 */
export async function waitForBookletImagesInDom(
  containerId = "booklet-print-root",
  opts?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = opts?.timeoutMs ?? 15_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    const pending = imgs.filter((img) => !img.complete);

    if (pending.length === 0) {
      // Brief settle after last decode
      await new Promise((r) => setTimeout(r, 150));
      return;
    }

    await Promise.all(
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    );
    await new Promise((r) => setTimeout(r, 40));
  }
}

/** Hide 0×0 images so html2canvas does not pass empty canvases to createPattern. */
export function hideZeroSizeImages(container: HTMLElement): void {
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.naturalWidth || !img.naturalHeight) {
      img.style.visibility = "hidden";
      img.style.display = "none";
    }
  });
}
