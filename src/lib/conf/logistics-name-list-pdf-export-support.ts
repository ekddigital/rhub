import {
  preloadUrl,
  settleAfterPrintRootUpdate,
  waitForImagesInContainer,
  waitForLetterPagesInDom,
} from "./letter-pdf-batch-support";

export { settleAfterPrintRootUpdate };

const LOGISTICS_PDF_STATIC_ASSETS = [
  "/conf/lsuic_logo.png",
  "/conf/liberia-seal.svg",
] as const;

/** Warm fonts and static letterhead assets before capture. */
export async function warmupLogisticsPdfExport(): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  await Promise.all(LOGISTICS_PDF_STATIC_ASSETS.map((src) => preloadUrl(src)));
}

export async function waitForLogisticsPagesInDom(
  containerId: string,
  minPages: number,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<boolean> {
  return waitForLetterPagesInDom(containerId, ".document-page", minPages, opts);
}

export async function waitForLogisticsImagesInDom(
  containerId: string,
): Promise<void> {
  await waitForImagesInContainer(containerId, { timeoutMs: 30_000 });
}

/** Hide images that did not finish decoding before html2canvas capture. */
export function hideZeroSizeImages(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      img.style.visibility = "hidden";
    }
  });
}

/** Force every logistics page to exact A4 px for predictable capture. */
export function normalizeLogisticsPagesForCapture(
  containerId: string,
  pageWidth: number,
  pageHeight: number,
): void {
  const root = document.getElementById(containerId);
  if (!root) return;

  root.style.width = `${pageWidth}px`;
  root.style.maxWidth = `${pageWidth}px`;
  root.style.transform = "none";
  root.style.zoom = "1";

  root.querySelectorAll<HTMLElement>(".document-page").forEach((page) => {
    page.style.width = `${pageWidth}px`;
    page.style.height = `${pageHeight}px`;
    page.style.minHeight = `${pageHeight}px`;
    page.style.maxHeight = `${pageHeight}px`;
    page.style.transform = "none";
    page.style.zoom = "1";
    page.style.boxSizing = "border-box";
  });
}
