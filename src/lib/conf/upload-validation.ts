const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;

export type DelegateDocumentKind =
  | "passport"
  | "entry-stamp"
  | "visa"
  | "booklet";

type ValidateUploadResult = {
  ok: boolean;
  error?: string;
  normalizedMime: string | null;
  supportedMimeTypes: readonly string[];
  maxSizeBytes: number;
};

export const CONFERENCE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CONFERENCE_UPLOAD_MAX_SIZE_LABEL = "5 MB";

/** Human-readable list for UI copy (matches accepted MIME / extensions). */
export const DELEGATE_IMAGE_EXTENSIONS_LABEL =
  "PNG, JPG or JPEG, WebP, and GIF";

/** Passport / stamp / visa — images or PDF. */
export const DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL =
  `${DELEGATE_IMAGE_EXTENSIONS_LABEL}, or PDF`;

export const DELEGATE_TRAVEL_UPLOAD_RULE_TEXT =
  `Passport, entry stamp, and visa: ${DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL}. Maximum ${CONFERENCE_UPLOAD_MAX_SIZE_LABEL} per file. HEIC/HEIF, BMP, TIFF, Word, and anything else must be exported first—we only accept JPEG, PNG, GIF, WebP, or PDF uploads.`;

export const DELEGATE_BOOKLET_UPLOAD_RULE_TEXT =
  `Conference booklet photo: ${DELEGATE_IMAGE_EXTENSIONS_LABEL} only (no PDF). Maximum ${CONFERENCE_UPLOAD_MAX_SIZE_LABEL}. HEIC and other formats must be saved as JPEG or PNG before uploading.`;

/** Shown under credential upload sections — actionable conversion hint. */
export const DELEGATE_UPLOAD_CONVERSION_TIP =
  "Need to convert? On iPhone (HEIC): open the photo → Share → Save as JPEG, or set Camera → Formats → Most Compatible for new photos. On any device: open in Preview or Photos and export as JPEG or PNG.";

/**
 * HTML `accept` for `<input type="file">` — filters the system picker (browser-dependent).
 * Server-side validation is still required.
 */
export function delegateDocumentAcceptAttribute(
  kind: DelegateDocumentKind,
): string {
  const img =
    ".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif";
  if (kind === "booklet") return img;
  return `${img},.pdf,application/pdf`;
}

function extensionFromName(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1] || "";
}

export function inferMimeTypeFromFile(file: File) {
  const explicitType = file.type?.toLowerCase().trim();
  if (
    explicitType &&
    explicitType !== "application/octet-stream" &&
    explicitType !== "binary/octet-stream"
  ) {
    return explicitType;
  }

  const extension = extensionFromName(file.name);
  return MIME_BY_EXTENSION[extension] || null;
}

export function validateDelegateDocumentUpload(
  file: File,
  kind: DelegateDocumentKind,
  options?: { sizeBytes?: number },
): ValidateUploadResult {
  const maxSizeBytes = CONFERENCE_UPLOAD_MAX_SIZE_BYTES;
  const normalizedMime = inferMimeTypeFromFile(file);
  const effectiveSize = options?.sizeBytes ?? file.size;
  const supportsPdf = kind !== "booklet";
  const supportedMimeTypes = supportsPdf
    ? [...IMAGE_MIME_TYPES, "application/pdf"]
    : [...IMAGE_MIME_TYPES];

  if (!normalizedMime || !supportedMimeTypes.includes(normalizedMime)) {
    const acceptedLabel =
      kind === "booklet"
        ? DELEGATE_IMAGE_EXTENSIONS_LABEL
        : DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL;
    const convertHint =
      kind === "booklet"
        ? "Export a JPEG or PNG copy (Photos / Preview → Share or Export), then upload that file."
        : "Export a JPEG, PNG, GIF, WebP, or PDF copy (Photos / Preview → Share or Export), then upload that file.";
    return {
      ok: false,
      normalizedMime,
      supportedMimeTypes,
      maxSizeBytes,
      error: `“${file.name}” is not an accepted type. Use ${acceptedLabel} only (${CONFERENCE_UPLOAD_MAX_SIZE_LABEL} max). ${convertHint}`,
    };
  }

  if (effectiveSize > maxSizeBytes) {
    return {
      ok: false,
      normalizedMime,
      supportedMimeTypes,
      maxSizeBytes,
      error: `File is too large (${CONFERENCE_UPLOAD_MAX_SIZE_LABEL} maximum). Try compressing or resizing the image, then upload again.`,
    };
  }

  return {
    ok: true,
    normalizedMime,
    supportedMimeTypes,
    maxSizeBytes,
  };
}

