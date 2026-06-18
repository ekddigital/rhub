/** Layout helpers for delegate profile flyer SVG text (names, university). */

export const DELEGATE_FLYER_LEFT_TEXT_X = 190;
export const DELEGATE_FLYER_LEFT_TEXT_MAX_WIDTH = 418;
/** Clip rect starts before the accent bar; width ends at photo column edge. */
export const DELEGATE_FLYER_LEFT_TEXT_CLIP_X = 178;
export const DELEGATE_FLYER_LEFT_TEXT_CLIP_WIDTH =
  DELEGATE_FLYER_LEFT_TEXT_X +
  DELEGATE_FLYER_LEFT_TEXT_MAX_WIDTH -
  DELEGATE_FLYER_LEFT_TEXT_CLIP_X;
export const DELEGATE_FLYER_UNIVERSITY_MAX_WIDTH = 218;

/** Extra margin so estimated widths stay inside the photo-safe column. */
const FIT_WIDTH_SAFETY = 0.86;

type FontProfile = "script" | "poppinsBold" | "poppinsRegular";

/** Per-character width as a fraction of font size (em). */
function charWidthEm(char: string, profile: FontProfile): number {
  if (char === " ") {
    return profile === "script" ? 0.32 : 0.3;
  }

  if (profile === "script") {
    if ("ilI".includes(char)) return 0.28;
    if ("mwMW".includes(char)) return 0.82;
    return 0.62;
  }

  if (profile === "poppinsBold") {
    if ("WMQ".includes(char)) return 1.15;
    if ("IL|!".includes(char)) return 0.3;
    if ("J".includes(char)) return 0.44;
    if ("FRIT".includes(char)) return 0.54;
    if (char >= "A" && char <= "Z") return 0.72;
    if (char >= "a" && char <= "z") return 0.6;
    if (char >= "0" && char <= "9") return 0.58;
    return 0.66;
  }

  // poppinsRegular — uppercase labels (university) run wider than lowercase.
  if ("WMQ".includes(char)) return 0.88;
  if ("IL|!".includes(char)) return 0.28;
  if (char >= "A" && char <= "Z") return 0.62;
  if (char >= "a" && char <= "z") return 0.52;
  if (char >= "0" && char <= "9") return 0.52;
  return 0.55;
}

const FAMILY_NAME_LAYOUT = {
  baseFontSize: 55,
  minFontSize: 20,
  maxLines: 3,
} as const;

export function splitDelegateDisplayName(fullName: string): {
  firstName: string;
  familyName: string;
} {
  const normalized = fullName.trim().replace(/\s*\/\s*/g, " ");
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: "Delegate", familyName: "Delegate" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], familyName: parts[0] };
  }
  return {
    firstName: parts[0],
    familyName: parts.slice(1).join(" "),
  };
}

/** Legacy average-ratio helper — prefer estimateLineWidth for layout. */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  charWidthRatio: number,
): number {
  return text.length * fontSize * charWidthRatio;
}

export function estimateLineWidth(
  text: string,
  fontSize: number,
  profile: FontProfile,
): number {
  let em = 0;
  for (const char of text) {
    em += charWidthEm(char, profile);
  }
  return em * fontSize;
}

function effectiveMaxWidth(maxWidth: number): number {
  return maxWidth * FIT_WIDTH_SAFETY;
}

function lineFits(
  text: string,
  fontSize: number,
  maxWidth: number,
  profile: FontProfile,
): boolean {
  return (
    estimateLineWidth(text, fontSize, profile) <= effectiveMaxWidth(maxWidth)
  );
}

export function wrapTextLinesByWidth(
  input: string,
  fontSize: number,
  maxWidth: number,
  profile: FontProfile,
  maxLines: number,
): string[] | null {
  if (maxWidth < 1 || maxLines < 1) return null;

  const words = input.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (lineFits(candidate, fontSize, maxWidth, profile)) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      if (lines.length >= maxLines) return null;
      currentLine = word;
    } else {
      if (!lineFits(word, fontSize, maxWidth, profile)) return null;
      lines.push(word);
      currentLine = "";
      if (lines.length >= maxLines) return null;
    }
  }

  if (currentLine) {
    if (lines.length >= maxLines) return null;
    lines.push(currentLine);
  }

  if (!lines.every((line) => lineFits(line, fontSize, maxWidth, profile))) {
    return null;
  }

  return lines;
}

