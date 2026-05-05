/**
 * Certificate service for handling certificate operations
 * Single source of truth for certificate-related business logic
 */
import crypto from "crypto";
import { db } from "@/lib/db";
import { generateVerificationUrl } from "@/lib/creative/certificates/html-export";
import { generateCertificateId } from "@/lib/creative/certificates/html-export/certificate-id-generator";
import { generateCertificateQRCode } from "@/lib/creative/certificates/html-export/qr-code-generator";
import { Prisma } from "@prisma/client";

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

// Certificate template operations
export async function getCertificateTemplates(params?: {
  status?: TemplateStatus;
  type?: CertificateType;
  organizationId?: string;
}) {
  try {
    const where: Prisma.certificate_templatesWhereInput = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.organizationId) {
      where.organizationId = params.organizationId;
    }

    const templates = await db.certificate_templates.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { certificates: true },
        },
      },
    });

    return templates.map((template) => ({
      ...template,
      certificateCount: template._count.certificates,
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
    const template = await db.certificate_templates.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
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
  description?: string;
  type: CertificateType;
  templateData: Prisma.InputJsonValue;
  status?: TemplateStatus;
  organizationId?: string;
  createdById: string;
}) {
  try {
    // Generate unique slug
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (await db.certificate_templates.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const template = await db.certificate_templates.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        slug,
        description: data.description,
        type: data.type,
        status: data.status || "DRAFT",
        templateData: data.templateData,
        organizationId: data.organizationId,
        createdById: data.createdById,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return template;
  } catch (error) {
    console.error("Error creating certificate template:", error);
    throw new Error("Failed to create certificate template");
  }
}

// Update certificate template
export async function updateCertificateTemplate(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    type: CertificateType;
    templateData: Prisma.InputJsonValue;
    status: TemplateStatus;
    organizationId: string;
  }>,
) {
  try {
    let updateData = { ...data };

    // Update slug if name changed
    if (data.name) {
      const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let slug = baseSlug;
      let counter = 1;

      while (
        await db.certificate_templates.findFirst({
          where: { slug, NOT: { id } },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData = { ...updateData, slug };
    }

    const template = await db.certificate_templates.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return template;
  } catch (error) {
    console.error("Error updating certificate template:", error);
    throw new Error("Failed to update certificate template");
  }
}

// Delete certificate template
export async function deleteCertificateTemplate(id: string) {
  try {
    // Check if template has issued certificates
    const certificateCount = await db.certificates.count({
      where: { templateId: id },
    });

    if (certificateCount > 0) {
      throw new Error("Cannot delete template with issued certificates");
    }

    await db.certificate_templates.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting certificate template:", error);
    throw new Error("Failed to delete certificate template");
  }
}

// Certificate operations
export async function issueCertificate(data: {
  recipientName: string;
  recipientEmail?: string;
  templateId: string;
  organizationId?: string;
  issuedById: string;
  customFields?: Prisma.InputJsonValue;
  expiryDate?: Date;
}) {
  try {
    // Get template to ensure it exists and is active
    const template = await db.certificate_templates.findUnique({
      where: { id: data.templateId },
      include: { organizations: true },
    });

    if (!template) {
      throw new Error("Certificate template not found");
    }

    if (template.status !== "ACTIVE") {
      throw new Error("Cannot issue certificate from inactive template");
    }

    // Map organization slug to the correct prefix for ID generation
    const getOrganizationCode = (
      orgSlug: string,
    ): keyof typeof import("@/lib/creative/certificates/html-export/certificate-id-generator").CERTIFICATE_ID_PATTERNS => {
      const orgMap: Record<
        string,
        keyof typeof import("@/lib/creative/certificates/html-export/certificate-id-generator").CERTIFICATE_ID_PATTERNS
      > = {
        juls: "JULS",
        jicf: "JICF",
        fom: "FOM",
        "ekd-digital": "EKD",
        "tech-academy": "EKD",
      };
      return orgMap[orgSlug] || "GENERAL";
    };

    const orgSlug = template.organizations?.slug || "general";
    const orgCode = getOrganizationCode(orgSlug);

    // Generate IDs - use certificateId as the verificationId to maintain our format
    const certificateId = generateCertificateId(
      orgCode,
      template.type.toLowerCase(),
    );
    const verificationId = certificateId; // Use the same ID for both to maintain format

    // Create certificate record
    const certificate = await db.certificates.create({
      data: {
        id: crypto.randomUUID(),
        certificateId,
        verificationId,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        templateId: data.templateId,
        organizationId: data.organizationId || template.organizationId,
        issuedById: data.issuedById,
        customFields: data.customFields,
        expiryDate: data.expiryDate,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      include: {
        certificate_templates: true,
        organizations: true,
        user_certificates_issuedByIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Generate QR code - use certificateId for verification URL since it's now our proper format
    const verificationUrl = generateVerificationUrl(certificateId);
    const qrCodeUrl = await generateCertificateQRCode(verificationUrl);

    // Update certificate with QR code URL
    const updatedCertificate = await db.certificates.update({
      where: { id: certificate.id },
      data: { qrCodeUrl },
      include: {
        certificate_templates: true,
        organizations: true,
        user_certificates_issuedByIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedCertificate;
  } catch (error) {
    console.error("Error issuing certificate:", error);
    throw new Error("Failed to issue certificate");
  }
}

// Get certificates with filtering
export async function getCertificates(params?: {
  status?: CertificateStatus;
  templateId?: string;
  organizationId?: string;
  issuedById?: string;
  recipientEmail?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const where: Prisma.certificatesWhereInput = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.templateId) {
      where.templateId = params.templateId;
    }

    if (params?.organizationId) {
      where.organizationId = params.organizationId;
    }

    if (params?.issuedById) {
      where.issuedById = params.issuedById;
    }

    if (params?.recipientEmail) {
      where.recipientEmail = params.recipientEmail;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      db.certificates.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          certificate_templates: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          organizations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user_certificates_issuedByIdTouser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.certificates.count({ where }),
    ]);

    return {
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw new Error("Failed to fetch certificates");
  }
}

// Get certificate by verification ID
export async function getCertificateByVerificationId(verificationId: string) {
  try {
    const certificate = await db.certificates.findUnique({
      where: { verificationId },
      include: {
        certificate_templates: true,
        organizations: true,
        user_certificates_issuedByIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return null;
    }

    // Update download count
    await db.certificates.update({
      where: { id: certificate.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadAt: new Date(),
      },
    });

    return certificate;
  } catch (error) {
    console.error("Error fetching certificate by verification ID:", error);
    throw new Error("Failed to fetch certificate");
  }
}

// Revoke certificate
export async function revokeCertificate(
  id: string,
  revokedById: string,
  reason?: string,
) {
  try {
    const certificate = await db.certificates.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedById,
        revokedReason: reason,
        revokedAt: new Date(),
      },
      include: {
        certificate_templates: true,
        organizations: true,
        user_certificates_issuedByIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user_certificates_revokedByIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return certificate;
  } catch (error) {
    console.error("Error revoking certificate:", error);
    throw new Error("Failed to revoke certificate");
  }
}

// Bulk operations
export async function bulkRevokeCertificates(
  certificateIds: string[],
  revokedById: string,
  reason?: string,
) {
  try {
    const result = await db.certificates.updateMany({
      where: {
        id: { in: certificateIds },
        status: "ACTIVE",
      },
      data: {
        status: "REVOKED",
        revokedById,
        revokedReason: reason,
        revokedAt: new Date(),
      },
    });

    return { updated: result.count };
  } catch (error) {
    console.error("Error bulk revoking certificates:", error);
    throw new Error("Failed to bulk revoke certificates");
  }
}

export async function bulkDeleteCertificates(certificateIds: string[]) {
  try {
    const result = await db.certificates.deleteMany({
      where: {
        id: { in: certificateIds },
      },
    });

    return { deleted: result.count };
  } catch (error) {
    console.error("Error bulk deleting certificates:", error);
    throw new Error("Failed to bulk delete certificates");
  }
}
