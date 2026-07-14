import { Noto_Sans_SC } from "next/font/google";

/** CJK-capable font for navigation guide screen, print, and PDF export. */
export const navigationGuideFont = Noto_Sans_SC({
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const NAV_GUIDE_FONT_STACK =
  `${navigationGuideFont.style.fontFamily}, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`;
