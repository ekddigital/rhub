/**
 * Organization service for managing certificate issuing organizations
 */
import crypto from "crypto";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getOrganizations(params?: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    const where: Prisma.organizationsWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      db.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              certificate_templates: true,
              certificates: true,
            },
          },
        },
      }),
      db.organizations.count({ where }),
    ]);

    return {
      organizations: organizations.map((org) => ({
        ...org,
        templateCount: org._count.certificate_templates,
        certificateCount: org._count.certificates,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw new Error("Failed to fetch organizations");
  }
}

export async function getOrganizationById(id: string) {
  try {
    const organization = await db.organizations.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            certificate_templates: true,
            certificates: true,
          },
        },
      },
    });

    if (!organization) {
      return null;
    }

    return {
      ...organization,
      templateCount: organization._count.certificate_templates,
      certificateCount: organization._count.certificates,
    };
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw new Error("Failed to fetch organization");
  }
}

export async function createOrganization(data: {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  try {
    // Generate unique slug
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (await db.organizations.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const organization = await db.organizations.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        slug,
        description: data.description,
        logo: data.logo,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        updatedAt: new Date(),
      },
    });

    return organization;
  } catch (error) {
    console.error("Error creating organization:", error);
    throw new Error("Failed to create organization");
  }
}

export async function updateOrganization(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    logo: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    isActive: boolean;
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
        await db.organizations.findFirst({
          where: { slug, NOT: { id } },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData = { ...updateData, slug };
    }

    const organization = await db.organizations.update({
      where: { id },
      data: updateData,
    });

    return organization;
  } catch (error) {
    console.error("Error updating organization:", error);
    throw new Error("Failed to update organization");
  }
}

export async function deleteOrganization(id: string) {
  try {
    // Check if organization has certificates or templates
    const [certificateCount, templateCount] = await Promise.all([
      db.certificates.count({ where: { organizationId: id } }),
      db.certificate_templates.count({ where: { organizationId: id } }),
    ]);

    if (certificateCount > 0 || templateCount > 0) {
      throw new Error(
        "Cannot delete organization with existing certificates or templates",
      );
    }

    await db.organizations.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    throw new Error("Failed to delete organization");
  }
}
