/**
 * PDF Export Engine
 * Client-side PDF generation using html2canvas + jsPDF.
 * Captures each .a4-page element individually and assembles into a multi-page PDF.
 * Includes PDF outline/bookmarks from document headings for sidebar navigation.
 *
 * All images (logos, signatures, uploaded assets) are converted to inline
 * base64 data-URLs before capture so they render reliably regardless of
 * CORS headers on the origin server.
 */

import { A4 } from "./constants";

/* ================================================================
   Bookmark extraction — scans rendered pages for headings
   ================================================================ */

/** Exact navigation destination within a PDF page */
interface DestInfo {
  pdfPage: number; // 1-indexed PDF page
  topMm: number; // mm from top of page in jsPDF coordinate space
}

interface BookmarkEntry {
  title: string;
  level: number; // 1, 2, or 3
  pageNumber: number; // 1-indexed PDF page number
  topMm: number; // Y mm from top of page for exact navigation
}

/**
 * Scan .a4-page elements for heading elements (h1–h3) and record the
 * page number (1-indexed) and exact Y position where each heading appears.
 */
function extractBookmarks(
  pages: NodeListOf<HTMLElement>,
  idToDestination: Map<string, DestInfo>,
): BookmarkEntry[] {
  const bookmarks: BookmarkEntry[] = [];
  pages.forEach((page, pageIdx) => {
    const headings = page.querySelectorAll<HTMLElement>("h1, h2, h3");
    headings.forEach((h) => {
      const level = parseInt(h.tagName.charAt(1), 10);
      const title = (h.textContent || "").trim();
      if (title) {
        const dest = h.id ? idToDestination.get(h.id) : undefined;
        bookmarks.push({
          title,
          level,
          pageNumber: pageIdx + 1,
          topMm: dest?.topMm ?? 0,
        });
      }
    });
  });
  return bookmarks;
}

/**
 * Add outline/bookmark entries to the PDF so readers can navigate
 * via the sidebar bookmarks panel.
 *
 * jsPDF's default outline renderer hardcodes the destination to the TOP of
 * the page (/XYZ 0 <pageTop> 0). We patch renderItems to instead use the
 * exact heading Y coordinate so clicking a bookmark scrolls to the section.
 */
function addOutlines(
  pdf: import("jspdf").jsPDF,
  bookmarks: BookmarkEntry[],
): void {
  if (bookmarks.length === 0) return;

  // Track the last outline item at each level so children can be nested
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parents: Record<number, any> = {};

  for (const bm of bookmarks) {
    // Determine parent: a level-2 heading is nested under the most recent
    // level-1 heading, a level-3 under the most recent level-2, etc.
    let parent = null;
    if (bm.level === 2 && parents[1]) {
      parent = parents[1];
    } else if (bm.level === 3 && parents[2]) {
      parent = parents[2];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: any = pdf.outline.add(parent, bm.title, {
      pageNumber: bm.pageNumber,
    });

    // Stash exact Y position for the patched renderer below
    item._topMm = bm.topMm;

    parents[bm.level] = item;
    // When a higher-level heading appears, clear lower-level parents
    if (bm.level <= 2) delete parents[3];
    if (bm.level <= 1) delete parents[2];
  }

  // --- Patch outline.renderItems for exact Y coordinate navigation ---
  // jsPDF's built-in renderItems always writes /XYZ 0 <pageTop> 0 which
  // navigates to the TOP of the destination page. We override it to write
  // the exact Y coordinate we measured for each heading so the PDF reader
  // scrolls to the heading itself, not just its page.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outline = (pdf as any).outline;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outline.renderItems = function (this: any, node: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getVCS: (v: number) => string =
      this.ctx.pdf.internal.getVerticalCoordinateString;

    for (let i = 0; i < node.children.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item: any = node.children[i];
      this.objStart(item);
      this.line("/Title " + this.makeString(item.title));
      this.line("/Parent " + this.makeRef(node));
      if (i > 0) this.line("/Prev " + this.makeRef(node.children[i - 1]));
      if (i < node.children.length - 1)
        this.line("/Next " + this.makeRef(node.children[i + 1]));
      if (item.children.length > 0) {
        this.line("/First " + this.makeRef(item.children[0]));
        this.line(
          "/Last " + this.makeRef(item.children[item.children.length - 1]),
        );
      }
      const count = this.count_r({ count: 0 }, item);
      if (count > 0) this.line("/Count " + count);
      if (item.options && item.options.pageNumber) {
        const info = this.ctx.pdf.internal.getPageInfo(item.options.pageNumber);
        // Use exact Y coordinate — fall back to 0 (top of page) if unavailable
        const topMm = typeof item._topMm === "number" ? item._topMm : 0;
        const topCoord = getVCS(topMm);
        this.line("/Dest [" + info.objId + " 0 R /XYZ 0 " + topCoord + " 0]");
      }
      this.objEnd();
    }
    for (let z = 0; z < node.children.length; z++) {
      this.renderItems(node.children[z]);
    }
  };
}

