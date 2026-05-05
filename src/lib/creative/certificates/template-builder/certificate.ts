/**
 * Certificate utility functions for generating verification IDs,
 * creating PDF certificates, and managing certificate lifecycle
 */

import { customAlphabet } from "nanoid";
import {
  generateCertificateSecurity,
  generateSecureVerificationUrl,
} from "./certificate-security";

// Generate a unique verification ID for certificates
export async function generateVerificationId(): Promise<string> {
  // Use a custom alphabet without ambiguous characters (0, O, 1, l, I)
  const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

  // Generate ID with pattern: XXX-XXXX (3 chars, dash, 4 chars)
  const part1 = nanoid(3);
  const part2 = nanoid(4);

  return `${part1}-${part2}`;
}

// Generate a comprehensive certificate ID with year, type, and unique number
export function generateCertificateId(
  templateName: string,
  sequenceNumber?: number,
): string {
  const currentYear = new Date().getFullYear();

  // Determine organization prefix based on template name
  const getOrgPrefix = (name: string): string => {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes("JULS")) return "JULS";
    if (nameUpper.includes("JICF") || nameUpper.includes("SERVICE"))
      return "JICF";
    return "FOM";
  };

  // Generate certificate type code based on template name
  const getTypeCode = (name: string): string => {
    const nameUpper = name.toUpperCase();

    if (nameUpper.includes("EASTER")) return "EAS";
    if (nameUpper.includes("APPRECIATION")) return "APP";
    if (nameUpper.includes("EXCELLENCE")) return "EXC";
    if (nameUpper.includes("OUTSTANDING")) return "OUT";
    if (nameUpper.includes("CONTRIBUTION")) return "CON";
    if (nameUpper.includes("LEADERSHIP")) return "LED";
    if (nameUpper.includes("SERVICE") || nameUpper.includes("FAITHFUL"))
      return "SRV";
    if (nameUpper.includes("VOLUNTEER")) return "VOL";
    if (nameUpper.includes("MISSION")) return "MSN";
    if (nameUpper.includes("BAPTISM")) return "BAP";
    if (nameUpper.includes("YOUTH")) return "YTH";
    if (nameUpper.includes("EXECUTIVE") || nameUpper.includes("DIRECTOR"))
      return "EXD";
    if (nameUpper.includes("CHAIRPERSON")) return "CHR";
    if (nameUpper.includes("COMPLETION")) return "CMP";
    if (nameUpper.includes("RECOGNITION")) return "REC";

    // Default: use first 3 letters of the template name
    return name
      .replace(/[^A-Z]/g, "")
      .substring(0, 3)
      .padEnd(3, "X");
  };

  const orgPrefix = getOrgPrefix(templateName);
  const typeCode = getTypeCode(templateName);

  // Generate sequence number (if not provided, use timestamp-based)
  const sequence = sequenceNumber || Math.floor(Date.now() % 10000);
  const sequenceStr = sequence.toString().padStart(4, "0");

  // Generate random suffix for uniqueness
  const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 2);
  const suffix = nanoid();

  // Format: ORG-YYYY-TYPE-NNNN-XX
  // Example: FOM-2025-APP-0001-K7 or JULS-2025-APP-0001-K7
  return `${orgPrefix}-${currentYear}-${typeCode}-${sequenceStr}-${suffix}`;
}

// Generate a QR code verification URL
export function generateVerificationUrl(certificateId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "https://fomjesus.org";
  return `${baseUrl}/verify-certificate?id=${certificateId}`;
}

// Certificate status types
export type CertificateStatus = "active" | "revoked" | "expired";

// Certificate data interface
export interface CertificateData {
  recipientName: string;
  templateName: string;
  issueDate: Date;
  expiryDate?: Date;
  customFields?: Record<string, unknown>;
}

// Template data interface for certificate design
export interface TemplateData {
  name?: string;
  description?: string;
  elements: TemplateElement[];
  pageSettings: PageSettings;
  fonts: FontSettings[];
}

export interface TemplateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr";
  content: string;
  /** Optional group tag. Elements with group "signature" can be hidden for manual signing. */
  group?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    // Text specific
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string; // e.g., 'bold', 'normal', '600'
    fontStyle?: "italic" | "normal"; // Added fontStyle
    textAlign?: "left" | "center" | "right";
    letterSpacing?: string; // Added letterSpacing (e.g., '1px', '0.1em')
    lineHeight?: string; // Added lineHeight (e.g., '1.5', '150%')

    // General
    color?: string; // For text color, shape fill/border color
    backgroundColor?: string; // For shape background or text background
    rotation?: number;
    opacity?: number; // Changed from string to number (0 to 1)

    // Shape specific (can also apply to images if framed)
    borderWidth?: string; // e.g., '1px', '2pt'
    borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none"; // Added borderStyle
    borderColor?: string; // Added borderColor explicitly
    borderRadius?: string; // e.g., '5px', '50%'

    // Image specific (can also apply to text if needed, e.g. for transform)
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"; // For images
  };
  // Temporary property used during resize operations
  _initialResize?: {
    x: number;
    y: number;
    width: number;
    height: number;
    corner: string;
  };
}

