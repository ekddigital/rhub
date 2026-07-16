export type BookletTextVariant = "text" | "address";

type PaginationProfile = {
  fontSize: number;
  lineHeight: number;
  paragraphMarginBottom: number;
  charsPerLine: number;
  firstPageMaxHeight: number;
  continuationPageMaxHeight: number;
};

const TEXT_PROFILE: PaginationProfile = {
  fontSize: 13.5,
  lineHeight: 1.72,
  paragraphMarginBottom: 8,
  charsPerLine: 94,
  firstPageMaxHeight: 790,
  continuationPageMaxHeight: 890,
};

const ADDRESS_PROFILE: PaginationProfile = {
  fontSize: 14.5,
  lineHeight: 1.68,
  paragraphMarginBottom: 8,
  charsPerLine: 92,
  firstPageMaxHeight: 560,
  continuationPageMaxHeight: 840,
};

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function estimateParagraphHeight(
  text: string,
  profile: PaginationProfile,
): number {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return 0;
  const explicitLines = text.split("\n").filter(Boolean).length;
  const wrappedLines = Math.max(
    1,
    Math.ceil(normalized.length / profile.charsPerLine),
  );
  const lines = Math.max(explicitLines, wrappedLines);
  return (
    lines * profile.fontSize * profile.lineHeight +
    profile.paragraphMarginBottom
  );
}

function splitLongParagraph(
  paragraph: string,
  maxHeight: number,
  profile: PaginationProfile,
): string[] {
  if (estimateParagraphHeight(paragraph, profile) <= maxHeight) {
    return [paragraph];
  }

  const sentenceChunks = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentenceChunks.length <= 1) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    const pieces: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (estimateParagraphHeight(next, profile) > maxHeight && current) {
        pieces.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) pieces.push(current);
    return pieces.length > 0 ? pieces : [paragraph];
  }

  const parts: string[] = [];
  let current = "";
  for (const sentence of sentenceChunks) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (estimateParagraphHeight(next, profile) > maxHeight && current) {
      parts.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts.length > 0 ? parts : [paragraph];
}

export function paginateBookletBodyText(
  bodyText: string,
  variant: BookletTextVariant,
): string[] {
  const profile = variant === "address" ? ADDRESS_PROFILE : TEXT_PROFILE;
  const paragraphs = splitParagraphs(bodyText);
  if (paragraphs.length === 0) return [];

  const expandedParagraphs = paragraphs.flatMap((p) =>
    splitLongParagraph(p, profile.continuationPageMaxHeight, profile),
  );

  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentHeight = 0;
  let pageIndex = 0;

  for (const paragraph of expandedParagraphs) {
    const paragraphHeight = estimateParagraphHeight(paragraph, profile);
    const maxHeight =
      pageIndex === 0
        ? profile.firstPageMaxHeight
        : profile.continuationPageMaxHeight;

    if (
      currentPage.length > 0 &&
      currentHeight + paragraphHeight > maxHeight
    ) {
      pages.push(currentPage.join("\n\n"));
      currentPage = [];
      currentHeight = 0;
      pageIndex += 1;
    }

    currentPage.push(paragraph);
    currentHeight += paragraphHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage.join("\n\n"));
  }

  return pages;
}
