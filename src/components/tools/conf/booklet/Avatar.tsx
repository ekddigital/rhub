import { C, ASSETS } from "./constants";

/**
 * Avatar component for booklet profiles.
 *
 * - `src` provided → show photo
 * - `src` null + `silhouette` true → show delegate placeholder silhouette SVG
 *   (used in delegate roster; communicates "photo pending" better than initials)
 * - `src` null + `silhouette` false (default) → show initials pill
 *   (used for committee, NEC, speaker cards)
 *
 * When a delegate later creates/links their account and uploads a photo, the
 * real photo will automatically replace the silhouette — no manual action needed.
 */
export function Avatar({
  src,
  name,
  size = 48,
  square = false,
  silhouette = false,
  borderColor = C.blue,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  square?: boolean;
  /** Show a person-silhouette placeholder instead of initials when photo is missing. */
  silhouette?: boolean;
  borderColor?: string;
}) {
  const radius = square ? "6px" : "50%";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // ── Real photo ──────────────────────────────────────────────────────────────
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          objectPosition: "top",
          flexShrink: 0,
          border: `2px solid ${borderColor}30`,
        }}
      />
    );
  }

  // ── Silhouette placeholder (delegate roster mode) ──────────────────────────
  if (silhouette) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ASSETS.placeholderDelegate}
        alt={`${name} – photo pending`}
        title="Photo will appear once the delegate links their account"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${borderColor}30`,
          opacity: 0.85,
        }}
      />
    );
  }

  // ── Initials pill (committee / NEC / speaker cards) ────────────────────────
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.darkBlue} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.max(10, size * 0.32),
        fontWeight: 700,
        color: C.white,
        border: `2px solid ${borderColor}30`,
        letterSpacing: "0.04em",
      }}
    >
      {initials}
    </div>
  );
}
