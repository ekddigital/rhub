/** Structured letter body segments used for pagination + preview rendering */
export type LetterBodyBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  /** Plain `text` is used for line estimates; optional `richHtmlInner` preserves inline markup (bold, italic, …) when rendering HTML from the composer. */
  | { type: "paragraph"; text: string; richHtmlInner?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "blockquote"; text: string }
  | { type: "divider" };
