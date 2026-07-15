/** Shared body typography for A4 delegate booklet interior pages. */
export const BOOKLET_BODY = {
  fontSize: 12,
  lineHeight: 1.8,
} as const;

export const BOOKLET_BODY_PARAGRAPH = {
  marginBottom: 12,
  textIndent: "1.5em",
} as const;

/** Split booklet prose on blank lines into display paragraphs. */
export function splitBookletParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
