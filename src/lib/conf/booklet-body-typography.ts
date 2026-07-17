/** Shared body typography for A4 delegate booklet interior pages. */
export const BOOKLET_BODY = {
  fontSize: 14.5,
  lineHeight: 1.64,
} as const;

export const BOOKLET_BODY_PARAGRAPH = {
  marginBottom: 6,
  textIndent: 0,
  textAlign: "justify" as const,
} as const;

/** Glossary / abbreviation rows — no prose indent. */
export const BOOKLET_GLOSSARY_ROW = {
  marginBottom: 8,
  textIndent: 0,
  paddingLeft: 0,
} as const;

/** Split booklet prose on blank lines into display paragraphs. */
export function splitBookletParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Split glossary bodies on single newlines (one abbreviation per line). */
export function splitBookletGlossaryLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
