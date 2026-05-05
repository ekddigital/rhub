/**
 * Certificate utility functions for generating verification IDs,
 * creating PDF certificates, and managing certificate lifecycle
 */

import { customAlphabet } from "nanoid";

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
  sequenceNumber?: number
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
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://ekddigital.com";
  return `${baseUrl}/services/certificates/verify?id=${certificateId}`;
}

// Certificate status types
export type CertificateStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "DRAFT";
export type CertificateType =
  | "APPRECIATION"
  | "COMPLETION"
  | "ACHIEVEMENT"
  | "PARTICIPATION"
  | "EXCELLENCE"
  | "SERVICE"
  | "RECOGNITION";
export type TemplateStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

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
    fontWeight?: string;
    fontStyle?: "italic" | "normal";
    textAlign?: "left" | "center" | "right";
    letterSpacing?: string;
    lineHeight?: string;

    // General
    color?: string;
    backgroundColor?: string;
    rotation?: number;
    opacity?: number;

    // Shape specific
    borderWidth?: string;
    borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none";
    borderColor?: string;
    borderRadius?: string;

    // Image specific
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  };
}

export interface PageSettings {
  width: number;
  height: number;
  unit: "px" | "mm" | "in";
  orientation: "portrait" | "landscape";
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface FontSettings {
  family: string;
  variants: string[];
  source?: "google" | "local" | "url";
  url?: string;
}
