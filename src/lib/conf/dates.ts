/**
 * Calculate whole days until `input` using the provided IANA time zone.
 *
 * - `input` may be a Date or a date-string like "YYYY-MM-DD".
 * - `timeZone` defaults to "UTC" but can be set to e.g. "Asia/Shanghai".
 *
 * Implementation: obtain the year/month/day for both `now` and the target
 * in the requested time zone (via Intl.formatToParts), then convert those
 * date parts to a UTC epoch at midnight and compute the day difference.
 */
export function daysUntilDate(input: string | Date, timeZone = "UTC"): number {
  const toParts = (d: Date) => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d);
      let year = 0;
      let month = 0;
      let day = 0;
      for (const p of parts) {
        if (p.type === "year") year = Number(p.value);
        if (p.type === "month") month = Number(p.value);
        if (p.type === "day") day = Number(p.value);
      }
      return { year, month, day };
    } catch (err) {
      // Fallback: use UTC parts when Intl with timeZone isn't available
      const dUtc = new Date(d);
      return {
        year: dUtc.getUTCFullYear(),
        month: dUtc.getUTCMonth() + 1,
        day: dUtc.getUTCDate(),
      };
    }
  };

  let targetParts;
  if (typeof input === "string") {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, yy, mm, dd] = m;
      // Treat plain YYYY-MM-DD as a date in the requested time zone
      targetParts = { year: Number(yy), month: Number(mm), day: Number(dd) };
    } else {
      targetParts = toParts(new Date(input));
    }
  } else {
    targetParts = toParts(new Date(input));
  }

  const nowParts = toParts(new Date());

  const targetEpoch = Date.UTC(
    targetParts.year,
    targetParts.month - 1,
    targetParts.day,
  );
  const nowEpoch = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);

  const days = Math.floor((targetEpoch - nowEpoch) / 86_400_000);
  return Math.max(0, days);
}
