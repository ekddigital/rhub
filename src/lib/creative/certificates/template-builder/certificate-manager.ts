/**
 * Certificate Management System
 * Comprehensive certificate creation, customization, and security management
 */

import { TemplateData } from "./certificate";
import {
  createSecureCertificate,
  generateCertificateId,
  SecureCertificateData,
} from "./certificate";
import { generateCertificateSecurity } from "./certificate-security";
import { getCertificateTemplate, FOM_COLORS } from "./certificate-templates";

// Organization configuration for certificate customization
export interface OrganizationConfig {
  id: string;
  name: string;
  tagline?: string;
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  covenantVerse?: {
    text: string;
    reference: string;
  };
  leadership: {
    executiveDirector?: string;
    chairperson?: string;
    secretary?: string;
  };
}

// Default FOM organization config
export const FOM_ORGANIZATION: OrganizationConfig = {
  id: "fom",
  name: "FISHERS OF MEN",
  tagline: "Bringing Jesus to the World",
  logo: "/Logo.png",
  colors: {
    primary: FOM_COLORS.primary,
    secondary: FOM_COLORS.secondary,
    accent: FOM_COLORS.accent,
    text: FOM_COLORS.darkGray,
  },
  covenantVerse: {
    text: "Do not be afraid, for those who are with us are more than those who are with them",
    reference: "2 Kings 6:16",
  },
  leadership: {
    executiveDirector: "Mr. Enoch Kwateh Dongbo",
    chairperson: "Mr. Gerald Canaan Sohn",
    secretary: "Miss. Patience Fero",
  },
};

// Certificate request interface
export interface CertificateRequest {
  id?: string; // <-- Add this
  templateName: string;
  recipientName: string;
  authorizingOfficial?: string; // New field for the authorizing official (like "Hetawk", "Executive Director", etc.)
  issueDate?: string; // Optional custom issue date in YYYY-MM-DD format
  customFields?: Record<string, unknown>;
  securityLevel?: "BASIC" | "STANDARD" | "HIGH";
  organizationId?: string;
  issuedBy?: string;
  validityPeriod?: number | null; // months, null = never expires
}

// Complete certificate with all metadata
export interface CompleteCertificate {
  id: string;
  templateName: string;
  recipientName: string;
  organizationId: string;
  issueDate: string;
  expiryDate?: string;
  issuerName: string;
  status: "active" | "revoked" | "expired";
  securityData: ReturnType<typeof generateCertificateSecurity>;
  verificationUrl: string;
  qrCode: string;
  customFields: Record<string, unknown>;
  metadata: {
    createdAt: string;
    lastModified: string;
    version: string;
    securityLevel: string;
    blockchainHash?: string;
  };
}

/**
 * Certificate Management Class
 */
export class CertificateManager {
  private organizations: Map<string, OrganizationConfig> = new Map();
  private certificates: Map<string, CompleteCertificate> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor() {
    // Register default FOM organization
    this.registerOrganization(FOM_ORGANIZATION);
  }

  /**
   * Register a new organization for certificate issuance
   */
  registerOrganization(config: OrganizationConfig): void {
    this.organizations.set(config.id, config);
    this.sequenceCounters.set(config.id, 1);
  }

  /**
   * Get organization configuration
   */
  getOrganization(id: string): OrganizationConfig | undefined {
    return this.organizations.get(id);
  }

  /**
   * Create a customized template for an organization
   */
  customizeTemplate(
    templateName: string,
    organizationId: string,
    customizations?: Partial<OrganizationConfig>
  ): TemplateData | null {
    const baseTemplate = getCertificateTemplate(templateName);
    if (!baseTemplate) return null;

    const organization = this.getOrganization(organizationId);
    if (!organization) return null;

    // Apply customizations
    const config = customizations
      ? { ...organization, ...customizations }
      : organization;

    // Clone template and apply organization branding
    const customTemplate: TemplateData = {
      ...baseTemplate,
      elements: baseTemplate.elements.map((element) => {
        // Update organization name
        if (
          element.content?.includes("FISHERS OF MEN") &&
          config.name !== "FISHERS OF MEN"
        ) {
          return {
            ...element,
            content: element.content.replace("FISHERS OF MEN", config.name),
          };
        }

        // Update tagline
        if (
          element.content?.includes("Bringing Jesus to the World") &&
          config.tagline
        ) {
          return {
            ...element,
            content: element.content.replace(
              "Bringing Jesus to the World",
              config.tagline
            ),
          };
        }

        // Update colors
        if (element.style?.color === FOM_COLORS.primary) {
          return {
            ...element,
            style: { ...element.style, color: config.colors.primary },
          };
        }

        // Update logo path
        if (
          element.type === "image" &&
          element.content === "/Logo.png" &&
          config.logo
        ) {
          return {
            ...element,
            content: config.logo,
          };
        }

        // Update covenant verse
        if (
          element.content?.includes("Do not be afraid") &&
          config.covenantVerse
        ) {
          return {
            ...element,
            content: `"${config.covenantVerse.text}"`,
          };
        }

        // Update verse reference
        if (element.content?.includes("2 Kings 6:16") && config.covenantVerse) {
          return {
            ...element,
            content: config.covenantVerse.reference,
          };
        }

        return element;
      }),
    };

    return customTemplate;
  }

