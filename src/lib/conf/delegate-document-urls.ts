export type DelegateSecureDocumentKind =
  | "passport"
  | "entry-stamp"
  | "visa"
  | "booklet";

export function buildDelegateSecureDocumentUrl(
  confId: string,
  delegateId: string,
  kind: DelegateSecureDocumentKind,
): string {
  return `/api/conf/${confId}/delegates/${delegateId}/secure-document?kind=${kind}`;
}

/** Same-origin proxy URL for browser `<img>` / download links (not direct Assets API). */
export function resolveDelegateBookletPhotoForClient(
  confId: string,
  delegateId: string,
  storedPath: string | null | undefined,
): string | null {
  if (!storedPath?.trim()) return null;
  return buildDelegateSecureDocumentUrl(confId, delegateId, "booklet");
}

export function buildPhotoSampleImageUrl(
  confId: string,
  delegateId: string,
): string {
  return `/api/conf/${confId}/photo-samples/${delegateId}/image`;
}

export function assetsBearerHeaders(): Record<string, string> {
  const secret =
    process.env.EKD_DIGITAL_ASSETS_API_SECRET?.trim() ||
    process.env.ASSETS_API_SECRET?.trim();
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}
