/**
 * Certificate service for handling certificate operations
 * Single source of truth for certificate-related business logic
 */
import { prisma } from "@/lib/prisma";
import { generateVerificationId } from "@/lib/creative/certificates/template-builder/certificate";
import { getVerificationUrl } from "@/lib/creative/certificates/template-builder/url";
import {
  generateCertificatePDF,
  generateCertificatePNG,
  generateQRCode,
} from "@/lib/creative/certificates/template-builder/pdf-generator";
import { Prisma } from "@prisma/client";

export type CertificateStatus = "active" | "revoked" | "expired";

// Shared function for getting all certificate templates
export async function getCertificateTemplates(params?: {
  isActive?: boolean;
  category?: string;
}) {
  try {
    const where: Record<string, unknown> = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.category) {
      where.category = params.category;
    }

    const templates = await prisma.certificateTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { certificates: true },
        },
      },
    });

    // Transform data to include certificate count
    return templates.map((template) => ({
      ...template,
      certificatesIssued: template._count.certificates,
    }));
  } catch (error) {
    console.error("Error fetching certificate templates:", error);
    throw new Error("Failed to fetch certificate templates");
  }
}

// Get a single certificate template by ID
export async function getCertificateTemplateById(id: string) {
  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { certificates: true },
        },
      },
    });

    if (!template) {
      return null;
    }

    return {
      ...template,
      certificatesIssued: template._count.certificates,
    };
  } catch (error) {
    console.error("Error fetching certificate template:", error);
    throw new Error("Failed to fetch certificate template");
  }
}

// Create a certificate template
export async function createCertificateTemplate(data: {
  name: string;
  description: string;
  category: string;
  templateData: Prisma.InputJsonValue;
  isActive: boolean;
  createdBy: string;
}) {
  try {
    // Generate typeCode from name
    const typeCode = data.name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 3)
      .padEnd(3, "X");

    const template = await prisma.certificateTemplate.create({
      data: {
        ...data,
        typeCode,
      },
    });

    return template;
  } catch (error) {
    console.error("Error creating certificate template:", error);
    throw new Error("Failed to create certificate template");
  }
}

// Update a certificate template
export async function updateCertificateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    templateData?: Prisma.InputJsonValue;
    isActive?: boolean;
  }
) {
  try {
    const template = await prisma.certificateTemplate.update({
      where: { id },
      data,
    });

    return template;
  } catch (error) {
    console.error("Error updating certificate template:", error);
    throw new Error("Failed to update certificate template");
  }
}

// Delete a certificate template
export async function deleteCertificateTemplate(id: string) {
  try {
    // Check if there are any certificates using this template
    const certificateCount = await prisma.certificate.count({
      where: { templateId: id },
    });

    if (certificateCount > 0) {
      throw new Error("Cannot delete a template that has certificates issued");
    }

    await prisma.certificateTemplate.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting certificate template:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to delete certificate template"
    );
  }
}

// Issue a certificate
export async function issueCertificate(data: {
  templateId: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  issuedBy: string;
  issuedTo?: string; // Optional user ID
  certificateData: Prisma.InputJsonValue;
  expiryDate?: Date;
}) {
  try {
    // Generate unique verification ID
    const verificationId = await generateVerificationId();

    // Get the template
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      throw new Error("Certificate template not found");
    }

    // Generate certificate files (PDF, PNG, QR code)
    // These functions would be implemented in lib/utils/pdf-generator.ts
    const pdfPath = await generateCertificatePDF();

    const pngPath = await generateCertificatePNG();

    const verificationUrl = getVerificationUrl(verificationId);
    const qrCodeData = await generateQRCode(verificationUrl);

    // Create certificate record in database
    const certificate = await prisma.certificate.create({
      data: {
        templateId: data.templateId,
        recipientFirstName: data.recipientFirstName,
        recipientLastName: data.recipientLastName,
        recipientEmail: data.recipientEmail,
        issuedBy: data.issuedBy,
        issuedTo: data.issuedTo,
        verificationId,
        certificateData: data.certificateData,
        pdfPath,
        pngPath,
        qrCodeData,
        expiryDate: data.expiryDate,
        status: "active",
      },
      include: {
        template: true,
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // TODO: Send email to recipient with certificate

    return certificate;
  } catch (error) {
    console.error("Error issuing certificate:", error);
    throw new Error("Failed to issue certificate");
  }
}

// Get certificates
export async function getCertificates(params?: {
  status?: CertificateStatus;
  templateId?: string;
  issuedBy?: string;
  issuedTo?: string;
}) {
  try {
    const where: Record<string, unknown> = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.templateId) {
      where.templateId = params.templateId;
    }

    if (params?.issuedBy) {
      where.issuedBy = params.issuedBy;
    }

    if (params?.issuedTo) {
      where.issuedTo = params.issuedTo;
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    return certificates;
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw new Error("Failed to fetch certificates");
  }
}

// Get a certificate by verification ID
export async function getCertificateByVerificationId(verificationId: string) {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return certificate;
  } catch (error) {
    console.error("Error fetching certificate:", error);
    throw new Error("Failed to fetch certificate");
  }
}

// Update a certificate's status (revoke, expire)
export async function updateCertificateStatus(
  id: string,
  status: CertificateStatus
) {
  try {
    const certificate = await prisma.certificate.update({
      where: { id },
      data: { status },
    });

    return certificate;
  } catch (error) {
    console.error("Error updating certificate status:", error);
    throw new Error("Failed to update certificate status");
  }
}

// Record a certificate verification
export async function recordVerification(
  certificateId: string,
  verifiedByIp: string,
  verificationMethod: string
) {
  try {
    await prisma.certificateVerification.create({
      data: {
        certificateId,
        verifiedByIp,
        verificationMethod,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error recording verification:", error);
    throw new Error("Failed to record verification");
  }
}

// Get certificate verification history
export async function getVerificationHistory(certificateId: string) {
  try {
    const verifications = await prisma.certificateVerification.findMany({
      where: { certificateId },
      orderBy: { verifiedAt: "desc" },
    });

    return verifications;
  } catch (error) {
    console.error("Error fetching verification history:", error);
    throw new Error("Failed to fetch verification history");
  }
}

// Verify a certificate and record the verification
export async function verifyCertificate(
  verificationId: string,
  data: {
    verifiedByIp: string;
    verificationMethod: string;
  }
) {
  try {
    // Get the certificate by verification ID
    const certificate = await getCertificateByVerificationId(verificationId);

    if (!certificate) {
      return {
        valid: false,
        certificate: null,
        message: "Certificate not found",
      };
    }

    // Check if certificate is valid (active and not expired)
    const isExpired =
      certificate.expiryDate && certificate.expiryDate < new Date();

    if (certificate.status !== "active") {
      return {
        valid: false,
        certificate,
        message: `Certificate has been ${certificate.status}`,
      };
    }

    if (isExpired) {
      // Update status to expired if it's not already
      await updateCertificateStatus(certificate.id, "expired");

      return {
        valid: false,
        certificate: {
          ...certificate,
          status: "expired",
        },
        message: "Certificate has expired",
      };
    }

    // Record this verification
    await recordVerification(
      certificate.id,
      data.verifiedByIp,
      data.verificationMethod
    );

    // Get verification history
    const verificationHistory = await getVerificationHistory(certificate.id);

    return {
      valid: true,
      certificate,
      verificationHistory,
      message: "Certificate is valid",
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    throw new Error("Failed to verify certificate");
  }
}
