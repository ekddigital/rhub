import {
  FileText,
  Link2,
  Image,
  Download,
  Video,
  FileCode,
  FileOutput,
  Gavel,
  CalendarRange,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolConfig {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  category: "converter" | "utility" | "download" | "media";
  group:
    | "img"
    | "ref"
    | "url"
    | "vid"
    | "download"
    | "audio"
    | "docs"
    | "latex"
    | "word"
    | "doc"
    | "dbt"
    | "conf"
    | "kit";
  subcategory?:
    | "reference"
    | "latex"
    | "word"
    | "image"
    | "video"
    | "document"
    | "debate"
    | "conference"
    | "creative";
  status: "live" | "beta" | "coming-soon";
  featured: boolean;
  icon: LucideIcon;
  path: string;
  hasSubTools?: boolean;
  metadata?: Record<string, unknown>;
}

export const TOOLS: ToolConfig[] = [
  // Reference Converter
  {
    slug: "ref",
    title: "Reference Converter",
    tagline: "Transform citation exports into clean BibTeX",
    summary:
      "Convert EndNote XML, RIS, and enriched exports into validated BibTeX entries. Built for academic research.",
    category: "converter",
    group: "ref",
    subcategory: "reference",
    status: "live",
    featured: true,
    icon: FileText,
    path: "/tools/ref",
    metadata: {
      supportedFormats: ["xml", "ris", "enl"],
      outputFormats: ["bibtex", "biblatex"],
    },
  },

  // LaTeX Converters
  {
    slug: "latex",
    title: "LaTeX Converters",
    tagline: "Convert LaTeX documents with journal detection",
    summary:
      "Convert LaTeX to Word with automatic journal detection for Elsevier, IEEE, Springer, and ACM. Preserves formatting, figures, and bibliographies.",
    category: "converter",
    group: "latex",
    subcategory: "latex",
    status: "live",
    featured: true,
    icon: FileCode,
    path: "/tools/latex",
    hasSubTools: true,
    metadata: {
      supportedJournals: ["Elsevier", "IEEE", "Springer Nature", "ACM"],
      inputFormats: [".tex", ".latex", ".zip"],
      outputFormats: ["Word (.docx)"],
      features: [
        "Automatic journal detection",
        "ZIP file support",
        "Recursive asset resolution",
        "Bibliography processing",
      ],
    },
  },

  // URL Shortener
  {
    slug: "url-shortener",
    title: "URL Shortener",
    tagline: "Create short, memorable links",
    summary:
      "Transform long URLs into short, branded links with custom slugs, QR codes, and analytics.",
    category: "utility",
    group: "url",
    status: "live",
    featured: true,
    icon: Link2,
    path: "/tools/s",
    metadata: {
      features: [
        "Custom slugs",
        "QR codes",
        "Click tracking",
        "Link expiration",
      ],
    },
  },

  // Image Converters Hub
  {
    slug: "img",
    title: "Image Converters",
    tagline: "Convert between 8+ image formats",
    summary:
      "Professional image conversion supporting SVG, PNG, JPG, WebP, ICO, GIF, BMP, and TIFF with 25+ conversion routes.",
    category: "converter",
    group: "img",
    status: "live",
    featured: true,
    icon: Image,
    path: "/tools/img",
    metadata: {
      supportedFormats: [
        "svg",
        "png",
        "jpg",
        "webp",
        "ico",
        "gif",
        "bmp",
        "tiff",
      ],
      totalConversions: 25,
      features: ["Batch conversion", "Custom dimensions", "Quality control"],
    },
  },

  // Downloads
  {
    slug: "downloads",
    title: "Downloads",
    tagline: "Access important documents and files",
    summary:
      "Download essential documents, forms, and resources with time-based password protection.",
    category: "download",
    group: "docs",
    status: "live",
    featured: true,
    icon: Download,
    path: "/downloads",
    metadata: {
      features: [
        "Password protection",
        "Time-based access",
        "Download tracking",
      ],
    },
  },

  // Download Hub (multi-platform video/audio)
  {
    slug: "vid",
    title: "Download Hub",
    tagline: "YouTube, Facebook, Instagram, TikTok, X, Vimeo",
    summary:
      "Download videos and audio from multiple platforms in one place, including YouTube, Facebook, Instagram, TikTok, X, and Vimeo.",
    category: "media",
    group: "download",
    subcategory: "video",
    status: "live",
    featured: true,
    icon: Video,
    path: "/tools/vid",
    metadata: {
      supportedSites: [
        "YouTube",
        "Facebook",
        "Instagram",
        "TikTok",
        "Twitter/X",
        "Vimeo",
      ],
      liveSites: [
        "YouTube",
        "Facebook",
        "Instagram",
        "TikTok",
        "Twitter/X",
        "Vimeo",
      ],
      formats: ["MP4", "WebM", "MP3", "M4A"],
      qualities: ["4K", "1080p", "720p", "480p", "360p"],
    },
  },

  // Debate Hub
  {
    slug: "dbt",
    title: "Debate Hub",
    tagline: "Real-time debate scoring & management",
    summary:
      "Full debate event pipeline with criteria-based scoring sheets, multi-judge support, audience voting, and live scoreboards.",
    category: "utility",
    group: "dbt",
    subcategory: "debate",
    status: "live",
    featured: true,
    icon: Gavel,
    path: "/tools/dbt",
    metadata: {
      features: [
        "Criteria-based scoring (4-6 per criteria)",
        "7 speech types with 5 criteria each",
        "Multi-judge support (J1, J2, J3)",
        "Auto-lock scores after 15 seconds",
        "Audience voting",
        "Real-time scoreboard",
      ],
    },
  },

  // Document Converters
  {
    slug: "doc",
    title: "Document Converters",
    tagline: "Convert PDF, Word, and other documents",
    summary:
      "Professional document conversion supporting PDF to Word, Word to PDF, and more. Preserves formatting, images, and tables.",
    category: "converter",
    group: "doc",
    subcategory: "document",
    status: "live",
    featured: true,
    icon: FileOutput,
    path: "/tools/doc",
    hasSubTools: true,
    metadata: {
      supportedFormats: ["pdf", "docx", "doc", "odt", "rtf", "txt", "html"],
      totalConversions: 20,
      features: [
        "PDF to Word",
        "Word to PDF",
        "Formatting preservation",
        "LibreOffice powered",
      ],
    },
  },

  // Conference Management
  {
    slug: "conf",
    title: "Conference Hub",
    tagline: "LSUIC Conference Planning & Management",
    summary:
      "Full conference management system with budget tools, payment tracking, committee management, delegate registration, meeting scheduler, and timeline tracking.",
    category: "utility",
    group: "conf",
    subcategory: "conference",
    status: "live",
    featured: true,
    icon: CalendarRange,
    path: "/tools/conf",
    hasSubTools: true,
    metadata: {
      features: [
        "Budget manager with auto-calculations",
        "Payment tracking with screenshot uploads",
        "Committee member management",
        "Delegate registration & fee tracking",
        "Weekly meeting scheduler",
        "Timeline & milestone tracking",
        "CSV/PDF export",
      ],
    },
  },

  // Creative Kit (org-aware design — flyers, docs, certs)
  {
    slug: "kit",
    title: "Creative Kit",
    tagline: "Org brand kits, flyers, documents & certificates",
    summary:
      "Multi-tenant creative surface: brand colors and assets per organization, with modular routes for flyers, authoring, certificates, and exports. Evolving beyond single-purpose tools toward a cohesive studio.",
    category: "utility",
    group: "kit",
    subcategory: "creative",
    status: "beta",
    featured: true,
    icon: Palette,
    path: "/tools/kit",
    hasSubTools: true,
    metadata: {
      features: [
        "OrganizationBrandKit tokens",
        "Flyers + conference studio integration",
        "Document & conversion stack",
        "Certificate pipelines (lib/creative)",
      ],
    },
  },
];

// Helper functions
export function getToolBySlug(slug: string): ToolConfig | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

export function getToolsByGroup(group: string): ToolConfig[] {
  return TOOLS.filter((tool) => tool.group === group);
}

export function getToolsByCategory(category: string): ToolConfig[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export function getToolsBySubcategory(subcategory: string): ToolConfig[] {
  return TOOLS.filter((tool) => tool.subcategory === subcategory);
}

export function getFeaturedTools(): ToolConfig[] {
  return TOOLS.filter((tool) => tool.featured && tool.status === "live");
}

export function getLiveTools(): ToolConfig[] {
  return TOOLS.filter((tool) => tool.status === "live");
}

export function getConverterTools(): ToolConfig[] {
  return TOOLS.filter(
    (tool) => tool.category === "converter" && tool.status === "live",
  );
}