/* ================================================================
   Image → Data URL Conversion
   ================================================================ */

/**
 * Convert a Blob to a base64 data-URL string.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetch a single image URL and return an inline base64 data-URL.
 * Tries three strategies:
 *  1. Direct CORS fetch (works for same-origin & CORS-enabled servers)
 *  2. Proxy fetch via /api/assets/proxy (bypasses CORS server-side)
 *  3. Canvas capture of the already-loaded <img> element (last resort)
 * Falls back to the original URL if all strategies fail.
 */
async function urlToDataUrl(
  url: string,
  existingImg?: HTMLImageElement,
): Promise<string> {
  // Strategy 1 — Direct CORS fetch
  // Use cache: "no-store" to avoid reusing the opaque (non-CORS) cache
  // entry that the browser created when the <img> loaded normally.
  try {
    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (blob.size === 0) throw new Error("Empty response");
    const dataUrl = await blobToDataUrl(blob);
    console.log(
      `[PDF Export] ✓ Direct CORS fetch succeeded: ${url.slice(0, 80)}`,
    );
    return dataUrl;
  } catch (e) {
    console.log(
      `[PDF Export] Direct CORS failed for ${url.slice(0, 80)}: ${e}`,
    );
  }

  // Strategy 2 — Proxy fetch (server-side, no CORS needed)
  try {
    const proxied = `/api/assets/proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok)
      throw new Error(
        `Proxy HTTP ${res.status} — ${await res.text().catch(() => "")}`,
      );
    const blob = await res.blob();
    if (blob.size === 0) throw new Error("Empty proxy response");
    const dataUrl = await blobToDataUrl(blob);
    console.log(`[PDF Export] ✓ Proxy fetch succeeded: ${url.slice(0, 80)}`);
    return dataUrl;
  } catch (e) {
    console.log(`[PDF Export] Proxy failed for ${url.slice(0, 80)}: ${e}`);
  }

  // Strategy 3 — Canvas capture of the already-visible <img> element
  // The browser has already decoded this image (it's visible in the preview).
  // Drawing it to a canvas works when the image is same-origin or CORS-ok.
  if (existingImg && existingImg.naturalWidth > 0 && existingImg.complete) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = existingImg.naturalWidth;
      canvas.height = existingImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(existingImg, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        // Verify the canvas wasn't tainted (would throw on toDataURL)
        console.log(
          `[PDF Export] ✓ Canvas capture succeeded: ${url.slice(0, 80)}`,
        );
        return dataUrl;
      }
    } catch (e) {
      console.log(
        `[PDF Export] Canvas capture failed (tainted): ${url.slice(0, 80)}: ${e}`,
      );
    }
  }

  console.warn(`[PDF Export] ✗ ALL strategies failed for image: ${url}`);
  return url; // Return original URL as fallback
}

/**
 * Convert all `<img>` elements inside a container from external URLs to
 * inline base64 data-URLs. Returns a restore function that puts the
 * original `src` values back.
 *
 * This prevents html2canvas CORS / tainted-canvas issues that cause
 * images (signatures, uploaded assets, logos) to be missing from the PDF.
 */
async function inlineAllImages(container: HTMLElement): Promise<() => void> {
  const images = container.querySelectorAll<HTMLImageElement>("img");
  const originals: { img: HTMLImageElement; src: string }[] = [];

  // Also handle CSS background-image elements
  const bgElements: { el: HTMLElement; bg: string }[] = [];
  container.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const bg = el.style.backgroundImage;
    if (bg && bg.startsWith("url(")) {
      bgElements.push({ el, bg });
    }
  });

  const externalCount = Array.from(images).filter(
    (img) => img.src && !img.src.startsWith("data:"),
  ).length;
  console.log(
    `[PDF Export] Found ${images.length} images (${externalCount} external) in container`,
  );

  // Convert img src attributes in parallel
  let successCount = 0;
  let failCount = 0;
  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      // Skip images that are already data URLs, blob URLs, or empty
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;

      originals.push({ img, src });

      try {
        // Pass the existing img element so urlToDataUrl can try canvas capture
        const dataUrl = await urlToDataUrl(src, img);

        // Only apply if we got a real data URL back
        if (dataUrl.startsWith("data:")) {
          img.src = dataUrl;

          // Wait for the browser to decode the new data URL
          await new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        console.warn(`[PDF Export] Failed to inline image: ${src}`, e);
        failCount++;
      }
    }),
  );

  // Convert CSS background images
  await Promise.all(
    bgElements.map(async ({ el, bg }) => {
      const match = bg.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
      if (!match) return;
      try {
        const dataUrl = await urlToDataUrl(match[1]);
        if (dataUrl.startsWith("data:")) {
          el.style.backgroundImage = `url("${dataUrl}")`;
        }
      } catch {
        // Keep original
      }
    }),
  );

  console.log(
    `[PDF Export] Image inlining complete: ${successCount} succeeded, ${failCount} failed`,
  );

  // Return a function that restores all originals
  return () => {
    for (const { img, src } of originals) {
      img.src = src;
    }
    for (const { el, bg } of bgElements) {
      el.style.backgroundImage = bg;
    }
  };
}

/* ================================================================
   SVG → PNG Pre-rasterization
   ================================================================ */

/**
 * html2canvas has notoriously poor SVG support — gradients, filters,
 * <text> positioning, and drop shadows all break or disappear.
 *
 * This function finds all <img> elements whose src is an SVG (either
 * a .svg URL or a data:image/svg+xml data-URL) and pre-rasterizes them
 * to high-quality PNG using the browser's native SVG renderer at 4× scale.
 *
 * IMPORTANT: This does NOT replace img.src. Instead it returns a rasterMap
 * (img element → PNG data-URL) so the export loop can:
 *   1. Hide the SVG from html2canvas (no lossy JPEG compression on SVG)
 *   2. Add the crisp PNG directly to the PDF at the exact element position
 *
 * This "hybrid" approach gives JPEG-sized pages + vector-quality SVGs.
 */
async function rasterizeSVGs(container: HTMLElement): Promise<{
  rasterMap: Map<HTMLImageElement, string>;
  restore: () => void;
}> {
  const images = container.querySelectorAll<HTMLImageElement>("img");
  const rasterMap = new Map<HTMLImageElement, string>();

  const svgImages = Array.from(images).filter((img) => {
    const src = img.src || "";
    return (
      src.endsWith(".svg") ||
      src.includes(".svg?") ||
      src.startsWith("data:image/svg+xml")
    );
  });

  if (svgImages.length === 0) return { rasterMap, restore: () => {} };

  console.log(`[PDF Export] Found ${svgImages.length} SVG images to rasterize`);

  // 4× gives crisp results when the PNG is placed at the element's display size in the PDF
  const SCALE = 4;

  for (const img of svgImages) {
    const originalSrc = img.src;

    try {
      // Get the SVG content as a data URL if it isn't already
      let svgDataUrl = originalSrc;

      if (!originalSrc.startsWith("data:")) {
        try {
          const response = await fetch(originalSrc, {
            mode: "cors",
            cache: "no-store",
          });
          if (response.ok) {
            const svgText = await response.text();
            svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
          }
        } catch {
          try {
            const proxied = `/api/assets/proxy?url=${encodeURIComponent(originalSrc)}`;
            const res = await fetch(proxied);
            if (res.ok) {
              const svgText = await res.text();
              svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
            }
          } catch {
            // Use whatever the browser already has
          }
        }
      }

      const tmpImg = new Image();
      tmpImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        tmpImg.onload = () => resolve();
        tmpImg.onerror = () => reject(new Error("SVG image failed to load"));
        tmpImg.src = svgDataUrl;
      });

      // Prefer natural SVG dimensions; fall back to the element's display size
      const naturalW = tmpImg.naturalWidth || 0;
      const naturalH = tmpImg.naturalHeight || 0;
      const renderW = naturalW > 1 ? naturalW : img.clientWidth || 800;
      const renderH = naturalH > 1 ? naturalH : img.clientHeight || 600;

      const canvas = document.createElement("canvas");
      canvas.width = renderW * SCALE;
      canvas.height = renderH * SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      // Transparent background — let the page JPEG show through (letterhead borders etc.)
      ctx.drawImage(tmpImg, 0, 0, canvas.width, canvas.height);

      const pngDataUrl = canvas.toDataURL("image/png");
      // Store PNG in the map — src is left untouched
      rasterMap.set(img, pngDataUrl);

      console.log(
        `[PDF Export] ✓ SVG rasterized: ${originalSrc.slice(0, 60)} → ${renderW * SCALE}×${renderH * SCALE}px PNG`,
      );
    } catch (e) {
      console.warn(
        `[PDF Export] ✗ SVG rasterization failed: ${originalSrc.slice(0, 60)}`,
        e,
      );
    }
  }

  console.log(
    `[PDF Export] SVG rasterization complete: ${rasterMap.size}/${svgImages.length} converted`,
  );

  // No src replacement was done — restore is a no-op
  return { rasterMap, restore: () => {} };
}

/* ================================================================
   PDF Export
   ================================================================ */

export type ExportToPdfOptions = {
  /** Elements to capture (default `.a4-page`) */
  pageSelector?: string;
  /**
   * Wrapper queried via `closest()` for temporary transform reset.
   * Default `.a4-page-wrapper`. Pass `null` for layouts without that wrapper (e.g. letter composer).
   */
  pageWrapperSelector?: string | null;
  /** `download` saves a file (default). `blob` returns a `Blob` for ZIP/API use. */
  mode?: "download" | "blob";
};

/**
 * Export the letterhead document to PDF.
 * Targets page elements inside the container (default: `.a4-page`).
 *
 * @param containerId - ID of the root container
 * @param filename - Output filename stem without extension (used when `mode` is `download`)
 * @param onProgress - Optional callback receiving (percent 0-100, stage label)
 * @param opts - Page selectors and output mode
 * @returns When `mode` is `blob`, the PDF `Blob`; otherwise `undefined` after download.
 */
export async function exportToPDF(
  containerId: string = "letterhead-document",
  filename: string = "document",
  onProgress?: (pct: number, stage: string) => void,
  opts?: ExportToPdfOptions,
): Promise<Blob | undefined> {
  // Dynamic imports to keep initial bundle small
  onProgress?.(5, "Loading modules…");
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const pageSelector = opts?.pageSelector ?? ".a4-page";
  const wrapSel: string | null =
    opts?.pageWrapperSelector === undefined
      ? ".a4-page-wrapper"
      : opts.pageWrapperSelector;
  const mode = opts?.mode ?? "download";

  const nearestPageWrapper = (page: HTMLElement) =>
    wrapSel ? page.closest<HTMLElement>(wrapSel) : null;

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container #${containerId} not found`);
  }

  // Find all page elements
  const pages = container.querySelectorAll<HTMLElement>(pageSelector);
  if (pages.length === 0) {
    throw new Error(
      `No ${pageSelector} elements found in the container #${containerId}`,
    );
  }

  // Create PDF (A4 portrait)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = A4.mm.width; // 210mm
  const pdfHeight = A4.mm.height; // 297mm

  // Wait for all fonts to be loaded for accurate rendering
  onProgress?.(12, "Loading fonts…");
  await document.fonts.ready;

  // --- Critical: Convert ALL images to inline data URLs ---
  // This prevents CORS / tainted-canvas issues that make images
  // (signatures, uploaded assets, external images) disappear from PDF.
  console.log("[PDF Export] Starting image inlining…");
  onProgress?.(20, "Processing images…");
  const restoreImages = await inlineAllImages(container);

  // --- Pre-rasterize SVG images to high-res PNG ---
  // We do NOT let html2canvas touch SVGs (poor gradient/text support).
  // Instead we rasterize each SVG independently and overlay as crisp
  // PNG directly on the PDF page after the JPEG background is written.
  console.log("[PDF Export] Starting SVG rasterization…");
  onProgress?.(38, "Rendering SVGs…");
  const { rasterMap, restore: restoreSVGs } = await rasterizeSVGs(container);

  // Brief delay for layout to settle
  onProgress?.(48, "Laying out pages…");
  await new Promise((r) => setTimeout(r, 300));

  // --- Build element-id → {pdfPage, topMm} map for precise internal link destinations ---
  // This lets us add real clickable links over TOC / List of Tables / List of Figures
  // entries after each page is captured (html2canvas only produces a bitmap —
  // <a href> anchors are lost). We scan every .a4-page once now, while the DOM
  // is in its settled state, recording both which PDF page each id lands on
  // AND the exact Y coordinate of that element within its page.
  //
  // We must temporarily reset the zoom transform on each page wrapper so that
  // getBoundingClientRect() returns unscaled coordinates that map cleanly to mm.
  const idToDestination = new Map<string, DestInfo>();
  pages.forEach((page, idx) => {
    const wrapper = nearestPageWrapper(page);
    const origTransform = wrapper?.style.transform;
    const origMarginBottom = wrapper?.style.marginBottom;
    if (wrapper) {
      wrapper.style.transform = "none";
      wrapper.style.marginBottom = "0";
    }
    const pageRect = page.getBoundingClientRect();
    page.querySelectorAll<HTMLElement>("[id]").forEach((el) => {
      if (!el.id) return;
      const elRect = el.getBoundingClientRect();
      // Y from top of page in mm — clamped to [0, pdfHeight]
      const topMm = Math.min(
        pdfHeight,
        Math.max(
          0,
          ((elRect.top - pageRect.top) / pageRect.height) * pdfHeight,
        ),
      );
      idToDestination.set(el.id, { pdfPage: idx + 1, topMm });
    });
    if (wrapper) {
      wrapper.style.transform = origTransform || "";
      wrapper.style.marginBottom = origMarginBottom || "";
    }
  });

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Report per-page progress: 50% → 88%
      const pagePct = 50 + Math.round(((i + 0.5) / pages.length) * 38);
      onProgress?.(pagePct, `Capturing page ${i + 1} of ${pages.length}…`);

      // Reset the page transform so html2canvas captures at natural CSS size
      const wrapper = nearestPageWrapper(page);
      const originalTransform = wrapper?.style.transform;
      const originalMarginBottom = wrapper?.style.marginBottom;
      if (wrapper) {
        wrapper.style.transform = "none";
        wrapper.style.marginBottom = "0";
      }

      // Measure all positions NOW — transform is reset so getBoundingClientRect()
      // returns the full-resolution coordinates that match our mm calculations.
      const pageRect = page.getBoundingClientRect();

      // SVGs to overlay as crisp PNGs
      const svgsOnPage = Array.from(
        page.querySelectorAll<HTMLImageElement>("img"),
      )
        .filter((img) => rasterMap.has(img))
        .map((img) => {
          const r = img.getBoundingClientRect();
          const xMm = ((r.left - pageRect.left) / pageRect.width) * pdfWidth;
          const yMm = ((r.top - pageRect.top) / pageRect.height) * pdfHeight;
          const wMm = (r.width / pageRect.width) * pdfWidth;
          const hMm = (r.height / pageRect.height) * pdfHeight;
          return { img, png: rasterMap.get(img)!, xMm, yMm, wMm, hMm };
        });

      // TOC / List of Tables / List of Figures clickable link regions
      // We scan for every <a href="#…"> inside a .document-toc element so the
      // same selector covers TOC, List of Tables, and List of Figures pages.
      const tocLinkAnnotations = Array.from(
        page.querySelectorAll<HTMLAnchorElement>('.document-toc a[href^="#"]'),
      ).flatMap((link) => {
        const r = link.getBoundingClientRect();
        // Skip off-page or zero-size elements
        if (r.width <= 0 || r.height <= 0) return [];
        const xMm = ((r.left - pageRect.left) / pageRect.width) * pdfWidth;
        const yMm = ((r.top - pageRect.top) / pageRect.height) * pdfHeight;
        const wMm = (r.width / pageRect.width) * pdfWidth;
        const hMm = (r.height / pageRect.height) * pdfHeight;
        const href = link.getAttribute("href") ?? "";
        const targetId = href.startsWith("#") ? href.slice(1) : "";
        return targetId ? [{ xMm, yMm, wMm, hMm, targetId }] : [];
      });

      // Hide SVGs so the JPEG capture doesn't compress them
      for (const { img } of svgsOnPage) img.style.visibility = "hidden";

      // Capture page as JPEG at 3× resolution
      // JPEG is ~20× smaller than PNG and looks excellent for text/colour
      // SVGs are excluded and will be overlaid as crisp PNGs below
      const canvas = await html2canvas(page, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#FFFFFF",
        width: A4.px96.width,
        height: A4.px96.height,
        logging: false,
        imageTimeout: 30000,
        removeContainer: true,
      });

      // Restore SVG visibility
      for (const { img } of svgsOnPage) img.style.visibility = "";

      // Restore page transform
      if (wrapper) {
        wrapper.style.transform = originalTransform || "";
        wrapper.style.marginBottom = originalMarginBottom || "";
      }

      // JPEG for the page background — quality 0.92 keeps text sharp & file small
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // Overlay each SVG as a crisp PNG at its exact position in the PDF
      for (const { png, xMm, yMm, wMm, hMm } of svgsOnPage) {
        if (wMm > 0 && hMm > 0) {
          pdf.addImage(png, "PNG", xMm, yMm, wMm, hMm);
        }
      }

      // Add clickable PDF link annotations over every TOC / LOT / LOF entry.
      // pdf.link() places a transparent hotspot that the PDF reader makes
      // clickable. We pass the exact destination Y coordinate (topMm) so the
      // PDF reader scrolls to the precise heading location rather than just
      // jumping to the top of the destination page.
      for (const { xMm, yMm, wMm, hMm, targetId } of tocLinkAnnotations) {
        const dest = idToDestination.get(targetId);
        if (dest) {
          pdf.link(xMm, yMm, wMm, hMm, {
            pageNumber: dest.pdfPage,
            // top: Y from top of page in mm (jsPDF coordinate — 0 = page top)
            top: dest.topMm,
            // zoom 0 = inherit the reader's current zoom level
            zoom: 0,
          });
        }
      }
    }

    // --- PDF Bookmarks / Outlines ---
    onProgress?.(92, "Building bookmarks…");
    const bookmarks = extractBookmarks(pages, idToDestination);
    addOutlines(pdf, bookmarks);

    if (bookmarks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdf as any).setDisplayMode(null, null, "UseOutlines");
    }

    onProgress?.(97, "Saving file…");
    if (mode === "blob") {
      const blob = pdf.output("blob");
      onProgress?.(100, "Done");
      return blob;
    }
    pdf.save(`${filename}.pdf`);
    onProgress?.(100, "Done");
    return undefined;
  } finally {
    restoreSVGs();
    restoreImages();
  }
}

/**
 * Export as high-quality PNG (single page only, for previews).
 */
export async function exportPageAsImage(
  pageElement: HTMLElement,
  filename: string = "page",
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;

  // Inline images in the page element to avoid CORS issues
  const wrapper = pageElement.closest("#letterhead-document") as HTMLElement;
  const target = wrapper || pageElement;
  const restoreImages = await inlineAllImages(target);
  const { restore: restoreSVGs } = await rasterizeSVGs(target);
  await new Promise((r) => setTimeout(r, 200));

  try {
    const canvas = await html2canvas(pageElement, {
      scale: 3, // 3x for high quality
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#FFFFFF",
      width: A4.px96.width,
      height: A4.px96.height,
      logging: false,
      imageTimeout: 30000,
    });

    // Download
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    restoreSVGs();
    restoreImages();
  }
}
