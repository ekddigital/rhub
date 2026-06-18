/** Layout helpers for delegate profile flyer SVG text (names, university). */

export const DELEGATE_FLYER_LEFT_TEXT_X = 190;
export const DELEGATE_FLYER_LEFT_TEXT_MAX_WIDTH = 418;
export const DELEGATE_FLYER_UNIVERSITY_MAX_WIDTH = 218;

const FONT_CHAR_WIDTH_RATIO = {
  script: 0.68,
  poppinsBold: 0.62,
  poppinsRegular: 0.5,
} as const;

export function splitDelegateDisplayName(fullName: string): {
  firstName: string;
  familyName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
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

export function estimateTextWidth(
  text: string,
  fontSize: number,
  charWidthRatio: number,
): number {
  return text.length * fontSize * charWidthRatio;
}

function charsPerLine(
  fontSize: number,
  maxWidth: number,
  charWidthRatio: number,
): number {
  return Math.max(4, Math.floor(maxWidth / (fontSize * charWidthRatio)));
}

export function wrapTextLinesSoft(
  input: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  if (maxCharsPerLine < 1 || maxLines < 1) return [];

  const words = input.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines: string[] = [];
  let currentLine = "";
  let nextWordIndex = 0;

  while (nextWordIndex < words.length && lines.length < maxLines) {
    const nextWord = words[nextWordIndex];
    const candidate = currentLine ? `${currentLine} ${nextWord}` : nextWord;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      nextWordIndex += 1;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
      continue;
    }

    lines.push(nextWord.slice(0, maxCharsPerLine));
    nextWordIndex += 1;
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function fitSingleLineFontSize(
  text: string,
  baseFontSize: number,
  minFontSize: number,
  maxWidth: number,
  charWidthRatio: number,
): number {
  let fontSize = baseFontSize;
  while (
    fontSize > minFontSize &&
    estimateTextWidth(text, fontSize, charWidthRatio) > maxWidth
  ) {
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
  charWidthRatio: number,
): { fontSize: number; lines: string[]; lineHeight: number } {
  for (let fontSize = baseFontSize; fontSize >= minFontSize; fontSize -= 2) {
    const maxChars = charsPerLine(fontSize, maxWidth, charWidthRatio);
    const lines = wrapTextLinesSoft(text, maxChars, maxLines);
    if (lines.length > maxLines) continue;

    const fits = lines.every(
      (line) => estimateTextWidth(line, fontSize, charWidthRatio) <= maxWidth,
    );
    if (fits) {
      return {
        fontSize,
        lines,
        lineHeight: Math.round(fontSize * 1.14),
      };
    }
  }

  const fontSize = minFontSize;
  const maxChars = charsPerLine(fontSize, maxWidth, charWidthRatio);
  const lines = wrapTextLinesSoft(text, maxChars, maxLines);
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
    FONT_CHAR_WIDTH_RATIO.script,
  );

  const familyNameLayout = fitWrappedText(
    familyName,
    55,
    30,
    DELEGATE_FLYER_LEFT_TEXT_MAX_WIDTH,
    2,
    FONT_CHAR_WIDTH_RATIO.poppinsBold,
  );

  const firstNameY = 704;
  const familyStartY =
    firstNameY + Math.round(firstNameFontSize * 0.38) + 20;
  const familyBlockHeight =
    familyNameLayout.lines.length * familyNameLayout.lineHeight;
  const confirmedDelegateBaseY = 812;
  const confirmedDelegateY =
    familyStartY +
    familyBlockHeight +
    (familyNameLayout.lines.length > 1 ? 16 : 24);
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
    FONT_CHAR_WIDTH_RATIO.poppinsRegular,
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
