import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://rhub.ekddigital.com";

function buildShortUrl(shortCode: string, customSlug: string | null) {
  return `${BASE_URL}/s/${customSlug ?? shortCode}`;
}

function formatLink(link: {
  id: string;
  originalUrl: string;
  shortCode: string;
  customSlug: string | null;
  clicks: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  lastClickAt: Date | null;
}) {
  return {
    id: link.id,
    originalUrl: link.originalUrl,
    shortUrl: buildShortUrl(link.shortCode, link.customSlug),
    shortCode: link.shortCode,
    customSlug: link.customSlug,
    clicks: link.clicks,
    isActive: link.isActive,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    expiresAt: link.expiresAt,
    lastClickAt: link.lastClickAt,
  };
}

const shortenSchema = z.object({
  url: z.string().url({ message: "Please provide a valid URL" }),
  customSlug: z
    .string()
    .min(3, { message: "Custom slug must be at least 3 characters" })
    .max(50, { message: "Custom slug must be at most 50 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Custom slug can only contain letters, numbers, hyphens, and underscores",
    })
    .optional(),
  expiresIn: z.number().positive().optional(), // Days until expiration
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = shortenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const { url, customSlug, expiresIn } = validation.data;

    // Check if custom slug is already taken
    if (customSlug) {
      const existing = await prisma.shortUrl.findUnique({
        where: { customSlug },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "This custom slug is already taken. Please choose another.",
          },
          { status: 409 },
        );
      }
    }

    // Generate unique short code
    let shortCode = nanoid(7);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existing = await prisma.shortUrl.findUnique({
        where: { shortCode },
      });

      if (!existing) break;

      shortCode = nanoid(7);
      attempts++;
    }

    if (attempts === maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique short code. Please try again." },
        { status: 500 },
      );
    }

    // Calculate expiration date if provided
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // Create short URL
    const shortUrl = await prisma.shortUrl.create({
      data: {
        originalUrl: url,
        shortCode,
        customSlug: customSlug || null,
        expiresAt,
        metadata: {
          userAgent: request.headers.get("user-agent"),
          createdFrom: "web",
        },
      },
    });

    // Build the short URL
    const shortUrlFull = buildShortUrl(shortCode, customSlug ?? null);

    return NextResponse.json({
      success: true,
      data: {
        id: shortUrl.id,
        originalUrl: shortUrl.originalUrl,
        shortUrl: shortUrlFull,
        shortCode: shortUrl.shortCode,
        customSlug: shortUrl.customSlug,
        createdAt: shortUrl.createdAt,
        expiresAt: shortUrl.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { error: "Failed to create short URL. Please try again." },
      { status: 500 },
    );
  }
}

// GET — list all links (no params) OR stats for a single link (?code=...)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // ── Single-link stats ──────────────────────────────────────────────────
    if (code) {
      const shortUrl = await prisma.shortUrl.findFirst({
        where: {
          OR: [{ shortCode: code }, { customSlug: code }],
          isActive: true,
        },
      });

      if (!shortUrl) {
        return NextResponse.json(
          { error: "Short URL not found" },
          { status: 404 },
        );
      }

      if (shortUrl.expiresAt && shortUrl.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "This short URL has expired" },
          { status: 410 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: shortUrl.id,
          originalUrl: shortUrl.originalUrl,
          shortCode: shortUrl.shortCode,
          customSlug: shortUrl.customSlug,
          clicks: shortUrl.clicks,
          createdAt: shortUrl.createdAt,
          lastClickAt: shortUrl.lastClickAt,
          expiresAt: shortUrl.expiresAt,
        },
      });
    }

    // ── List all links ─────────────────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "50")),
    );
    const search = searchParams.get("search")?.trim() ?? "";

    const where = search
      ? {
          OR: [
            { originalUrl: { contains: search } },
            { shortCode: { contains: search } },
            { customSlug: { contains: search } },
          ],
        }
      : {};

    const [total, links] = await Promise.all([
      prisma.shortUrl.count({ where }),
      prisma.shortUrl.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: links.map(formatLink),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching short URL(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch URL data" },
      { status: 500 },
    );
  }
}

// ── Validation schemas for mutations ──────────────────────────────────────────
const updateSchema = z.object({
  id: z.string().min(1),
  customSlug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional()
    .nullable(),
  originalUrl: z.string().url().optional(),
  expiresIn: z.number().positive().optional().nullable(), // days from now; null = remove expiry
  isActive: z.boolean().optional(),
});

// PATCH — update a link's slug, original URL, or expiry
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const { id, customSlug, originalUrl, expiresIn, isActive } =
      validation.data;

    const existing = await prisma.shortUrl.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Slug uniqueness check (excluding self)
    if (
      customSlug !== undefined &&
      customSlug !== null &&
      customSlug !== existing.customSlug
    ) {
      const conflict = await prisma.shortUrl.findFirst({
        where: { customSlug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "This custom slug is already taken." },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.shortUrl.update({
      where: { id },
      data: {
        ...(customSlug !== undefined ? { customSlug } : {}),
        ...(originalUrl !== undefined ? { originalUrl } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(expiresIn !== undefined
          ? {
              expiresAt:
                expiresIn === null
                  ? null
                  : new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
            }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: formatLink(updated) });
  } catch (error) {
    console.error("Error updating short URL:", error);
    return NextResponse.json(
      { error: "Failed to update link." },
      { status: 500 },
    );
  }
}

// DELETE — permanently remove a link
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.shortUrl.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await prisma.shortUrl.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting short URL:", error);
    return NextResponse.json(
      { error: "Failed to delete link." },
      { status: 500 },
    );
  }
}
