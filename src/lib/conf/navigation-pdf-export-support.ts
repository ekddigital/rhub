import { preloadUrl } from "@/lib/conf/letter-pdf-batch-support";
import { NAV_PDF_STATIC_ASSETS } from "@/components/tools/conf/navigation-guide/assets";

export {
  settleAfterPrintRootUpdate,
  waitForBookletPagesInDom,
  waitForBookletImagesInDom,
  hideZeroSizeImages,
  normalizeBookletPagesForCapture,
} from "@/lib/conf/booklet-pdf-export-support";

export async function warmupNavigationPdfExport(): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  await Promise.all(NAV_PDF_STATIC_ASSETS.map((src) => preloadUrl(src)));
}