function layoutFamilyName(
  text: string,
  maxWidth: number,
  maxLines: number,
  minFontSize: number,
  maxFontSize: number,
): { fontSize: number; lines: string[]; lineHeight: number } {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    const lines = wrapTextLinesByWidth(
      text,
      fontSize,
      maxWidth,
      "poppinsBold",
      maxLines,
    );
    if (lines) {
      return {
        fontSize,
        lines,
        lineHeight: Math.round(fontSize * 1.14),
      };
    }
  }

  const fontSize = minFontSize;
  const lines =
    wrapTextLinesByWidth(text, fontSize, maxWidth, "poppinsBold", maxLines) ??
    text.trim().split(/\s+/).filter(Boolean).slice(0, maxLines);

  return {
    fontSize,
    lines,
    lineHeight: Math.round(fontSize * 1.14),
  };
}

function fitSingleLineFontSize(
  text: string,
  baseFontSize: number,
  minFontSize: number,
  maxWidth: number,
  profile: FontProfile,
): number {
  let fontSize = baseFontSize;
  while (fontSize > minFontSize && !lineFits(text, fontSize, maxWidth, profile)) {
    fontSize -= 2;
  }
  return fontSize;
}

function fitWrappedText(
  text: string,
  baseFontSize: number,
  minFontSize: number,
  maxWidth: number,
  maxLines: number,
  profile: FontProfile,
): { fontSize: number; lines: string[]; lineHeight: number } {
  for (let fontSize = baseFontSize; fontSize >= minFontSize; fontSize -= 1) {
    const lines = wrapTextLinesByWidth(
      text,
      fontSize,
      maxWidth,
      profile,
      maxLines,
    );
    if (lines) {
      return {
        fontSize,
        lines,
        lineHeight: Math.round(fontSize * 1.14),
      };
    }
  }

  const fontSize = minFontSize;
  const lines =
    wrapTextLinesByWidth(text, fontSize, maxWidth, profile, maxLines) ??
    text.trim().split(/\s+/).filter(Boolean).slice(0, maxLines);

  return {
    fontSize,
    lines,
    lineHeight: Math.round(fontSize * 1.14),
  };
}

export type DelegateFlyerIdentityLayout = {
  firstName: { text: string; fontSize: number; y: number };
  familyName: {
    lines: string[];
    fontSize: number;
    lineHeight: number;
    startY: number;
  };
  confirmedDelegateY: number;
  contentShiftY: number;
};

export function layoutDelegateFlyerIdentity(
  fullName: string,
): DelegateFlyerIdentityLayout {
  const { firstName, familyName } = splitDelegateDisplayName(fullName);

  const firstNameFontSize = fitSingleLineFontSize(
    firstName,
    74,
    46,
    DELEGATE_FLYER_LEFT_TEXT_MAX_WIDTH,
    "script",
  );

  const familyWordCount = familyName.split(/\s+/).filter(Boolean).length;
  const familyMaxFontSize =
    familyWordCount >= 4
      ? 40
      : FAMILY_NAME_LAYOUT.baseFontSize;

  const familyNameLayout = layoutFamilyName(
    familyName,
    DELEGATE_FLYER_LEFT_TEXT_MAX_WIDTH,
    FAMILY_NAME_LAYOUT.maxLines,
    FAMILY_NAME_LAYOUT.minFontSize,
    familyMaxFontSize,
  );

  const firstNameY = 704;
  const familyStartY =
    firstNameY + Math.round(firstNameFontSize * 0.38) + 20;
  const familyBlockHeight =
    familyNameLayout.lines.length * familyNameLayout.lineHeight;
  const confirmedDelegateBaseY = 812;
  const familyLineGap =
    familyNameLayout.lines.length === 1
      ? 24
      : familyNameLayout.lines.length === 2
        ? 16
        : 12;
  const confirmedDelegateY =
    familyStartY + familyBlockHeight + familyLineGap;
  const contentShiftY = Math.max(0, confirmedDelegateY - confirmedDelegateBaseY);

  return {
    firstName: {
      text: firstName,
      fontSize: firstNameFontSize,
      y: firstNameY,
    },
    familyName: {
      lines: familyNameLayout.lines,
      fontSize: familyNameLayout.fontSize,
      lineHeight: familyNameLayout.lineHeight,
      startY: familyStartY,
    },
    confirmedDelegateY,
    contentShiftY,
  };
}

export type DelegateFlyerUniversityLayout = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
};

export function layoutDelegateFlyerUniversity(
  university: string | null | undefined,
): DelegateFlyerUniversityLayout {
  const text = (university || "Liberian Student Union in China").toUpperCase();
  const layout = fitWrappedText(
    text,
    16,
    11,
    DELEGATE_FLYER_UNIVERSITY_MAX_WIDTH,
    3,
    "poppinsRegular",
  );

  return {
    lines: layout.lines,
    fontSize: layout.fontSize,
    lineHeight: Math.max(20, layout.lineHeight),
  };
}

export function buildSvgTextLines(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  attrs: string,
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${startY + index * lineHeight}" ${attrs}>${line}</text>`,
    )
    .join("");
}
