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
  fontSize: 14.5,
  lineHeight: 1.64,
  paragraphMarginBottom: 6,
  charsPerLine: 98,
  firstPageMaxHeight: 860,
  continuationPageMaxHeight: 920,
};

const ADDRESS_PROFILE: PaginationProfile = {
  fontSize: 16,
  lineHeight: 1.62,
  paragraphMarginBottom: 6,
  charsPerLine: 92,
  firstPageMaxHeight: 620,
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

function splitParagraphToFit(
  paragraph: string,
  availableHeight: number,
  profile: PaginationProfile,
): { head: string; tail: string } | null {
  if (availableHeight <= 0) return null;
  if (estimateParagraphHeight(paragraph, profile) <= availableHeight) {
    return { head: paragraph, tail: "" };
  }

  const sentenceChunks = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentenceChunks.length > 1) {
    let head = "";
    let cursor = 0;

    while (cursor < sentenceChunks.length) {
      const next = head ? `${head} ${sentenceChunks[cursor]}` : sentenceChunks[cursor];
      if (estimateParagraphHeight(next, profile) > availableHeight) break;
      head = next;
      cursor += 1;
    }

    if (head) {
      return {
        head,
        tail: sentenceChunks.slice(cursor).join(" ").trim(),
      };
    }
  }

  const words = paragraph.split(/\s+/).filter(Boolean);
  let head = "";
  let cursor = 0;

  while (cursor < words.length) {
    const next = head ? `${head} ${words[cursor]}` : words[cursor];
    if (estimateParagraphHeight(next, profile) > availableHeight) break;
    head = next;
    cursor += 1;
  }

  if (!head) return null;
  return {
    head,
    tail: words.slice(cursor).join(" ").trim(),
  };
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

  const paragraphQueue = [...expandedParagraphs];

  while (paragraphQueue.length > 0) {
    const paragraph = paragraphQueue.shift();
    if (!paragraph) break;

    const maxHeight =
      pageIndex === 0
        ? profile.firstPageMaxHeight
        : profile.continuationPageMaxHeight;
    const paragraphHeight = estimateParagraphHeight(paragraph, profile);

    if (currentPage.length > 0 && currentHeight + paragraphHeight > maxHeight) {
      const availableHeight = maxHeight - currentHeight;
      const split = splitParagraphToFit(paragraph, availableHeight, profile);

      if (split && split.head) {
        currentPage.push(split.head);
        currentHeight += estimateParagraphHeight(split.head, profile);

        pages.push(currentPage.join("\n\n"));
        currentPage = [];
        currentHeight = 0;
        pageIndex += 1;

        if (split.tail) {
          paragraphQueue.unshift(split.tail);
        }
        continue;
      }

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