export interface PageSettings {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  background?: {
    color?: string;
    image?: string;
  };
}

export interface FontSettings {
  family: string;
  variants: string[];
  url?: string;
}

// Validate certificate data
export function validateCertificateData(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.recipientFirstName || typeof data.recipientFirstName !== "string") {
    errors.push("Recipient first name is required");
  }

  if (!data.recipientLastName || typeof data.recipientLastName !== "string") {
    errors.push("Recipient last name is required");
  }

  if (!data.recipientEmail || typeof data.recipientEmail !== "string") {
    errors.push("Recipient email is required");
  }

  if (
    data.recipientEmail &&
    typeof data.recipientEmail === "string" &&
    !isValidEmail(data.recipientEmail)
  ) {
    errors.push("Invalid email format");
  }

  if (!data.templateId || typeof data.templateId !== "string") {
    errors.push("Template ID is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if certificate is expired
export function isCertificateExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false;
  return new Date() > expiryDate;
}

// Generate QR code data for certificate verification
export function generateQRCodeData(
  verificationId: string,
  baseUrl: string,
): string {
  return `${baseUrl}/community/verify-certificate?id=${verificationId}`;
}

// Generate enhanced QR code data with user information for development
export function generateEnhancedQRCodeData(
  certificateData: {
    certificateId: string;
    recipientName: string;
    recipientEmail: string;
    templateName: string;
    issueDate: string;
    issuerName: string;
    organizationName?: string;
  },
  baseUrl: string,
): string {
  // Check if running on localhost or local network
  const isLocalhost =
    baseUrl.includes("localhost") ||
    baseUrl.includes("127.0.0.1") ||
    baseUrl.includes("192.168.") ||
    baseUrl.includes("10.0.") ||
    baseUrl.includes("172.16.") ||
    baseUrl.includes("172.17.") ||
    baseUrl.includes("172.18.") ||
    baseUrl.includes("172.19.") ||
    baseUrl.includes("172.20.") ||
    baseUrl.includes("172.21.") ||
    baseUrl.includes("172.22.") ||
    baseUrl.includes("172.23.") ||
    baseUrl.includes("172.24.") ||
    baseUrl.includes("172.25.") ||
    baseUrl.includes("172.26.") ||
    baseUrl.includes("172.27.") ||
    baseUrl.includes("172.28.") ||
    baseUrl.includes("172.29.") ||
    baseUrl.includes("172.30.") ||
    baseUrl.includes("172.31.") ||
    baseUrl.includes(":3000") || // Development port
    baseUrl.includes(":3001") || // Alternative dev port
    baseUrl.includes(":8000") || // Alternative dev port
    baseUrl.includes(":8080"); // Alternative dev port

  console.log("🐛 Enhanced QR Code Generation Debug:");
  console.log("Base URL:", baseUrl);
  console.log("Is Localhost detected?", isLocalhost);
  console.log("Certificate ID:", certificateData.certificateId);

  if (isLocalhost) {
    // Check if this is Certificate of Service template
    const isCertificateOfService = certificateData.templateName
      .toLowerCase()
      .includes("service");

    if (isCertificateOfService) {
      // For localhost Certificate of Service: use simplified JSON with only requested fields
      const qrData = {
        certificateId: certificateData.certificateId,
        recipientName: certificateData.recipientName,
        issueDate: certificateData.issueDate,
        pastorName: certificateData.issuerName, // Pastor name is the issuer
      };

      console.log(
        "📱 Localhost QR Data (Certificate of Service - simplified):",
        {
          originalLength: JSON.stringify({
            type: "CERTIFICATE_INFO",
            certificateId: certificateData.certificateId,
            recipientName: certificateData.recipientName,
            recipientEmail: certificateData.recipientEmail,
            templateName: certificateData.templateName,
            issueDate: certificateData.issueDate,
            issuerName: certificateData.issuerName,
            organizationName: certificateData.organizationName || "FOM",
            verificationUrl: `${baseUrl}/community/verify-certificate?id=${certificateData.certificateId}`,
            generatedAt: new Date().toISOString(),
            environment: "development",
          }).length,
          simplifiedLength: JSON.stringify(qrData).length,
          reduction:
            "Certificate of Service - simplified to only include certificate ID, recipient name, date, and pastor name",
        },
      );

      // Return simplified JSON string for localhost Certificate of Service
      return JSON.stringify(qrData);
    } else {
      // For localhost other certificates: use enhanced JSON structure
      const enhancedData = {
        t: "CERT",
        id: certificateData.certificateId,
        n: certificateData.recipientName,
        e: certificateData.recipientEmail?.substring(0, 10) + "..." || "",
        tpl:
          certificateData.templateName.substring(0, 20) +
          (certificateData.templateName.length > 20 ? "..." : ""),
        iss: certificateData.issuerName,
        d: certificateData.issueDate,
        v: `${baseUrl}/community/verify-certificate?id=${certificateData.certificateId}`,
      };

      console.log("📱 Localhost QR Data (other certificates - enhanced):", {
        originalLength: JSON.stringify({
          type: "CERTIFICATE_INFO",
          certificateId: certificateData.certificateId,
          recipientName: certificateData.recipientName,
          recipientEmail: certificateData.recipientEmail,
          templateName: certificateData.templateName,
          issueDate: certificateData.issueDate,
          issuerName: certificateData.issuerName,
          organizationName: certificateData.organizationName || "FOM",
          verificationUrl: `${baseUrl}/community/verify-certificate?id=${certificateData.certificateId}`,
          generatedAt: new Date().toISOString(),
          environment: "development",
        }).length,
        enhancedLength: JSON.stringify(enhancedData).length,
        reduction: "Enhanced compact format for other certificates",
      });

      // Return enhanced JSON string for localhost other certificates
      return JSON.stringify(enhancedData);
    }
  } else {
    // For production: use standard verification URL
    return `${baseUrl}/community/verify-certificate?id=${certificateData.certificateId}`;
  }
}

// Format certificate display name
export function formatCertificateDisplayName(
  firstName: string,
  lastName: string,
): string {
  return `${firstName.trim()} ${lastName.trim()}`;
}

// Certificate categories with display information
export const CERTIFICATE_CATEGORIES = {
  baptism: {
    label: "Baptism",
    description: "Certificate of baptism",
    color: "blue",
    icon: "💧",
  },
  confirmation: {
    label: "Confirmation",
    description: "Confirmation certificate",
    color: "purple",
    icon: "✝️",
  },
  course: {
    label: "Course Completion",
    description: "Course or study completion certificate",
    color: "green",
    icon: "📚",
  },
  training: {
    label: "Training",
    description: "Training program certificate",
    color: "orange",
    icon: "🎓",
  },
  volunteer: {
    label: "Volunteer Service",
    description: "Volunteer service recognition",
    color: "pink",
    icon: "🤝",
  },
  mission: {
    label: "Mission Trip",
    description: "Mission trip participation certificate",
    color: "indigo",
    icon: "🌍",
  },
} as const;

// Get category information
export function getCategoryInfo(category: string) {
  return (
    CERTIFICATE_CATEGORIES[category as keyof typeof CERTIFICATE_CATEGORIES] || {
      label: category,
      description: "Certificate",
      color: "gray",
      icon: "📄",
    }
  );
}

// Default template data for new certificates
export function getDefaultTemplateData(): TemplateData {
  // Base canvas dimensions
  const baseWidth = 800;
  const baseHeight = 600;

  return {
    elements: [
      {
        id: "title",
        type: "text",
        content: "Certificate of Achievement",
        position: {
          x: baseWidth * 0.25, // 25% from left (centered with 50% width)
          y: baseHeight * 0.15, // 15% from top
          width: baseWidth * 0.5, // 50% of canvas width
          height: baseHeight * 0.08, // 8% of height
        },
        style: {
          fontSize: 36,
          fontFamily: "serif",
          color: "#1f2937",
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        id: "subtitle",
        type: "text",
        content: "This is to certify that",
        position: {
          x: baseWidth * 0.3,
          y: baseHeight * 0.28,
          width: baseWidth * 0.4,
          height: baseHeight * 0.05,
        },
        style: {
          fontSize: 18,
          fontFamily: "serif",
          color: "#374151",
          textAlign: "center",
        },
      },
      {
        id: "recipient",
        type: "text",
        content: "[Recipient Name]",
        position: {
          x: baseWidth * 0.25,
          y: baseHeight * 0.38,
          width: baseWidth * 0.5,
          height: baseHeight * 0.08,
        },
        style: {
          fontSize: 28,
          fontFamily: "serif",
          color: "#059669",
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        id: "achievement",
        type: "text",
        content: "has successfully completed",
        position: {
          x: baseWidth * 0.3,
          y: baseHeight * 0.52,
          width: baseWidth * 0.4,
          height: baseHeight * 0.05,
        },
        style: {
          fontSize: 18,
          fontFamily: "serif",
          color: "#374151",
          textAlign: "center",
        },
      },
      {
        id: "course",
        type: "text",
        content: "[Course/Program Name]",
        position: {
          x: baseWidth * 0.25,
          y: baseHeight * 0.62,
          width: baseWidth * 0.5,
          height: baseHeight * 0.06,
        },
        style: {
          fontSize: 22,
          fontFamily: "serif",
          color: "#1f2937",
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        id: "date",
        type: "text",
        content: "Date: {{issueDate}}",
        position: {
          x: baseWidth * 0.1,
          y: baseHeight * 0.82,
          width: baseWidth * 0.25,
          height: baseHeight * 0.04,
        },
        style: {
          fontSize: 16,
          fontFamily: "serif",
          color: "#374151",
          textAlign: "left",
        },
      },
      {
        id: "signature",
        type: "text",
        content: "Authorized by: {{issuerName}}",
        position: {
          x: baseWidth * 0.65,
          y: baseHeight * 0.82,
          width: baseWidth * 0.25,
          height: baseHeight * 0.04,
        },
        style: {
          fontSize: 16,
          fontFamily: "serif",
          color: "#374151",
          textAlign: "right",
        },
      },
    ],
    pageSettings: {
      width: 800,
      height: 600,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      background: { color: "#ffffff" },
    },
    fonts: [
      { family: "serif", variants: ["normal", "bold"] },
      { family: "sans-serif", variants: ["normal", "bold"] },
      { family: "monospace", variants: ["normal"] },
    ],
  };
}

/**
 * Create a secure certificate with all security features enabled
 */
export interface SecureCertificateData {
  certificateId: string;
  recipientName: string;
  templateName: string;
  issueDate: string;
  issuerName: string;
  customFields?: Record<string, unknown>;
  previousHash?: string;
}

export function createSecureCertificate(data: SecureCertificateData) {
  // Generate security package
  const security = generateCertificateSecurity(data);

  // Create verification URL with signature
  const verificationUrl = generateSecureVerificationUrl(
    data.certificateId,
    security.signature || "",
    process.env.NEXTAUTH_URL,
  );

  return {
    ...data,
    security,
    verificationUrl,
    qrCode: verificationUrl, // QR code will contain the secure verification URL
    metadata: {
      createdAt: new Date().toISOString(),
      securityLevel: security.level,
      hasWatermark: !!security.watermark,
      hasBlockchainHash: !!security.blockchainHash,
    },
  };
}

/**
 * Verify the integrity of a certificate using its security data
 */
export function verifyCertificateIntegrity(
  certificateData: SecureCertificateData,
  providedSignature: string,
): boolean {
  const expectedSecurity = generateCertificateSecurity(certificateData);
  return expectedSecurity.signature === providedSignature;
}

// Utility function to decode enhanced QR code data
export function decodeEnhancedQRCode(qrCodeData: string): {
  isEnhanced: boolean;
  data: unknown;
  formatted?: string;
} {
  try {
    // Try to parse as JSON (enhanced QR code)
    const parsed = JSON.parse(qrCodeData);

    if (parsed.type === "CERTIFICATE_INFO") {
      // Format the data nicely for display
      const formatted = `
📜 CERTIFICATE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Certificate ID: ${parsed.certificateId}
👤 Recipient: ${parsed.recipientName}
📧 Email: ${parsed.recipientEmail}
📋 Template: ${parsed.templateName}
📅 Issue Date: ${parsed.issueDate}
✍️ Issued By: ${parsed.issuerName}
🏢 Organization: ${parsed.organizationName}
🌍 Environment: ${parsed.environment}
⏰ Generated: ${new Date(parsed.generatedAt).toLocaleString()}

🔗 Verification URL:
${parsed.verificationUrl}
      `.trim();

      return {
        isEnhanced: true,
        data: parsed,
        formatted: formatted,
      };
    }
  } catch {
    // Not JSON, probably a regular URL
  }

  // Regular verification URL
  return {
    isEnhanced: false,
    data: qrCodeData,
    formatted: `🔗 Verification URL: ${qrCodeData}`,
  };
}

// Format certificate information for display
export function formatCertificateInfo(
  certInfo: Record<string, unknown>,
): string {
  if (!certInfo || typeof certInfo !== "object") {
    return "Invalid certificate information";
  }

  return `
Certificate Details:
• ID: ${certInfo.certificateId || "N/A"}
• Recipient: ${certInfo.recipientName || "N/A"}
• Email: ${certInfo.recipientEmail || "N/A"}
• Template: ${certInfo.templateName || "N/A"}
• Issue Date: ${certInfo.issueDate || "N/A"}
• Issued By: ${certInfo.issuerName || "N/A"}
• Organization: ${certInfo.organizationName || "N/A"}
  `.trim();
}
