/**
 * DOCX Shared Styles & Constants
 * Color helpers, bookmark management, shared borders, and heading level map.
 *
 * Colour tokens, font sizes, and spacing are derived from the shared
 * style definitions in `lib/document/shared-styles.ts` which in turn
 * are computed from the canonical web constants in `constants.ts`.
 * This ensures DRY consistency between web preview and DOCX output.
 */

import { HeadingLevel, BorderStyle, type ITableCellBorders } from "docx";
import { COLORS } from "../shared-styles";

// Re-export shared-styles so existing imports continue to work
export {
  COLORS,
  FONT,
  FONT_SIZES,
  HEADING_SIZE_MAP,
  HEADING_COLOR_MAP,
  SPACING,
} from "../shared-styles";

/* ─── Brand colour tokens (derived from shared-styles) ───────── */
export const GOLD = COLORS.gold;
export const PRIMARY = COLORS.primary;
export const WHITE = COLORS.white;
export const LIGHT_BG = COLORS.lightBg;
export const BORDER_COLOR = COLORS.border;

/* ─── Heading level → docx HeadingLevel map ──────────────────── */
export const HEADING_MAP: Record<
  number,
  (typeof HeadingLevel)[keyof typeof HeadingLevel]
> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

/* ─── Table cell border presets ──────────────────────────────── */

/** Header cells: gold bottom, subtle white column dividers */
export const headerCellBorders: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gold },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.gold },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.headerDivider },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.headerDivider },
};

/** Body cells: light horizontal dividers, subtle column dividers */
export const cellBorders: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
};

/** Last-row body cells: no bottom border */
export const lastRowCellBorders: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  bottom: { style: BorderStyle.NONE, size: 0, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
};

/* ─── Bookmark ID management ─────────────────────────────────── */
// BookmarkStart/BookmarkEnd need a shared numeric linkId.
// We allocate incrementing IDs per export and map name→linkId.
let _bmNextId = 1;
const _bmMap = new Map<string, number>();

/** Reset bookmark counter — call at the start of each export. */
export function resetBookmarkIds(): void {
  _bmNextId = 1;
  _bmMap.clear();
}

/** Get or create a numeric linkId for a bookmark name. */
export function bmId(name: string): number {
  let id = _bmMap.get(name);
  if (id == null) {
    id = _bmNextId++;
    _bmMap.set(name, id);
  }
  return id;
}
