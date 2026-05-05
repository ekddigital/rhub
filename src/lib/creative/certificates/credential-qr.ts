import QRCode from "qrcode";

/**
 * Generate a verification URL for a credential
 * @param credentialCode - The unique credential code
 * @returns Full verification URL
 */
export function generateVerificationURL(credentialCode: string): string {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseURL}/verify?id=${encodeURIComponent(credentialCode)}`;
}

/**
 * Generate a QR code as data URL for a credential
 * @param credentialCode - The unique credential code
 * @returns Promise resolving to QR code data URL
 */
export async function generateQRCode(credentialCode: string): Promise<string> {
  try {
    const verificationURL = generateVerificationURL(credentialCode);

    // Generate QR code with high error correction and good size
    const qrCodeDataURL = await QRCode.toDataURL(verificationURL, {
      errorCorrectionLevel: "H", // High error correction (30%)
      type: "image/png",
      width: 300, // Size in pixels (suitable for print)
      margin: 2, // Quiet zone around QR code
      color: {
        dark: "#000000", // QR code color
        light: "#FFFFFF", // Background color
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as Buffer for server-side use
 * @param credentialCode - The unique credential code
 * @returns Promise resolving to QR code buffer
 */
export async function generateQRCodeBuffer(
  credentialCode: string
): Promise<Buffer> {
  try {
    const verificationURL = generateVerificationURL(credentialCode);

    const qrCodeBuffer = await QRCode.toBuffer(verificationURL, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeBuffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code buffer");
  }
}

/**
 * Validate if a credential code format is valid
 * @param credentialCode - The credential code to validate
 * @returns boolean indicating if format is valid
 */
export function isValidCredentialCode(credentialCode: string): boolean {
  // Format: LR-XX-YYY-ZZZZ-YYYY-NNNNN
  // Example: LR-MO-UNI-0012-2025-00456
  const pattern = /^LR-[A-Z]{2}-[A-Z]{3}-\d{4}-\d{4}-\d{5}$/;
  return pattern.test(credentialCode);
}
