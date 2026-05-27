/**
 * Conference letter Word (.docx) export — editable text from draft fields + bodyRich HTML.
 */

import {
  letterDraftToDocx,
  type LetterDocxDraft,
} from "@/lib/conf/letter-draft-to-docx";

export type { LetterDocxDraft };

/**
 * Download an editable .docx built from letter draft data (not page screenshots).
 */
export async function exportLetterDraftToDocx(
  draft: LetterDocxDraft,
  filenameStem: string,
  onProgress?: (pct: number, stage: string) => void,
): Promise<void> {
  await letterDraftToDocx(draft, filenameStem, onProgress);
}
