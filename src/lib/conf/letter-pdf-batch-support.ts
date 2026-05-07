/**
 * Client-side helpers so bulk letter PDF export is reliable before capture:
 * fonts, static images, React paint, and `.letter-page` presence in #letter-print-root.
 */

function preloadUrl(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = src;
  });
}

/** Warm fonts + logo used on every letter page (reduces first-frame blank captures). */
export async function warmupLetterBulkPdfExport(): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  await preloadUrl("/conf/lsuic_logo.png");
}

/** Wait for the browser to paint after React commits print-root updates. */
export async function settleAfterPrintRootUpdate(): Promise<void> {
  await new Promise<void>((r) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    ),
  );
}

/**
 * Poll until `.letter-page` nodes exist under the container (or timeout).
 * Returns false if `minPages` never appears — caller should skip or retry that draft.
 */
export async function waitForLetterPagesInDom(
  containerId: string,
  pageSelector: string,
  minPages: number,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<boolean> {
  const timeoutMs = opts?.timeoutMs ?? 10_000;
  const intervalMs = opts?.intervalMs ?? 50;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const root = document.getElementById(containerId);
    const n = root?.querySelectorAll(pageSelector).length ?? 0;
    if (n >= minPages) {
      await new Promise((r) => setTimeout(r, 100));
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/** Yield so the UI can show progress between heavy html2canvas passes. */
export async function yieldToMain(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}
