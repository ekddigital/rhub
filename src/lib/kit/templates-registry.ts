/**
 * Interchangeable template / output catalog for the Creative Workspace API.
 * Single registry — UI hub, dropdown, and GET /api/v1/kit/templates read from here (DRY).
 */

export type KitTemplateCategory =
  | "flyer"
  | "brochure"
  | "certificate"
  | "booklet"
  | "letter"
  | "document"
  | "conversion";

export type KitOutputFormat =
  | "pdf"
  | "png"
  | "jpg"
  | "webp"
  | "svg"
  | "docx"
  | "html"
  | "txt"
  | "print";

export interface KitTemplateDefinition {
  /** Short id, stable for API clients */
  id: string;
  category: KitTemplateCategory;
  title: string;
  description: string;
  outputs: KitOutputFormat[];
  /** Where implementation lives — feature areas in this repo (not legacy vendor names). */
  implementation:
    | "rhub-conf"
    | "rhub-doc"
    | "rhub-img"
    | "creative-certificates"
    | "creative-documents"
    | "creative-flyers"
    | "planned";
  /** In-app path when applicable */
  workspacePath?: string;
  status: "live" | "beta" | "planned";
}

export const kitTemplates: KitTemplateDefinition[] = [
  {
    id: "conf-flyer-studio",
    category: "flyer",
    title: "Conference flyer studio",
    description: "LSUIC-style flyers; org tokens via conf letterhead + brand kit",
    outputs: ["png", "pdf", "print"],
    implementation: "rhub-conf",
    workspacePath: "/tools/kit?template=conf-flyer-studio",
    status: "live",
  },
  {
    id: "conf-booklet",
    category: "booklet",
    title: "Conference booklet",
    description: "Multi-page print layout, delegates & committee",
    outputs: ["pdf", "print"],
    implementation: "rhub-conf",
    workspacePath: "/tools/conf/booklet",
    status: "live",
  },
  {
    id: "conf-letters",
    category: "letter",
    title: "Letters & A4 composition",
    description: "Fundraising, payment, budget letters with letterhead",
    outputs: ["pdf", "print", "html"],
    implementation: "rhub-conf",
    workspacePath: "/tools/conf/letters",
    status: "live",
  },
  {
    id: "doc-converters",
    category: "conversion",
    title: "Document converters",
    description: "PDF ↔ Word, text extract, HTML — LibreOffice-backed",
    outputs: ["pdf", "docx", "html", "txt"],
    implementation: "rhub-doc",
    workspacePath: "/tools/doc",
    status: "live",
  },
  {
    id: "img-converters",
    category: "conversion",
    title: "Image converters",
    description: "SVG, PNG, WebP, etc.",
    outputs: ["png", "jpg", "webp", "svg"],
    implementation: "rhub-img",
    workspacePath: "/tools/img",
    status: "live",
  },
  {
    id: "ekd-flyer-builder",
    category: "flyer",
    title: "Brand flyer builder",
    description:
      "Layered templates, export PNG/JPG — components/creative/flyers; assets via EKD Digital API",
    outputs: ["png", "jpg"],
    implementation: "creative-flyers",
    status: "beta",
  },
  {
    id: "ekd-document-studio",
    category: "document",
    title: "Document studio (AST)",
    description:
      "DocumentModel, DOCX export, letterhead — lib/creative/documents + components/creative/documents",
    outputs: ["docx", "pdf", "html"],
    implementation: "creative-documents",
    status: "beta",
  },
  {
    id: "credia-degree-pdf",
    category: "certificate",
    title: "Credential PDF (React-PDF)",
    description:
      "Degree / diploma / high-school — lib/creative/certificates + components/creative/certificates/react-pdf-templates",
    outputs: ["pdf"],
    implementation: "creative-certificates",
    status: "beta",
  },
  {
    id: "fom-certificate-builder",
    category: "certificate",
    title: "Certificate template builder",
    description:
      "Canvas builder + issue patterns — certificates/template-builder, certificates/html-export",
    outputs: ["pdf", "png", "html"],
    implementation: "creative-certificates",
    workspacePath: "/tools/kit/crt",
    status: "planned",
  },
  {
    id: "brand-brochure",
    category: "brochure",
    title: "Tri-fold brochure",
    description: "Print-first brochure; align with ekddigital brochure content",
    outputs: ["pdf", "print"],
    implementation: "planned",
    workspacePath: "/tools/kit/bro",
    status: "planned",
  },
];

export function getKitTemplates(filters?: {
  category?: KitTemplateCategory;
  status?: KitTemplateDefinition["status"];
}): KitTemplateDefinition[] {
  if (!filters) return kitTemplates;
  return kitTemplates.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.status && t.status !== filters.status) return false;
    return true;
  });
}
