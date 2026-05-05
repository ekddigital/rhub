/**
 * QR Code Generator Utility
 * Centralized QR code generation with enhanced scannability
 */

import QRCode from "qrcode";

export interface QRCodeOptions {
  /**
   * Error correction level
   * L: ~7%, M: ~15%, Q: ~25%, H: ~30%
   */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";

  /**
   * Size of the QR code
   */
  size?: "small" | "medium" | "large" | "xlarge";

  /**
   * Margin around QR code (quiet zone)
   */
  margin?: number;

  /**
   * Colors for the QR code
   */
  colors?: {
    dark?: string;
    light?: string;
  };

  /**
   * Custom width override (pixels)
   */
  width?: number;
  /**
   * Custom scale override (controls individual marker/module size)
   * Higher scale = larger black/white squares = easier scanning from distance
   * Recommended: 24+ for certificates, 48+ for distance scanning
   */
  scale?: number;
}

/**
 * Size presets for different use cases with enhanced marker visibility
 * Scale determines the size of individual QR code markers/modules
 */
const SIZE_PRESETS = {
  small: { scale: 16, width: 200 },
  medium: { scale: 24, width: 300 },
  large: { scale: 32, width: 400 },
  xlarge: { scale: 48, width: 500 },
};

/**
 * Generate QR code as Data URL (base64)
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    errorCorrectionLevel = "M",
    size = "medium",
    margin = 4,
    colors = { dark: "#000000", light: "#FFFFFF" },
    width: customWidth,
    scale: customScale,
  } = options;

  // Get size settings
  const sizeConfig = SIZE_PRESETS[size];
  const finalScale = customScale || sizeConfig.scale;
  const finalWidth = customWidth || sizeConfig.width;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel,
      margin,
      scale: finalScale,
      width: finalWidth,
      color: colors,
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    errorCorrectionLevel = "M",
    size = "medium",
    margin = 4,
    colors = { dark: "#000000", light: "#FFFFFF" },
    width: customWidth,
    scale: customScale,
  } = options;

  const sizeConfig = SIZE_PRESETS[size];
  const finalScale = customScale || sizeConfig.scale;
  const finalWidth = customWidth || sizeConfig.width;

  try {
    const qrCodeSVG = await QRCode.toString(text, {
      type: "svg",
      errorCorrectionLevel,
      margin,
      scale: finalScale,
      width: finalWidth,
      color: colors,
    });

    return qrCodeSVG;
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw new Error("Failed to generate QR code SVG");
  }
}

/**
 * Generate QR code as PNG buffer
 */
export async function generateQRCodeBuffer(
  text: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const {
    errorCorrectionLevel = "M",
    size = "medium",
    margin = 4,
    colors = { dark: "#000000", light: "#FFFFFF" },
    width: customWidth,
    scale: customScale,
  } = options;

  const sizeConfig = SIZE_PRESETS[size];
  const finalScale = customScale || sizeConfig.scale;
  const finalWidth = customWidth || sizeConfig.width;

  try {
    const qrCodeBuffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel,
      margin,
      scale: finalScale,
      width: finalWidth,
      color: colors,
    });

    return qrCodeBuffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code buffer");
  }
}

/**
 * Generate a QR code optimized for certificates
 */
export async function generateCertificateQRCode(
  verificationUrl: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  return generateQRCode(verificationUrl, {
    errorCorrectionLevel: "H", // High error correction for certificates
    size: "large",
    margin: 6,
    colors: {
      dark: "#1a1a1a",
      light: "#ffffff",
    },
    ...options,
  });
}

/**
 * Validate if a string can be encoded as QR code
 */
export function validateQRCodeContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!content) {
    return { isValid: false, error: "Content is required" };
  }

  if (content.length > 2953) {
    return {
      isValid: false,
      error: "Content too long (max 2953 characters for QR code)",
    };
  }

  return { isValid: true };
}

/**
 * Get QR code info including estimated size and capacity
 */
export function getQRCodeInfo(content: string): {
  length: number;
  estimatedVersion: number;
  maxCapacity: number;
  canEncode: boolean;
} {
  const length = content.length;

  // Estimate QR code version based on content length (alphanumeric)
  let estimatedVersion = 1;
  let maxCapacity = 25; // Version 1 alphanumeric capacity

  const capacities = [25, 47, 77, 114, 154, 195, 224, 279, 335, 395]; // First 10 versions

  for (let i = 0; i < capacities.length; i++) {
    if (length <= capacities[i]) {
      estimatedVersion = i + 1;
      maxCapacity = capacities[i];
      break;
    }
  }

  if (length > 395) {
    estimatedVersion = 40; // Max version
    maxCapacity = 2953; // Max alphanumeric capacity for version 40
  }

  return {
    length,
    estimatedVersion,
    maxCapacity,
    canEncode: length <= maxCapacity,
  };
}
