/**
 * URL utilities for handling environment-specific URLs
 */

/**
 * Get the base URL for the application
 * Works in both client and server components
 */
export function getBaseUrl(): string {
  // Server-side: use environment variables
  if (typeof window === "undefined") {
    // In production, use the production URL
    if (process.env.NODE_ENV === "production") {
      return (
        process.env.PRODUCTION_URL ||
        process.env.PUBLIC_URL ||
        "https://www.fomjesus.org"
      );
    }
    // In development, use the development URL
    return (
      process.env.PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"
    );
  }

  // Client-side: use window.location
  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * Get the verification URL for certificates
 */
export function getVerificationUrl(certificateId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/community/verify-certificate?id=${certificateId}`;
}

/**
 * Get the QR code base URL from environment
 */
export function getQrCodeBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.QR_CODE_BASE_URL || getBaseUrl() + "/verify";
  }
  return getBaseUrl() + "/community/verify-certificate";
}
