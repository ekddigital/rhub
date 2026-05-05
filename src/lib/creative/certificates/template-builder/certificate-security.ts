/**
 * Certificate Security Utilities
 * Implements various security measures to prevent certificate forgery
 */

import crypto from "crypto";

// Security configuration
export const SECURITY_CONFIG = {
  // Secret key for digital signatures (should be in environment variables)
  SECRET_KEY:
    process.env.CERTIFICATE_SECRET_KEY || "fallback-key-change-in-production",

  // Hash algorithm for signatures
  HASH_ALGORITHM: "sha256",

  // Encryption for sensitive data
  ENCRYPTION_ALGORITHM: "aes-256-gcm",
};

/**
 * Generate a digital signature for certificate data
 * This creates a hash that can be verified later
 */
export function generateCertificateSignature(certificateData: {
  certificateId: string;
  recipientName: string;
  templateName: string;
  issueDate: string;
  issuerName: string;
}): string {
  const dataString = `${certificateData.certificateId}|${certificateData.recipientName}|${certificateData.templateName}|${certificateData.issueDate}|${certificateData.issuerName}`;

  return crypto
    .createHmac(SECURITY_CONFIG.HASH_ALGORITHM, SECURITY_CONFIG.SECRET_KEY)
    .update(dataString)
    .digest("hex");
}

/**
 * Verify a certificate signature
 */
export function verifyCertificateSignature(
  certificateData: {
    certificateId: string;
    recipientName: string;
    templateName: string;
    issueDate: string;
    issuerName: string;
  },
  signature: string
): boolean {
  const expectedSignature = generateCertificateSignature(certificateData);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}

/**
 * Generate a secure verification URL with tamper-proof parameters
 */
export function generateSecureVerificationUrl(
  certificateId: string,
  signature: string,
  baseUrl: string = process.env.NEXTAUTH_URL || "http://localhost:3000"
): string {
  const params = new URLSearchParams({
    id: certificateId,
    sig: signature,
    t: Date.now().toString(), // Timestamp for tracking
  });

  return `${baseUrl}/verify-certificate?${params.toString()}`;
}

/**
 * Create watermark data for embedding in certificates
 */
export function generateWatermarkData(certificateId: string): {
  text: string;
  hash: string;
  position: { x: number; y: number; rotation: number };
} {
  const hash = crypto
    .createHash("md5")
    .update(certificateId + SECURITY_CONFIG.SECRET_KEY)
    .digest("hex")
    .substring(0, 8);

  return {
    text: `FOM-${hash.toUpperCase()}`,
    hash,
    position: {
      x: Math.random() * 200 + 300, // Random position to prevent pattern recognition
      y: Math.random() * 100 + 250,
      rotation: Math.random() * 30 - 15, // Random rotation between -15 and 15 degrees
    },
  };
}

/**
 * Generate a blockchain-like verification hash
 * This creates a hash that includes the previous certificate's hash for chain verification
 */
export function generateBlockchainHash(
  certificateData: {
    certificateId: string;
    recipientName: string;
    templateName: string;
    issueDate: string;
  },
  previousHash: string = "0"
): string {
  const dataString = `${previousHash}|${certificateData.certificateId}|${certificateData.recipientName}|${certificateData.templateName}|${certificateData.issueDate}`;

  return crypto.createHash("sha256").update(dataString).digest("hex");
}

/**
 * Security levels for different certificate types
 */
export const SECURITY_LEVELS = {
  BASIC: {
    includeQR: true,
    includeSignature: false,
    includeWatermark: false,
    includeTimestamp: true,
    includeBlockchainHash: false,
    requireDoubleVerification: false,
  },
  STANDARD: {
    includeQR: true,
    includeSignature: true,
    includeWatermark: true,
    includeTimestamp: true,
    includeBlockchainHash: false,
    requireDoubleVerification: false,
  },
  HIGH: {
    includeQR: true,
    includeSignature: true,
    includeWatermark: true,
    includeTimestamp: true,
    includeBlockchainHash: true,
    requireDoubleVerification: true,
  },
} as const;

type SecurityLevel = keyof typeof SECURITY_LEVELS;

interface CertificateSecurity {
  level: SecurityLevel;
  timestamp: string;
  signature?: string;
  watermark?: {
    text: string;
    hash: string;
    position: { x: number; y: number; rotation: number };
  };
  blockchainHash?: string;
  verificationUrl?: string;
}

/**
 * Get recommended security level for certificate type
 */
export function getSecurityLevel(templateName: string): SecurityLevel {
  // High security for official certificates
  if (
    templateName.includes("Pastor") ||
    templateName.includes("Leadership") ||
    templateName.includes("Baptism")
  ) {
    return "HIGH";
  }

  // Standard security for achievement certificates
  if (
    templateName.includes("Excellence") ||
    templateName.includes("Achievement") ||
    templateName.includes("Mission")
  ) {
    return "STANDARD";
  }

  // Basic security for appreciation certificates
  return "BASIC";
}

/**
 * Generate comprehensive security package for a certificate
 */
export function generateCertificateSecurity(certificateData: {
  certificateId: string;
  recipientName: string;
  templateName: string;
  issueDate: string;
  issuerName: string;
  previousHash?: string;
}): CertificateSecurity {
  const securityLevel = getSecurityLevel(certificateData.templateName);
  const config = SECURITY_LEVELS[securityLevel];

  const security: CertificateSecurity = {
    level: securityLevel,
    timestamp: new Date().toISOString(),
  };

  if (config.includeSignature) {
    security.signature = generateCertificateSignature(certificateData);
  }

  if (config.includeWatermark) {
    security.watermark = generateWatermarkData(certificateData.certificateId);
  }

  if (config.includeBlockchainHash) {
    security.blockchainHash = generateBlockchainHash(
      certificateData,
      certificateData.previousHash
    );
  }

  if (config.includeQR) {
    const verificationUrl = generateSecureVerificationUrl(
      certificateData.certificateId,
      security.signature || "no-sig"
    );
    security.verificationUrl = verificationUrl;
  }

  return security;
}
