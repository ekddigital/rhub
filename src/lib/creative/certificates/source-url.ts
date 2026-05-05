/**
 * URL utility functions for certificate verification and other URL generation
 */

/**
 * Get the verification URL for a certificate
 * @param verificationId - The verification ID of the certificate
 * @returns The complete verification URL
 */
export function getVerificationUrl(verificationId: string): string {
  // Get the base URL from environment or fallback to localhost
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  return `${baseUrl}/verify/${verificationId}`;
}

/**
 * Get the certificate view URL for admin
 * @param certificateId - The ID of the certificate
 * @returns The complete certificate view URL
 */
export function getCertificateViewUrl(certificateId: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  return `${baseUrl}/admin/certificates/${certificateId}/view`;
}

/**
 * Get the certificate download URL
 * @param certificateId - The ID of the certificate
 * @param format - The download format (pdf, png, etc.)
 * @returns The complete download URL
 */
export function getCertificateDownloadUrl(
  certificateId: string,
  format: string = "pdf"
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  return `${baseUrl}/api/certificates/${certificateId}/download?format=${format}`;
}

/**
 * Validate if a URL is properly formatted
 * @param url - The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the base URL for the application
 * @returns The base URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}
