export type DelegateUploadKind =
  | "passport"
  | "entry-stamp"
  | "visa"
  | "booklet";

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

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function extensionFromName(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1] || "";
}

export function inferMimeTypeFromClientFile(file: File): string | null {
  const explicitType = file.type?.toLowerCase().trim();
  if (
    explicitType &&
    explicitType !== "application/octet-stream" &&
    explicitType !== "binary/octet-stream"
  ) {
    return explicitType;
  }

  const ext = extensionFromName(file.name);
  return MIME_BY_EXTENSION[ext] || null;
}

export function getSupportedMimeTypesForKind(kind: DelegateUploadKind) {
  if (kind === "booklet") return [...IMAGE_MIME_TYPES];
  return [...IMAGE_MIME_TYPES, "application/pdf"];
}

export function validateDelegateUploadFile(
  file: File,
  kind: DelegateUploadKind,
): { ok: true; inferredMime: string | null } | { ok: false; error: string } {
  const inferredMime = inferMimeTypeFromClientFile(file);
  const supported = getSupportedMimeTypesForKind(kind);

  if (!inferredMime || !supported.includes(inferredMime)) {
    return {
      ok: false,
      error: `Unsupported file format. Accepted: ${supported.join(", ")}`,
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: "File is too large. Maximum size is 10MB.",
    };
  }

  return { ok: true, inferredMime };
}

export function validatePaymentProofFile(file: File) {
  return validateDelegateUploadFile(file, "passport");
}

export function validateProfilePhotoFile(file: File) {
  return validateDelegateUploadFile(file, "booklet");
}

