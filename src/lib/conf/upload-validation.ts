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

type UploadKind = "passport" | "entry-stamp" | "visa" | "booklet";

type ValidateUploadResult = {
  ok: boolean;
  error?: string;
  normalizedMime: string | null;
  supportedMimeTypes: readonly string[];
  maxSizeBytes: number;
};

export const CONFERENCE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CONFERENCE_UPLOAD_MAX_SIZE_LABEL = "5 MB";

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
  kind: UploadKind,
): ValidateUploadResult {
  const maxSizeBytes = CONFERENCE_UPLOAD_MAX_SIZE_BYTES;
  const normalizedMime = inferMimeTypeFromFile(file);
  const supportsPdf = kind !== "booklet";
  const supportedMimeTypes = supportsPdf
    ? [...IMAGE_MIME_TYPES, "application/pdf"]
    : [...IMAGE_MIME_TYPES];

  if (!normalizedMime || !supportedMimeTypes.includes(normalizedMime)) {
    const fileTypeHint = kind === "booklet" ? "Booklet photo" : "Document";
    return {
      ok: false,
      normalizedMime,
      supportedMimeTypes,
      maxSizeBytes,
      error: `${fileTypeHint} must be one of: ${supportedMimeTypes.join(", ")}`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      ok: false,
      normalizedMime,
      supportedMimeTypes,
      maxSizeBytes,
      error: `File size must be ${CONFERENCE_UPLOAD_MAX_SIZE_LABEL} or less.`,
    };
  }

  return {
    ok: true,
    normalizedMime,
    supportedMimeTypes,
    maxSizeBytes,
  };
}

