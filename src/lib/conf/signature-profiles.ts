export const SIGNATURE_PROFILE_TITLE_PREFIX = "__SIGNATURE_PROFILE__::";

export function normalizeSignatureProfileKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, "");
}

export function buildSignatureProfileTitle(name: string): string {
  return `${SIGNATURE_PROFILE_TITLE_PREFIX}${normalizeSignatureProfileKey(name)}`;
}
