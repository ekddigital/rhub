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

/** True when a delegate document column has a non-empty stored path. */
export function hasStoredDelegateDocumentPath(
  path: string | null | undefined,
): boolean {
  return typeof path === "string" && path.trim().length > 0;
}

function stripUrlHashQuery(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

/** Detect PDF uploads by filename extension on stored paths or proxy URLs. */
export function isStoredDelegateDocumentPdf(
  path: string | null | undefined,
): boolean {
  if (!hasStoredDelegateDocumentPath(path)) return false;
  const normalized = stripUrlHashQuery(path!.trim()).toLowerCase();
  return normalized.endsWith(".pdf");
}

export function resolveDelegateDocumentForClient(
  confId: string,
  delegateId: string,
  kind: DelegateSecureDocumentKind,
  storedPath: string | null | undefined,
): string | null {
  if (!storedPath?.trim()) return null;
  return buildDelegateSecureDocumentUrl(confId, delegateId, kind);
}

/** Same-origin proxy URL for browser `<img>` / download links (not direct Assets API). */
export function resolveDelegateBookletPhotoForClient(
  confId: string,
  delegateId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveDelegateDocumentForClient(
    confId,
    delegateId,
    "booklet",
    storedPath,
  );
}

export function resolveDelegatePassportPhotoForClient(
  confId: string,
  delegateId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveDelegateDocumentForClient(
    confId,
    delegateId,
    "passport",
    storedPath,
  );
}

export function resolveDelegateEntryStampForClient(
  confId: string,
  delegateId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveDelegateDocumentForClient(
    confId,
    delegateId,
    "entry-stamp",
    storedPath,
  );
}

export function resolveDelegateVisaForClient(
  confId: string,
  delegateId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveDelegateDocumentForClient(
    confId,
    delegateId,
    "visa",
    storedPath,
  );
}

export function resolveMemberPhotoForClient(
  confId: string,
  memberId: string,
  storedPath: string | null | undefined,
): string | null {
  if (!storedPath?.trim()) return null;
  return `/api/conf/${confId}/members/${memberId}/photo`;
}

export type DelegateDocumentClientFields = {
  passportPhotoPath: string | null;
  passportPhotoIsPdf: boolean;
  lastEntryStampPath: string | null;
  lastEntryStampIsPdf: boolean;
  currentVisaPath: string | null;
  currentVisaIsPdf: boolean;
  bookletPhotoPath: string | null;
};

export function mapDelegateDocumentsForClient(
  confId: string,
  delegateId: string,
  stored: {
    passportPhotoPath?: string | null;
    lastEntryStampPath?: string | null;
    currentVisaPath?: string | null;
    bookletPhotoPath?: string | null;
  },
  options?: {
    includePassport?: boolean;
    includeEntryStamp?: boolean;
    includeVisa?: boolean;
    includeBooklet?: boolean;
  },
): Partial<DelegateDocumentClientFields> {
  const includePassport = options?.includePassport ?? true;
  const includeEntryStamp = options?.includeEntryStamp ?? true;
  const includeVisa = options?.includeVisa ?? true;
  const includeBooklet = options?.includeBooklet ?? true;
  const result: Partial<DelegateDocumentClientFields> = {};

  if (includePassport) {
    const path = stored.passportPhotoPath;
    result.passportPhotoPath = resolveDelegatePassportPhotoForClient(
      confId,
      delegateId,
      path,
    );
    result.passportPhotoIsPdf = isStoredDelegateDocumentPdf(path);
  }

  if (includeEntryStamp) {
    const path = stored.lastEntryStampPath;
    result.lastEntryStampPath = resolveDelegateEntryStampForClient(
      confId,
      delegateId,
      path,
    );
    result.lastEntryStampIsPdf = isStoredDelegateDocumentPdf(path);
  }

  if (includeVisa) {
    const path = stored.currentVisaPath;
    result.currentVisaPath = resolveDelegateVisaForClient(
      confId,
      delegateId,
      path,
    );
    result.currentVisaIsPdf = isStoredDelegateDocumentPdf(path);
  }

  if (includeBooklet) {
    const path = stored.bookletPhotoPath;
    result.bookletPhotoPath = resolveDelegateBookletPhotoForClient(
      confId,
      delegateId,
      path,
    );
  }

  return result;
}

export function assetsBearerHeaders(): Record<string, string> {
  const secret =
    process.env.EKD_DIGITAL_ASSETS_API_SECRET?.trim() ||
    process.env.ASSETS_API_SECRET?.trim();
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

export function buildPhotoSampleImageUrl(
  confId: string,
  delegateId: string,
): string {
  return `/api/conf/${confId}/photo-samples/${delegateId}/image`;
}
