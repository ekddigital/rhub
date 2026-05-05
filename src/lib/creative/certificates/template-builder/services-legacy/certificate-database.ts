/**
 * Database Service for Certificate Management
 * Integrates the certificate manager with Prisma database
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma"; // Use centralized Prisma instance
import {
  CertificateManager,
  CertificateRequest,
  CompleteCertificate,
  certificateManager,
  OrganizationConfig, // Import OrganizationConfig
} from "../utils/certificate-manager";
import { CERTIFICATE_TEMPLATES } from "../utils/certificate-templates";

/**
 * Database Certificate Service
 */
export class DatabaseCertificateService {
  private certificateManager: CertificateManager;

  constructor() {
    this.certificateManager = certificateManager;
  }

  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async getOrganizations() {
    return prisma.organization.findMany();
  }

  async createOrganization(
    data: Omit<OrganizationConfig, "id"> & { id?: string }
  ): Promise<OrganizationConfig> {
    const orgId =
      data.id || data.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20); // simple slug/id generation
    const newOrg = await prisma.organization.create({
      data: {
        id: orgId,
        slug: orgId,
        name: data.name,
        tagline: data.tagline,
        logoUrl: data.logo,
        colorPrimary: data.colors.primary,
        colorSecondary: data.colors.secondary,
        colorAccent: data.colors.accent,
        colorText: data.colors.text,
        covenantText: data.covenantVerse?.text,
        covenantReference: data.covenantVerse?.reference,
        executiveDirector: data.leadership?.executiveDirector,
        chairperson: data.leadership?.chairperson,
        secretary: data.leadership?.secretary,
      },
    });
    // Convert Prisma Organization to OrganizationConfig
    return {
      id: newOrg.id,
      name: newOrg.name,
      tagline: newOrg.tagline || undefined,
      logo: newOrg.logoUrl || undefined,
      colors: {
        primary: newOrg.colorPrimary || "#0c436a",
        secondary: newOrg.colorSecondary || "#2596be",
        accent: newOrg.colorAccent || "#436c87",
        text: newOrg.colorText || "#505050",
      },
      covenantVerse:
        newOrg.covenantText && newOrg.covenantReference
          ? {
              text: newOrg.covenantText,
              reference: newOrg.covenantReference,
            }
          : undefined,
      leadership: {
        executiveDirector: newOrg.executiveDirector || undefined,
        chairperson: newOrg.chairperson || undefined,
        secretary: newOrg.secretary || undefined,
      },
    };
  }

  /**
   * Initialize default data (templates and FOM organization)
   * Override everything during initialization for consistency
   */
  async initializeDefaults(): Promise<void> {
    try {
      console.log("🚀 Starting database initialization with override mode...");

      // Create default FOM organization if it doesn't exist
      await this.ensureFOMOrganization();

      // Seed default certificate templates with override
      console.log("📋 Seeding certificate templates with override...");
      await this.seedCertificateTemplates();

      console.log("✅ Database initialization completed successfully");
    } catch (error) {
      console.error("❌ Error initializing defaults:", error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      throw error;
    }
  }

  /**
   * Ensure FOM organization exists in database
   */
  private async ensureFOMOrganization(): Promise<void> {
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: "fom" },
    });

    if (!existingOrg) {
      // Find any super admin user for organization creation
      const superAdminUser = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        orderBy: { createdAt: "asc" }, // Use the oldest super admin if multiple exist
      });

      if (!superAdminUser) {
        console.error(
          "❌ No super admin user found for organization creation. Please ensure at least one user has SUPER_ADMIN role."
        );
        throw new Error("Super admin user required for organization setup");
      }

      console.log(
        `✅ Found super admin user: ${superAdminUser.email} for organization creation`
      );

      await prisma.organization.create({
        data: {
          id: "fom",
          slug: "fom",
          name: "FISHERS OF MEN",
          tagline: "Bringing Jesus to the World",
          logoUrl: "/Logo.png",
          colorPrimary: "#0c436a",
          colorSecondary: "#2596be",
          colorAccent: "#436c87",
          colorText: "#505050",
          covenantText:
            "Do not be afraid, for those who are with us are more than those who are with them",
          covenantReference: "2 Kings 6:16",
          executiveDirector: "Mr. Enoch Kwateh Dongbo",
          chairperson: "Mr. Gerald Canaan Sohn",
          secretary: "Miss. Patience Fero",
        },
      });

      console.log(
        `🏢 Created FOM organization - Managed by: ${superAdminUser.email}`
      );
    } else {
      console.log("🏢 FOM organization already exists");
    }
  }

  /**
   * Seed certificate templates from our template system with predictable IDs
   * Uses upsert to override everything during initialization
   */
  private async seedCertificateTemplates(): Promise<void> {
    // Find any super admin user for template seeding
    const superAdminUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      orderBy: { createdAt: "asc" }, // Use the oldest super admin if multiple exist
    });

    if (!superAdminUser) {
      console.error(
        "❌ No super admin user found for template seeding. Please ensure at least one user has SUPER_ADMIN role."
      );
      console.log(
        "Please ensure a super admin user exists before seeding templates"
      );
      return;
    }

    console.log(
      `🔑 Using super admin user: ${superAdminUser.firstName} ${superAdminUser.lastName} (${superAdminUser.email})`
    );

    // Use transaction to ensure all templates are processed atomically
    await prisma.$transaction(
      async (tx) => {
        for (const template of CERTIFICATE_TEMPLATES) {
          if (!template.name) continue;

          // Generate a predictable ID based on template name
          const templateId = this.generateTemplateId(template.name);

          // Get type code from certificate utils
          const typeCode = this.generateTypeCode(template.name);

          const templateData = {
            name: template.name,
            description:
              template.description ||
              `Professional ${template.name} certificate template`,
            category: this.getCategoryFromTemplate(template.name),
            typeCode: typeCode,
            templateData: JSON.parse(JSON.stringify(template)),
            defaultSecurityLevel: this.getDefaultSecurityLevel(template.name),
            createdBy: superAdminUser.id,
            isActive: true,
          };

          try {
            // Use upsert to create or update (override) the template
            await tx.certificateTemplate.upsert({
              where: { id: templateId },
              create: {
                id: templateId,
                ...templateData,
              },
              update: {
                ...templateData,
                // Ensure we override all fields during update
                updatedAt: new Date(),
              },
            });

            console.log(
              `🔄 Upserted template: ${template.name} (ID: ${templateId}) - Updated by: ${superAdminUser.email}`
            );
          } catch (error) {
            console.error(
              `❌ Failed to upsert template ${template.name}:`,
              error
            );
            // Continue with other templates instead of failing the entire process
          }
        }
      },
      {
        timeout: 60000, // 60 second timeout for the entire transaction
      }
    );
  }

  /**
   * Generate predictable template ID from template name
   */
  private generateTemplateId(templateName: string): string {
    return templateName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50); // Ensure it fits in database
  }

  /**
   * Issue a certificate and save to database
   */
  async issueCertificate(
    request: CertificateRequest & {
      recipientEmail?: string;
      issuedById: string;
    },
    fullTemplateDesignData: Prisma.JsonObject, // For storing in Certificate.certificateData
    enhancedQRCode?: string // Optional enhanced QR code data
  ): Promise<CompleteCertificate> {
    // Use a transaction for robust certificate issuance to prevent connection issues
    return await prisma.$transaction(
      async (tx) => {
        try {
          // Auto-generate certificate ID if not provided
          let certificateId = request.id;
          if (!certificateId) {
            // Get the next sequence number for this template
            const existingCount = await tx.certificate.count({
              where: {
                template: {
                  name: request.templateName,
                },
              },
            });

            // Import the generateCertificateId function
            const { generateCertificateId } = await import(
              "@/lib/creative/certificates/template-builder/certificate"
            );
            certificateId = generateCertificateId(
              request.templateName,
              existingCount + 1
            );
          }

          let validityInMonths: number | null = null;
          if (
            request.validityPeriod &&
            typeof request.validityPeriod === "number" &&
            request.validityPeriod > 0
          ) {
            validityInMonths = Math.ceil(request.validityPeriod / 30);
          } else if (request.validityPeriod === null) {
            validityInMonths = null;
          }

          const managerRequest: CertificateRequest = {
            id: certificateId,
            templateName: request.templateName,
            recipientName: request.recipientName,
            authorizingOfficial: request.authorizingOfficial, // Pass the authorizing official
            issueDate: request.issueDate, // Pass the custom issue date
            customFields: request.customFields,
            securityLevel: request.securityLevel,
            organizationId: request.organizationId,
            issuedBy: request.issuedBy, // This is userId, manager resolves to name
            validityPeriod: validityInMonths,
          };

          const certificate =
            this.certificateManager.issueCertificate(managerRequest);

          const template = await tx.certificateTemplate.findFirst({
            where: { name: request.templateName }, // templateName is like "Classic Elegant"
          });

          if (!template) {
            throw new Error(
              `Template with name '${request.templateName}' not found in database. Available templates might have different names or IDs.`
            );
          }

          const [firstName, ...lastNameParts] =
            request.recipientName.split(" ");
          const lastName = lastNameParts.join(" ") || "";

          const recipientUser = request.recipientEmail
            ? await tx.user.findUnique({
                where: { email: request.recipientEmail },
              })
            : null;

          // Ensure the issuing user exists in the database
          const issuingUser = await tx.user.findUnique({
            where: { id: request.issuedById },
          });

          if (!issuingUser) {
            throw new Error(
              `Issuing user with ID ${request.issuedById} not found`
            );
          } else if (!issuingUser) {
            throw new Error(
              `Issuing user with ID ${request.issuedById} does not exist`
            );
          }

          console.log("About to store certificate with templateData:", {
            certificateId: certificate.id,
            templateDataType: typeof fullTemplateDesignData,
            templateDataKeys:
              fullTemplateDesignData &&
              typeof fullTemplateDesignData === "object"
                ? Object.keys(fullTemplateDesignData)
                : "not an object",
            hasElements:
              fullTemplateDesignData &&
              typeof fullTemplateDesignData === "object" &&
              "elements" in fullTemplateDesignData,
            elementsCount:
              fullTemplateDesignData &&
              typeof fullTemplateDesignData === "object" &&
              "elements" in fullTemplateDesignData &&
              Array.isArray(fullTemplateDesignData.elements)
                ? fullTemplateDesignData.elements.length
                : "no elements",
            fullTemplateDesignData,
          });

          await tx.certificate.create({
            data: {
              id: certificate.id, // This is the humanReadableCertificateId from request.id
              templateId: template.id,
              recipientFirstName: firstName,
              recipientLastName: lastName,
              recipientEmail:
                request.recipientEmail || "no-email@placeholder.com",
              issuedTo: recipientUser?.id,
              issuedBy: request.issuedById,
              verificationId: certificate.id,
              certificateData: fullTemplateDesignData, // Store the full resolved design here
              securityLevel: certificate.metadata.securityLevel as string, // Cast from enum if needed
              digitalSignature: certificate.securityData.signature,
              blockchainHash: certificate.securityData.blockchainHash,
              watermarkData: certificate.securityData.watermark
                ? JSON.parse(JSON.stringify(certificate.securityData.watermark))
                : null,
              securityMetadata: JSON.parse(
                JSON.stringify(certificate.securityData)
              ) as Prisma.JsonObject,
              organizationId: request.organizationId || "fom",
              pdfPath: "",
              pngPath: "",
              qrCodeData: enhancedQRCode || certificate.qrCode, // Use enhanced QR code if provided
              issueDate: request.issueDate
                ? new Date(request.issueDate)
                : new Date(certificate.issueDate),
              expiryDate: certificate.expiryDate
                ? new Date(certificate.expiryDate)
                : null,
              status: certificate.status as string, // Cast from enum if needed
            },
          });

          return {
            ...certificate,
            qrCode: enhancedQRCode || certificate.qrCode, // Use enhanced QR code if provided
          };
        } catch (error) {
          console.error("Error issuing certificate in transaction:", error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error("Prisma Error Code:", error.code);
            console.error("Prisma Error Meta:", error.meta);
            console.error("Prisma Error Message:", error.message);
          }
          throw error;
        }
      },
      {
        maxWait: 10000, // Wait up to 10 seconds for a connection
        timeout: 30000, // Allow up to 30 seconds for the transaction
        isolationLevel: "ReadCommitted", // Use read committed isolation
      }
    );
  }

  /**
   * Get certificate by ID from database
   */
  async getCertificate(id: string): Promise<CompleteCertificate | null> {
    try {
      const dbCert = await prisma.certificate.findUnique({
        where: { id },
        include: {
          template: true,
          issuer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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

      if (!dbCert) return null;

      const issuerName =
        `${dbCert.issuer?.firstName || ""} ${
          dbCert.issuer?.lastName || ""
        }`.trim() || "Unknown Issuer";

      const certificate: CompleteCertificate = {
        id: dbCert.id,
        templateName: dbCert.template.name,
        recipientName:
          `${dbCert.recipientFirstName} ${dbCert.recipientLastName}`.trim(),
        organizationId: dbCert.organizationId,
        issueDate: dbCert.issueDate.toISOString(),
        expiryDate: dbCert.expiryDate?.toISOString(),
        issuerName: issuerName,
        status: dbCert.status as "active" | "revoked" | "expired",
        securityData:
          dbCert.securityMetadata as unknown as CompleteCertificate["securityData"],
        verificationUrl: this.generateVerificationUrl(dbCert.id),
        qrCode: dbCert.qrCodeData,
        customFields: dbCert.certificateData as Record<string, unknown>,
        metadata: {
          createdAt: dbCert.createdAt.toISOString(),
          lastModified: dbCert.updatedAt.toISOString(),
          version: "1.0", // Consider making this dynamic or part of dbCert
          securityLevel: dbCert.securityLevel,
          blockchainHash: dbCert.blockchainHash || undefined,
        },
      };

      return certificate;
    } catch (error) {
      console.error("Error getting certificate:", error);
      throw error;
    }
  }

  /**
   * Verify certificate by ID
   */
  async verifyCertificate(
    id: string,
    signature?: string,
    verificationMethod: string = "manual",
    verifierIp: string = "127.0.0.1"
  ): Promise<{
    valid: boolean;
    certificate?: CompleteCertificate;
    reason?: string;
  }> {
    try {
      const certificate = await this.getCertificate(id);

      if (!certificate) {
        return { valid: false, reason: "Certificate not found" };
      }

      // Log verification attempt
      await prisma.certificateVerification.create({
        data: {
          certificateId: id,
          verifiedByIp: verifierIp,
          verificationMethod,
        },
      });

      // Use certificate manager for verification logic
      return this.certificateManager.verifyCertificate(id, signature);
    } catch (error) {
      console.error("Error verifying certificate:", error);
      return { valid: false, reason: "Verification error" };
    }
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(
    id: string,
    reason?: string,
    revokedBy?: string
  ): Promise<boolean> {
    try {
      await prisma.certificate.update({
        where: { id },
        data: {
          status: "revoked",
          certificateData: {
            revocationReason: reason,
            revokedBy,
            revokedAt: new Date().toISOString(),
          } as any,
        },
      });

      // Also revoke in certificate manager
      this.certificateManager.revokeCertificate(id, reason);

      return true;
    } catch (error) {
      console.error("Error revoking certificate:", error);
      return false;
    }
  }

  /**
   * Get certificates for an organization
   */
  async getOrganizationCertificates(
    organizationId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
      templateName?: string;
    }
  ): Promise<CompleteCertificate[]> {
    try {
      const where: any = { organizationId };

      if (options?.status) {
        where.status = options.status;
      }

      if (options?.templateName) {
        where.template = { name: options.templateName };
      }

      const certificates = await prisma.certificate.findMany({
        where,
        include: {
          template: true,
          issuer: {
            select: { firstName: true, lastName: true },
          },
        },
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: "desc" },
      });

      return certificates.map((cert) => ({
        id: cert.id,
        templateName: cert.template.name,
        recipientName:
          `${cert.recipientFirstName} ${cert.recipientLastName}`.trim(),
        organizationId: cert.organizationId,
        issueDate: cert.issueDate.toISOString(),
        expiryDate: cert.expiryDate?.toISOString(),
        issuerName: `${cert.issuer.firstName} ${cert.issuer.lastName}`.trim(),
        status: cert.status as any,
        securityData: cert.securityMetadata as any,
        verificationUrl: this.generateVerificationUrl(cert.id),
        qrCode: cert.qrCodeData,
        customFields: cert.certificateData as any,
        metadata: {
          createdAt: cert.createdAt.toISOString(),
          lastModified: cert.updatedAt.toISOString(),
          version: "1.0",
          securityLevel: cert.securityLevel,
          blockchainHash: cert.blockchainHash ?? undefined,
        },
      }));
    } catch (error) {
      console.error("Error getting organization certificates:", error);
      throw error;
    }
  }

  /**
   * Get certificates for a user
   */
  async getUserCertificates(
    userId: string,
    filters?: {
      status?: string;
      templateId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CompleteCertificate[]> {
    try {
      const where: Record<string, unknown> = {
        OR: [
          { issuedById: userId }, // Certificates issued by the user
          { recipientId: userId }, // Certificates received by the user
        ],
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.templateId) {
        where.templateId = filters.templateId;
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
              email: true,
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
        take: filters?.limit,
        skip: filters?.offset,
        orderBy: { createdAt: "desc" },
      });

      return certificates.map((cert) => ({
        id: cert.id,
        templateName: cert.template.name,
        recipientName:
          `${cert.recipientFirstName} ${cert.recipientLastName}`.trim(),
        organizationId: cert.organizationId,
        issueDate: cert.issueDate.toISOString(),
        expiryDate: cert.expiryDate?.toISOString(),
        issuerName: `${cert.issuer.firstName} ${cert.issuer.lastName}`.trim(),
        status: cert.status as any,
        securityData: cert.securityMetadata as any,
        verificationUrl: this.generateVerificationUrl(cert.id),
        qrCode: cert.qrCodeData,
        customFields: cert.certificateData as any,
        metadata: {
          createdAt: cert.createdAt.toISOString(),
          lastModified: cert.updatedAt.toISOString(),
          version: "1.0",
          securityLevel: cert.securityLevel,
          blockchainHash: cert.blockchainHash ?? undefined,
        },
      }));
    } catch (error) {
      console.error("Error getting user certificates:", error);
      throw error;
    }
  }

  /**
   * Get certificate analytics
   */
  async getCertificateAnalytics(organizationId?: string) {
    try {
      const where = organizationId ? { organizationId } : {};

      const [total, byTemplateRaw, byStatus, bySecurityLevel, recent] =
        await Promise.all([
          prisma.certificate.count({ where }),

          prisma.certificate.groupBy({
            by: ["templateId"],
            where,
            _count: { id: true },
          }),

          prisma.certificate.groupBy({
            by: ["status"],
            where,
            _count: { id: true },
          }),

          prisma.certificate.groupBy({
            by: ["securityLevel"],
            where,
            _count: { id: true },
          }),

          prisma.certificate.findMany({
            where,
            include: {
              template: true,
              issuer: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
        ]);

      // Get template names for the byTemplate result
      const templateIds = byTemplateRaw.map((item) => item.templateId);
      const templates = await prisma.certificateTemplate.findMany({
        where: { id: { in: templateIds } },
        select: { id: true, name: true },
      });

      const templateNameMap = templates.reduce((acc, template) => {
        acc[template.id] = template.name;
        return acc;
      }, {} as Record<string, string>);

      return {
        total,
        byTemplate: byTemplateRaw.reduce((acc, item) => {
          const templateName =
            templateNameMap[item.templateId] || item.templateId;
          acc[templateName] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        bySecurityLevel: bySecurityLevel.reduce((acc, item) => {
          acc[item.securityLevel] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentIssued: recent.map((cert) => ({
          id: cert.id,
          templateName: cert.template.name,
          recipientName:
            `${cert.recipientFirstName} ${cert.recipientLastName}`.trim(),
          issueDate: cert.issueDate.toISOString(),
          issuerName: `${cert.issuer.firstName} ${cert.issuer.lastName}`.trim(),
          status: cert.status,
        })),
      };
    } catch (error) {
      console.error("Error getting certificate analytics:", error);
      throw error;
    }
  }

  /**
   * Get organization by ID or slug
   */
  async getOrganization(identifier: string) {
    return await prisma.organization.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });
  }

  /**
   * Get templates with optional filters
   */
  async getTemplates(filters?: {
    organizationId?: string;
    category?: string;
    isActive?: boolean;
  }) {
    return await prisma.certificateTemplate.findMany({
      where: {
        ...(filters?.organizationId && {
          organizationId: filters.organizationId,
        }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new template
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    category?: string;
    templateData: Record<string, unknown>;
    organizationId?: string;
    createdById: string;
  }) {
    // Generate type code from name
    const typeCode = this.generateTypeCode(data.name);

    return await prisma.certificateTemplate.create({
      data: {
        name: data.name,
        description: data.description || "",
        category: data.category || "other",
        typeCode,
        templateData: JSON.parse(JSON.stringify(data.templateData)),
        organizationId: data.organizationId,
        createdBy: data.createdById,
      },
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string) {
    return await prisma.certificateTemplate.findUnique({
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
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      templateData?: Record<string, unknown>;
      isActive?: boolean;
    }
  ) {
    // If name is being updated, regenerate type code
    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
      updateData.typeCode = this.generateTypeCode(data.name);
    }

    return await prisma.certificateTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    // Check if template has any issued certificates
    const certificateCount = await prisma.certificate.count({
      where: { templateId: id },
    });

    if (certificateCount > 0) {
      throw new Error(
        "Cannot delete template that has issued certificates. Set to inactive instead."
      );
    }

    return await prisma.certificateTemplate.delete({
      where: { id },
    });
  }

  /**
   * Generate type code from template name
   */
  private generateTypeCode(name: string): string {
    const nameUpper = name.toUpperCase();

    if (nameUpper.includes("APPRECIATION")) return "APP";
    if (nameUpper.includes("EXCELLENCE")) return "EXC";
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
  }

  /**
   * Helper methods
   */
  private generateVerificationUrl(certificateId: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return `${baseUrl}/verify-certificate?id=${certificateId}`;
  }

  private getTypeCodeFromTemplate(templateName: string): string {
    const nameUpper = templateName.toUpperCase();
    if (nameUpper.includes("APPRECIATION")) return "APP";
    if (nameUpper.includes("EXCELLENCE")) return "EXC";
    if (nameUpper.includes("LEADERSHIP")) return "LED";
    if (nameUpper.includes("SERVICE") || nameUpper.includes("FAITHFUL"))
      return "SRV";
    if (nameUpper.includes("VOLUNTEER")) return "VOL";
    if (nameUpper.includes("MISSION")) return "MSN";
    if (nameUpper.includes("BAPTISM")) return "BAP";
    if (nameUpper.includes("YOUTH")) return "YTH";
    if (nameUpper.includes("EXECUTIVE") || nameUpper.includes("DIRECTOR"))
      return "EXD";
    return "GEN"; // Generic
  }

  private getCategoryFromTemplate(templateName: string): string {
    const nameUpper = templateName.toUpperCase();
    if (nameUpper.includes("BAPTISM")) return "baptism";
    if (nameUpper.includes("MISSION")) return "mission";
    if (nameUpper.includes("VOLUNTEER")) return "volunteer";
    if (nameUpper.includes("LEADERSHIP")) return "leadership";
    if (nameUpper.includes("YOUTH")) return "youth";
    if (nameUpper.includes("EXCELLENCE")) return "excellence";
    if (nameUpper.includes("SERVICE")) return "service";
    return "appreciation";
  }

  private getDefaultSecurityLevel(templateName: string): string {
    const nameUpper = templateName.toUpperCase();
    if (
      nameUpper.includes("EXECUTIVE") ||
      nameUpper.includes("LEADERSHIP") ||
      nameUpper.includes("BAPTISM")
    ) {
      return "HIGH";
    }
    if (
      nameUpper.includes("EXCELLENCE") ||
      nameUpper.includes("MISSION") ||
      nameUpper.includes("YOUTH")
    ) {
      return "STANDARD";
    }
    return "BASIC";
  }

  /**
   * Get all available template IDs and names for selection
   */
  async getTemplateOptions() {
    const templates = await prisma.certificateTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        typeCode: true,
      },
      orderBy: { name: "asc" },
    });

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      typeCode: template.typeCode,
    }));
  }

  /**
   * Get template by ID or slug
   */
  async getTemplateByIdOrSlug(identifier: string) {
    console.log("Searching for template with identifier:", identifier);

    // First try by ID
    let template = await prisma.certificateTemplate.findUnique({
      where: { id: identifier },
    });
    console.log("Try 1 - By ID:", !!template);

    // If not found, try by exact name match
    if (!template) {
      template = await prisma.certificateTemplate.findFirst({
        where: { name: identifier },
      });
      console.log("Try 2 - By name:", !!template);
    }

    // If not found, try by generating ID from the passed identifier (name -> slug)
    if (!template) {
      const generatedId = this.generateTemplateId(identifier);
      console.log("Try 3 - Generated ID from identifier:", generatedId);
      template = await prisma.certificateTemplate.findUnique({
        where: { id: generatedId },
      });
      console.log("Try 3 - By generated ID:", !!template);
    }

    // If still not found, try by generating ID from existing template names (for backwards compatibility)
    if (!template) {
      const templates = await prisma.certificateTemplate.findMany();
      console.log(
        "Try 4 - Available templates:",
        templates.map((t) => ({ id: t.id, name: t.name }))
      );
      template =
        templates.find((t) => this.generateTemplateId(t.name) === identifier) ||
        null;
      console.log("Try 4 - By backwards compatibility:", !!template);
    }

    console.log("Final template found:", !!template, template?.name);
    return template;
  }

  /**
   * Get count of certificates for a specific template
   */
  async getCertificateCountByTemplate(templateName: string): Promise<number> {
    return await prisma.certificate.count({
      where: {
        template: {
          name: templateName,
        },
      },
    });
  }

  /**
   * Get the count of certificate templates in the database
   */
  async getTemplateCount(): Promise<number> {
    try {
      return await prisma.certificateTemplate.count();
    } catch (error) {
      console.error("Error getting template count:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const dbCertificateService = new DatabaseCertificateService();

// Helper functions for easy access
export async function issueCertificateToDatabase(
  request: CertificateRequest & { recipientEmail?: string; issuedById: string },
  fullTemplateDesignData: Prisma.JsonObject
): Promise<CompleteCertificate> {
  return dbCertificateService.issueCertificate(request, fullTemplateDesignData);
}

export async function getCertificateFromDatabase(
  id: string
): Promise<CompleteCertificate | null> {
  return dbCertificateService.getCertificate(id);
}

export async function verifyCertificateInDatabase(
  id: string,
  signature?: string,
  verificationMethod?: string,
  verifierIp?: string
) {
  return dbCertificateService.verifyCertificate(
    id,
    signature,
    verificationMethod,
    verifierIp
  );
}
