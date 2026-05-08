// LaTeX Tools Configuration
// Modeled after image converter tools-config.ts

export interface LaTeXTool {
  slug: string;
  name: string;
  description: string;
  category: "conversion" | "utility";
  inputFormat: string[];
  outputFormat: string[];
  supportedJournals: string[];
  features: string[];
  icon: string;
}

export const latexTools: Record<string, LaTeXTool> = {
  "latex-to-word": {
    slug: "latex-to-word",
    name: "LaTeX to Word Converter",
    description:
      "Convert LaTeX projects to DOCX or ODT with journal-aware templates and quality profiles",
    category: "conversion",
    inputFormat: ["tex", "latex", "zip"],
    outputFormat: ["docx", "odt"],
    supportedJournals: [
      "Elsevier (elsarticle) - CMIG, KBS, MIA, NeuroC",
      "Elsevier CMIG profile - Computerized Medical Imaging and Graphics",
      "Springer Nature (sn-jnl) - AIR, Nature, Basic, APA, Chicago",
      "IEEE (IEEEtran, ieeecolor) - Transactions, TMI",
      "ACM (acmart) - Conferences, Journals",
      "University of Jinan thesis (ujn_thesis)",
      "Zhejiang Sci-Tech University thesis (zstu_thesis)",
      "Generic article class",
    ],
    features: [
      "DOCX and ODT output options",
      "Automatic journal type detection",
      "Manual journal override option",
      "Thesis template auto-detection (UJN, ZSTU)",
      "Elsevier CMIG specific profile",
      "Automatic default cover/logo asset injection for thesis templates",
      "Quality profile selection (Basic, Standard, Professional, Publication)",
      "ZIP file upload support",
      "Preserves bibliography formatting",
      "High-quality figure conversion",
      "Table formatting preservation",
      "Metadata preservation",
    ],
    icon: "FileText",
  },
  "word-to-latex": {
    slug: "word-to-latex",
    name: "Word to LaTeX Converter",
    description: "Convert DOCX, DOC, and ODT documents to LaTeX (.tex)",
    category: "conversion",
    inputFormat: ["docx", "doc", "odt"],
    outputFormat: ["tex", "latex"],
    supportedJournals: [
      "Elsevier template",
      "Springer Nature template",
      "IEEE template",
      "ACM template",
      "Generic article template",
    ],
    features: [
      "DOCX/ODT direct conversion via Pandoc",
      "Legacy DOC support with remote pre-conversion",
      "LaTeX output with media extraction",
      "Quality profile selection",
      "Preserves structure and sectioning",
      "Conversion diagnostics and warning reporting",
    ],
    icon: "FileCode",
  },
};

export const getLatexTool = (slug: string): LaTeXTool | undefined => {
  return latexTools[slug];
};

export const getAllLatexTools = (): LaTeXTool[] => {
  return Object.values(latexTools);
};

export const getLatexToolByCategory = (
  category: "conversion" | "utility",
): LaTeXTool[] => {
  return Object.values(latexTools).filter((tool) => tool.category === category);
};

// Supported file extensions
export const supportedInputExtensions = [
  ".tex",
  ".latex",
  ".zip",
  ".docx",
  ".doc",
  ".odt",
] as const;
export const supportedOutputExtensions = [".docx", ".odt", ".tex"] as const;

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB

// Conversion timeout (in milliseconds)
export const CONVERSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
