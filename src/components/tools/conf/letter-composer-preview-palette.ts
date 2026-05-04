import { LP } from "./letter-composer-preview-chrome";

/** Extended palette for letter body / sidebar (beyond `LP` chrome tokens). */
export const LETTER_BODY_PALETTE = {
  darkNavy: "#001A4E",
  sideAccent: "#88A4C8",
  divider: "#1a3568",
} as const;

/** Combined tokens for inline styles in preview body + sidebar */
export function letterPreviewPalette() {
  return {
    navy: LP.navy,
    red: LP.red,
    gold: LP.gold,
    white: LP.white,
    muted: LP.muted,
    ...LETTER_BODY_PALETTE,
  };
}
