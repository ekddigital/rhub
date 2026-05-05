import { db } from "@/lib/db";
import type { Prisma, certificate_templates_type } from "@prisma/client";
import { ALL_CERTIFICATE_TEMPLATES } from "./templates";
import type {
  CertificateTemplate as TemplateDefinition,
  CertificateElement,
} from "./templates/types";
import { randomUUID } from "crypto";
import { Role } from "@/lib/constants/enums";

type OrganizationSeed = {
  name: string;
  slug: string;
  description: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
};

type TemplateElementPayload = {
  type: CertificateElement["type"];
  content: string;
  position: CertificateElement["position"];
  style: CertificateElement["style"];
};

// Default organizations - inspired by legacy system
const defaultOrganizations: OrganizationSeed[] = [
  {
    name: "FISHERS OF MEN",
    slug: "fom",
    description: "Bringing Jesus to the World",
    website: "https://fishersofmen.org",
    email: "certificates@fishersofmen.org",
    phone: "+1 (555) 123-4567",
    address: "123 Ministry Street, Faith City, FC 12345",
    logo: "/Logo.png",
  },
  {
    name: "EKD Digital",
    slug: "ekd-digital",
    description: "Professional digital services and technology solutions",
    website: "https://ekddigital.com",
    email: "certificates@ekddigital.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Street, Digital City, DC 12345",
    logo: "/logo.png",
  },
  {
    name: "Tech Academy",
    slug: "tech-academy",
    description: "Leading technology education and training institute",
    website: "https://techacademy.edu",
    email: "certificates@techacademy.edu",
    phone: "+1 (555) 987-6543",
    address: "456 Education Ave, Learning City, LC 67890",
  },
];

// Convert template structure to our database format
function convertTemplateToDbFormat(
  template: TemplateDefinition,
  createdById: string,
): Prisma.certificate_templatesUncheckedCreateInput {
  // Map template categories to valid certificate type string literals
  const categoryMapping: Record<string, string> = {
    appreciation: "APPRECIATION",
    completion: "COMPLETION",
    achievement: "ACHIEVEMENT",
    participation: "PARTICIPATION",
    excellence: "EXCELLENCE",
    service: "SERVICE",
    recognition: "RECOGNITION",
  };

  const normalizedCategory = template.category?.toLowerCase() || "";
  const certificateType = categoryMapping[normalizedCategory] || "RECOGNITION";

  const elementMap = template.elements.reduce<
    Record<string, TemplateElementPayload>
  >((acc, element) => {
    acc[element.id] = {
      type: element.type,
      content: element.content,
      position: element.position,
      style: element.style,
    };
    return acc;
  }, {});

  const templateData: Prisma.InputJsonObject = {
    pageSettings: template.pageSettings || {
      width: 800,
      height: 600,
      orientation: "landscape",
      backgroundColor: "#ffffff",
    },
    elements: elementMap,
  };

  return {
    id: randomUUID(),
    name: template.name,
    slug: template.id,
    description: template.description,
    type: certificateType as certificate_templates_type,
    status: "ACTIVE",
    isDefault: true,
    createdById,
    templateData,
    updatedAt: new Date(),
  };
}

// Convert organized templates to our format
// const defaultTemplates = ALL_CERTIFICATE_TEMPLATES.map(convertTemplateToDbFormat);

/**
 * Seeds the database with default organizations and certificate templates
 */
export async function seedCertificates() {
  try {
    console.log("🌱 Starting certificate seeding...");

    // Create organizations first
    console.log("📁 Creating organizations...");
    let organizationsProcessed = 0;

    for (const org of defaultOrganizations) {
      const existingOrg = await db.organizations.findUnique({
        where: { slug: org.slug },
      });

      if (!existingOrg) {
        await db.organizations.create({
          data: {
            ...org,
            id: randomUUID(),
            updatedAt: new Date(),
          },
        });
        organizationsProcessed += 1;
        console.log(`✅ Created organization: ${org.name}`);
      } else {
        console.log(`⏭️  Organization already exists: ${org.name}`);
        organizationsProcessed += 1;
      }
    }

    // Get system user for creating templates
    const systemUser = await db.user.findFirst({
      where: {
        OR: [
          { email: "system@ekddigital.com" },
          { email: "admin@ekddigital.com" },
          { role: Role.ADMIN },
        ],
      },
    });

    if (!systemUser) {
      throw new Error(
        "No admin user found to create templates. Please ensure an admin user exists.",
      );
    }

    // Convert templates to database format
    const defaultTemplates = ALL_CERTIFICATE_TEMPLATES.map((template) =>
      convertTemplateToDbFormat(template, systemUser.id),
    );

    // Create templates
    console.log("📜 Creating certificate templates...");
    let templatesProcessed = 0;

    for (const template of defaultTemplates) {
      const existingTemplate = await db.certificate_templates.findUnique({
        where: { slug: template.slug },
      });

      if (!existingTemplate) {
        await db.certificate_templates.create({
          data: template,
        });
        templatesProcessed += 1;
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`);
        templatesProcessed += 1;
      }
    }

    console.log("🎉 Certificate seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - ${organizationsProcessed} organizations processed`);
    console.log(`   - ${templatesProcessed} templates processed`);

    return {
      success: true,
      organizations: organizationsProcessed,
      templates: templatesProcessed,
    };
  } catch (error) {
    console.error("❌ Error seeding certificates:", error);
    throw error;
  }
}

/**
 * Clears all certificate templates and organizations from the database
 */
export async function clearCertificates() {
  try {
    console.log("🗑️  Clearing certificate data...");

    await db.certificate_templates.deleteMany({
      where: { isDefault: true },
    });
    console.log("✅ Cleared certificate templates");

    await db.organizations.deleteMany({
      where: {
        slug: {
          in: defaultOrganizations.map((org) => org.slug),
        },
      },
    });
    console.log("✅ Cleared organizations");

    console.log("🎉 Certificate data cleared successfully!");

    return { success: true };
  } catch (error) {
    console.error("❌ Error clearing certificates:", error);
    throw error;
  }
}

/**
 * Re-seeds the database (clears and re-creates all data)
 */
export async function reseedCertificates() {
  try {
    console.log("♻️  Re-seeding certificate data...");

    await clearCertificates();
    const result = await seedCertificates();

    console.log("🎉 Re-seeding completed successfully!");
    return result;
  } catch (error) {
    console.error("❌ Error re-seeding certificates:", error);
    throw error;
  }
}

// For backward compatibility
export { seedCertificates as initializeCertificates };
