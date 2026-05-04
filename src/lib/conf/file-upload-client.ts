import type { DelegateDocumentKind } from "@/lib/conf/upload-validation";
import {
  validateDelegateDocumentUpload,
  delegateDocumentAcceptAttribute,
  CONFERENCE_UPLOAD_MAX_SIZE_LABEL,
  DELEGATE_IMAGE_EXTENSIONS_LABEL,
  DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL,
  DELEGATE_TRAVEL_UPLOAD_RULE_TEXT,
  DELEGATE_BOOKLET_UPLOAD_RULE_TEXT,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/upload-validation";

export type { DelegateDocumentKind };

export {
  delegateDocumentAcceptAttribute,
  CONFERENCE_UPLOAD_MAX_SIZE_LABEL,
  DELEGATE_IMAGE_EXTENSIONS_LABEL,
  DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL,
  DELEGATE_TRAVEL_UPLOAD_RULE_TEXT,
  DELEGATE_BOOKLET_UPLOAD_RULE_TEXT,
  DELEGATE_UPLOAD_CONVERSION_TIP,
};

export function validateDelegateUploadFile(
  file: File,
  kind: DelegateDocumentKind,
): { ok: true; inferredMime: string | null } | { ok: false; error: string } {
  const r = validateDelegateDocumentUpload(file, kind);
  if (!r.ok) {
    return { ok: false, error: r.error ?? "Invalid file." };
  }
  return { ok: true, inferredMime: r.normalizedMime };
}

export function validatePaymentProofFile(file: File) {
  return validateDelegateUploadFile(file, "passport");
}

export function validateProfilePhotoFile(file: File) {
  return validateDelegateUploadFile(file, "booklet");
}
