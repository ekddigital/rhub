import "server-only";

/** True when both TTYD_BASE_URL and TTYD_KEY are set (same as doc/admin remote features). */
export function isTtydConfigured(): boolean {
  return Boolean(
    process.env.TTYD_BASE_URL?.trim() && process.env.TTYD_KEY?.trim(),
  );
}
