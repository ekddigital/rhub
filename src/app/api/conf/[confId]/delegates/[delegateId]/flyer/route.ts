import { prisma } from "@/lib/prisma";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// GET /api/conf/[confId]/delegates/[delegateId]/flyer
export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ confId: string; delegateId: string }>;
  },
) {
  try {
    const { confId, delegateId } = await params;

    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
      select: {
        id: true,
        confId: true,
        name: true,
        city: true,
        university: true,
        delegateCode: true,
        bookletPhotoPath: true,
        feePaid: true,
        flyerIssuedAt: true,
      },
    });

    if (!delegate || delegate.confId !== confId) {
      return new Response(JSON.stringify({ error: "Delegate not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (!delegate.feePaid || !delegate.bookletPhotoPath) {
      return new Response(
        JSON.stringify({
          error:
            "Flyer is available only after fee confirmation and booklet photo upload",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const origin = new URL(req.url).origin;
    const photoUrl = resolveStoredAssetUrl(delegate.bookletPhotoPath, origin);
    const logoUrl = `${origin}/conf/lsuic_logo.png`;
    const confTag = "LSUIC 2026";

    const name = escapeXml(delegate.name);
    const city = escapeXml(delegate.city || "China");
    const university = escapeXml(delegate.university || "LSUIC Delegate");
    const code = escapeXml(delegate.delegateCode || "PENDING-CODE");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B4FD9"/>
      <stop offset="60%" stop-color="#1572FF"/>
      <stop offset="100%" stop-color="#0A2C8B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#DCEBFF" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#081C5F" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="1080" height="1350" fill="url(#bg)"/>
  <circle cx="120" cy="160" r="200" fill="#4FB2FF" fill-opacity="0.22"/>
  <circle cx="940" cy="1220" r="250" fill="#7BD8FF" fill-opacity="0.16"/>

  <rect x="88" y="86" width="904" height="1178" rx="44" fill="url(#accent)" filter="url(#shadow)"/>

  <rect x="128" y="130" width="280" height="86" rx="24" fill="#EAF3FF"/>
  <text x="268" y="188" text-anchor="middle" font-size="56" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#2B74D8">#LSUIC</text>
  <rect x="716" y="130" width="236" height="86" rx="24" fill="#EAF3FF"/>
  <image href="${escapeXml(logoUrl)}" x="736" y="142" width="196" height="62" preserveAspectRatio="xMidYMid meet"/>

  <text x="540" y="286" text-anchor="middle" font-size="62" font-family="Segoe UI, Arial, sans-serif" font-weight="800" fill="#A01010">I Will Be At</text>
  <text x="540" y="358" text-anchor="middle" font-size="84" font-family="Segoe UI, Arial, sans-serif" font-weight="900" fill="#091F7A">${confTag}</text>

  <rect x="166" y="400" width="748" height="620" rx="42" fill="#FFFFFF" stroke="#6CA8FF" stroke-width="10"/>
  <image href="${escapeXml(photoUrl)}" x="208" y="456" width="664" height="500" preserveAspectRatio="xMidYMid slice"/>

  <text x="540" y="1072" text-anchor="middle" font-size="62" font-family="Segoe UI, Arial, sans-serif" font-weight="800" fill="#1A65D8">${name}</text>
  <text x="540" y="1120" text-anchor="middle" font-size="34" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#36456B">${university}</text>
  <text x="540" y="1160" text-anchor="middle" font-size="30" font-family="Segoe UI, Arial, sans-serif" fill="#3A4A70">${city}  •  ${code}</text>

  <rect x="130" y="1196" width="820" height="48" rx="18" fill="#9B1111"/>
  <text x="540" y="1230" text-anchor="middle" font-size="28" font-family="Segoe UI, Arial, sans-serif" fill="#FFFFFF">Website: https://www.lsuic.org  •  Email: info@lsuic.org</text>

  <rect x="154" y="1248" width="772" height="58" rx="18" fill="#0B1E78"/>
  <text x="540" y="1288" text-anchor="middle" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#BFD8FF">Motto: Excellence Through Hard Work</text>
</svg>`;

    if (!delegate.flyerIssuedAt) {
      await prisma.confDelegate.update({
        where: { id: delegate.id },
        data: {
          flyerReady: true,
          flyerIssuedAt: new Date(),
        },
      });
    }

    const safeCode = (delegate.delegateCode || "delegate").replace(
      /[^A-Za-z0-9-]/g,
      "",
    );
    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": `inline; filename=\"${safeCode}-flyer.svg\"`,
      },
    });
  } catch (error) {
    console.error("Failed to build delegate flyer:", error);
    return new Response(JSON.stringify({ error: "Failed to generate flyer" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
