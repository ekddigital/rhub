import { extractAssetId, resolveStoredAssetUrl } from "@/lib/conf/assets";

export type DelegateSecureDocumentKind =
  | "passport"
  | "entry-stamp"
  | "visa"
  | "booklet";

export type GuestSecureDocumentKind = "passport" | "entry-stamp" | "visa";

export function buildDelegateSecureDocumentUrl(
  confId: string,
  delegateId: string,
  kind: DelegateSecureDocumentKind,
): string {
  return `/api/conf/${confId}/delegates/${delegateId}/secure-document?kind=${kind}`;
}

export function buildGuestSecureDocumentUrl(
  confId: string,
  delegateId: string,
  guestId: string,
  kind: GuestSecureDocumentKind,
): string {
  return `/api/conf/${confId}/delegates/${delegateId}/guests/${guestId}/secure-document?kind=${kind}`;
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

const assetPdfFlagCache = new Map<string, boolean>();

/** Probe assets API content-type when stored paths lack a `.pdf` suffix (e.g. `/download` URLs). */
export async function probeStoredDelegateDocumentIsPdf(
  path: string | null | undefined,
  origin: string,
): Promise<boolean> {
  if (!hasStoredDelegateDocumentPath(path)) return false;
  if (isStoredDelegateDocumentPdf(path)) return true;

  const trimmed = path!.trim();
  const assetId = extractAssetId(trimmed);
  if (assetId && assetPdfFlagCache.has(assetId)) {
    return assetPdfFlagCache.get(assetId)!;
  }

  const assetUrl = resolveStoredAssetUrl(trimmed, origin);
  const previewUrl = assetUrl.includes("?")
    ? `${assetUrl}&preview=true`
    : `${assetUrl}?preview=true`;

  try {
    const res = await fetch(previewUrl, {
      method: "HEAD",
      headers: { ...assetsBearerHeaders(), Accept: "*/*" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const isPdf = (res.headers.get("content-type") ?? "")
      .toLowerCase()
      .includes("pdf");
    if (assetId) assetPdfFlagCache.set(assetId, isPdf);
    return isPdf;
  } catch {
    return false;
  }
}

export async function probeManyStoredDelegateDocumentsIsPdf(
  paths: (string | null | undefined)[],
  origin: string,
): Promise<Map<string, boolean>> {
  const unique = [
    ...new Set(paths.filter(hasStoredDelegateDocumentPath) as string[]),
  ];
  const pdfByPath = new Map<string, boolean>();
  await Promise.all(
    unique.map(async (path) => {
      pdfByPath.set(
        path.trim(),
        await probeStoredDelegateDocumentIsPdf(path, origin),
      );
    }),
  );
  return pdfByPath;
}

function resolveStoredDelegateDocumentIsPdf(
  path: string | null | undefined,
  pdfByPath: Map<string, boolean>,
): boolean {
  if (!hasStoredDelegateDocumentPath(path)) return false;
  const cached = pdfByPath.get(path!.trim());
  if (cached !== undefined) return cached;
  return isStoredDelegateDocumentPdf(path);
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

/** Same-origin proxy for external roster / CDN images (LSUIC CSV leader_photo_url). */
export function resolveExternalBookletPhotoForClient(
  photoPath: string | null | undefined,
): string | null {
  const trimmed = photoPath?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/public/")) {
    return `/${trimmed.slice("/public/".length)}`;
  }
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `/api/assets/proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
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
    pdfByPath?: Map<string, boolean>;
  },
): Partial<DelegateDocumentClientFields> {
  const includePassport = options?.includePassport ?? true;
  const includeEntryStamp = options?.includeEntryStamp ?? true;
  const includeVisa = options?.includeVisa ?? true;
  const includeBooklet = options?.includeBooklet ?? true;
  const pdfByPath = options?.pdfByPath ?? new Map<string, boolean>();
  const result: Partial<DelegateDocumentClientFields> = {};

  if (includePassport) {
    const path = stored.passportPhotoPath;
    result.passportPhotoPath = resolveDelegatePassportPhotoForClient(
      confId,
      delegateId,
      path,
    );
    result.passportPhotoIsPdf = resolveStoredDelegateDocumentIsPdf(
      path,
      pdfByPath,
    );
  }

  if (includeEntryStamp) {
    const path = stored.lastEntryStampPath;
    result.lastEntryStampPath = resolveDelegateEntryStampForClient(
      confId,
      delegateId,
      path,
    );
    result.lastEntryStampIsPdf = resolveStoredDelegateDocumentIsPdf(
      path,
      pdfByPath,
    );
  }

  if (includeVisa) {
    const path = stored.currentVisaPath;
    result.currentVisaPath = resolveDelegateVisaForClient(
      confId,
      delegateId,
      path,
    );
    result.currentVisaIsPdf = resolveStoredDelegateDocumentIsPdf(
      path,
      pdfByPath,
    );
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

export async function mapDelegateDocumentsForClientAsync(
  confId: string,
  delegateId: string,
  stored: {
    passportPhotoPath?: string | null;
    lastEntryStampPath?: string | null;
    currentVisaPath?: string | null;
    bookletPhotoPath?: string | null;
  },
  origin: string,
  options?: {
    includePassport?: boolean;
    includeEntryStamp?: boolean;
    includeVisa?: boolean;
    includeBooklet?: boolean;
  },
): Promise<Partial<DelegateDocumentClientFields>> {
  const includePassport = options?.includePassport ?? true;
  const includeEntryStamp = options?.includeEntryStamp ?? true;
  const includeVisa = options?.includeVisa ?? true;
  const includeBooklet = options?.includeBooklet ?? true;

  const pathsToProbe = [
    includePassport ? stored.passportPhotoPath : null,
    includeEntryStamp ? stored.lastEntryStampPath : null,
    includeVisa ? stored.currentVisaPath : null,
  ];
  const pdfByPath = await probeManyStoredDelegateDocumentsIsPdf(
    pathsToProbe,
    origin,
  );

  const result: Partial<DelegateDocumentClientFields> = {};

  if (includePassport) {
    const path = stored.passportPhotoPath;
    result.passportPhotoPath = resolveDelegatePassportPhotoForClient(
      confId,
      delegateId,
      path,
    );
    result.passportPhotoIsPdf = resolveStoredDelegateDocumentIsPdf(
      path,
      pdfByPath,
    );
  }

  if (includeEntryStamp) {
    const path = stored.lastEntryStampPath;
    result.lastEntryStampPath = resolveDelegateEntryStampForClient(
      confId,
      delegateId,
      path,
    );
    result.lastEntryStampIsPdf = resolveStoredDelegateDocumentIsPdf(
      path,
      pdfByPath,
    );
  }

  if (includeVisa) {
    const path = stored.currentVisaPath;
    result.currentVisaPath = resolveDelegateVisaForClient(
      confId,
      delegateId,
      path,
    );
    result.currentVisaIsPdf = resolveStoredDelegateDocumentIsPdf(
      path,
      pdfByPath,
    );
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

export function resolveGuestDocumentForClient(
  confId: string,
  delegateId: string,
  guestId: string,
  kind: GuestSecureDocumentKind,
  storedPath: string | null | undefined,
): string | null {
  if (!storedPath?.trim()) return null;
  return buildGuestSecureDocumentUrl(confId, delegateId, guestId, kind);
}

export function resolveGuestPassportPhotoForClient(
  confId: string,
  delegateId: string,
  guestId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveGuestDocumentForClient(
    confId,
    delegateId,
    guestId,
    "passport",
    storedPath,
  );
}

export function resolveGuestEntryStampForClient(
  confId: string,
  delegateId: string,
  guestId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveGuestDocumentForClient(
    confId,
    delegateId,
    guestId,
    "entry-stamp",
    storedPath,
  );
}

export function resolveGuestVisaForClient(
  confId: string,
  delegateId: string,
  guestId: string,
  storedPath: string | null | undefined,
): string | null {
  return resolveGuestDocumentForClient(
    confId,
    delegateId,
    guestId,
    "visa",
    storedPath,
  );
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