  /**
   * Issue a new certificate
   */
  issueCertificate(request: CertificateRequest): CompleteCertificate {
    const organizationId = request.organizationId || "fom";
    const organization = this.getOrganization(organizationId);

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    // Generate certificate ID if not provided, otherwise use provided ID
    const certificateId =
      request.id ||
      generateCertificateId(
        request.templateName,
        this.getNextSequenceNumber(organizationId, request.templateName)
      );

    const issueDate = new Date().toISOString();
    const expiryDate = request.validityPeriod
      ? new Date(
          Date.now() + request.validityPeriod * 30 * 24 * 60 * 60 * 1000 // Assumes validityPeriod is in months
        ).toISOString()
      : undefined;

    const issuerName =
      request.issuedBy ||
      organization.leadership.executiveDirector ||
      organization.leadership.chairperson ||
      "Authorized Official";

    const certificateData: SecureCertificateData = {
      certificateId, // This will be the provided or generated ID
      recipientName: request.recipientName,
      templateName: request.templateName,
      issueDate,
      issuerName,
      customFields: request.customFields || {},
    };

    const secureCert = createSecureCertificate(certificateData);

    const certificate: CompleteCertificate = {
      id: certificateId, // This will be the provided or generated ID
      templateName: request.templateName,
      recipientName: request.recipientName,
      organizationId,
      issueDate,
      expiryDate,
      issuerName,
      status: "active",
      securityData: secureCert.security,
      verificationUrl: secureCert.verificationUrl,
      qrCode: secureCert.qrCode,
      customFields: request.customFields || {}, // These are the simple key-value custom fields
      metadata: {
        ...secureCert.metadata,
        lastModified: issueDate,
        version: "1.0",
      },
    };

    this.certificates.set(certificateId, certificate);
    return certificate;
  }

  /**
   * Get certificate by ID
   */
  getCertificate(id: string): CompleteCertificate | undefined {
    return this.certificates.get(id);
  }

  /**
   * Verify certificate authenticity
   */
  verifyCertificate(
    id: string,
    signature?: string
  ): {
    valid: boolean;
    certificate?: CompleteCertificate;
    reason?: string;
  } {
    const certificate = this.getCertificate(id);

    if (!certificate) {
      return { valid: false, reason: "Certificate not found" };
    }

    if (certificate.status !== "active") {
      return {
        valid: false,
        certificate,
        reason: `Certificate is ${certificate.status}`,
      };
    }

    if (
      certificate.expiryDate &&
      new Date() > new Date(certificate.expiryDate)
    ) {
      return { valid: false, certificate, reason: "Certificate has expired" };
    }

    if (signature && certificate.securityData.signature !== signature) {
      return { valid: false, certificate, reason: "Invalid signature" };
    }

    return { valid: true, certificate };
  }

  /**
   * Revoke a certificate
   */
  revokeCertificate(id: string, reason?: string): boolean {
    const certificate = this.certificates.get(id);
    if (!certificate) return false;

    certificate.status = "revoked";
    certificate.metadata.lastModified = new Date().toISOString();
    certificate.customFields.revocationReason = reason;

    return true;
  }

  /**
   * Get next sequence number for a certificate type
   */
  private getNextSequenceNumber(
    organizationId: string,
    templateName: string
  ): number {
    const key = `${organizationId}-${templateName}`;
    const current = this.sequenceCounters.get(key) || 1;
    this.sequenceCounters.set(key, current + 1);
    return current;
  }

  /**
   * Get all certificates for an organization
   */
  getOrganizationCertificates(organizationId: string): CompleteCertificate[] {
    return Array.from(this.certificates.values()).filter(
      (cert) => cert.organizationId === organizationId
    );
  }

  /**
   * Get certificates by status
   */
  getCertificatesByStatus(
    status: "active" | "revoked" | "expired"
  ): CompleteCertificate[] {
    return Array.from(this.certificates.values()).filter(
      (cert) => cert.status === status
    );
  }

  /**
   * Get certificate analytics
   */
  getAnalytics(organizationId?: string) {
    const certs = organizationId
      ? this.getOrganizationCertificates(organizationId)
      : Array.from(this.certificates.values());

    const byTemplate = certs.reduce((acc, cert) => {
      acc[cert.templateName] = (acc[cert.templateName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = certs.reduce((acc, cert) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySecurityLevel = certs.reduce((acc, cert) => {
      const level = cert.metadata.securityLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: certs.length,
      byTemplate,
      byStatus,
      bySecurityLevel,
      recentIssued: certs
        .sort(
          (a, b) =>
            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
        )
        .slice(0, 10),
    };
  }
}

// Export singleton instance
export const certificateManager = new CertificateManager();

// Helper functions for easy access
export function issueCertificate(
  request: CertificateRequest
): CompleteCertificate {
  return certificateManager.issueCertificate(request);
}

export function verifyCertificate(id: string, signature?: string) {
  return certificateManager.verifyCertificate(id, signature);
}

export function getCertificateById(
  id: string
): CompleteCertificate | undefined {
  return certificateManager.getCertificate(id);
}

export function registerOrganization(config: OrganizationConfig): void {
  certificateManager.registerOrganization(config);
}
