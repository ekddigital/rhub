import { Noto_Sans_SC } from "next/font/google";

/** CJK-capable font for booklet screen, print, and PDF export. */
export const bookletFont = Noto_Sans_SC({
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const BOOKLET_FONT_STACK =
  `${bookletFont.style.fontFamily}, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`;
