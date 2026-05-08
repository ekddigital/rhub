// LaTeX to Word Conversion Types
// Based on reference projects: conversion_ref, ekd_papers_ref, meddef_latex_ref

export type JournalType =
  | "ELSEVIER"
  | "ELSEVIER_CMIG"
  | "SPRINGER_NATURE"
  | "ACM"
  | "IEEE"
  | "UJN_THESIS"
  | "ZSTU_THESIS"
  | "GENERIC";

export type DocumentClass =
  | "elsarticle" // Elsevier journals (CMIG, KBS, MIA, NeuroC)
  | "sn-jnl" // Springer Nature journals
  | "acmart" // ACM journals
  | "IEEEtran" // IEEE Transactions
  | "ieeecolor" // IEEE TMI and colorized journals
  | "ujn_thesis" // University of Jinan thesis template
  | "zstu_thesis" // Zhejiang Sci-Tech University thesis template
  | "article" // Generic article
  | "unknown";

export type LatexToWordOutputFormat = "docx" | "odt";

export type WordInputFormat = "docx" | "odt" | "doc";

export type WordToLatexOutputFormat = "tex" | "latex";

export type LatexConversionQuality =
  | "basic"
  | "standard"
  | "professional"
  | "publication";

export interface JournalDetectionResult {
  journalType: JournalType;
  documentClass: DocumentClass;
  confidence: number; // 0-100
  detectedPatterns: string[];
  classOptions: string[];
  bibStyle?: string;
  requiresLogo: boolean;
  logoName?: string;
}

export interface LaTeXDocument {
  mainTexFile: string;
  documentClass: DocumentClass;
  classOptions: string[];
  packages: string[];
  bibFiles: string[];
  figureFiles: string[];
  sections: string[];
  hasAbstract: boolean;
  hasKeywords: boolean;
  authorCount: number;
}

export interface ConversionOptions {
  journalId?: string;
  manualOverride: boolean;
  preserveFonts: boolean;
  preserveFormatting: boolean;
  includeBibliography: boolean;
  outputFormat: LatexToWordOutputFormat;
  qualityLevel: LatexConversionQuality;
}

export interface ConversionResult {
  success: boolean;
  outputFile?: string;
  outputFormat?: string;
  outputSize?: number;
  detectedJournal?: string;
  documentClass?: string;
  bibEntryCount?: number;
  figureCount?: number;
  tableCount?: number;
  warningCount?: number;
  errorMessage?: string;
  warnings?: string[];
  durationMs: number;
}

// Journal-specific patterns for auto-detection
export const JOURNAL_PATTERNS = {
  ELSEVIER: {
    documentClass: ["elsarticle", "cas-sc", "cas-dc"],
    commands: [
      "\\journal{",
      "\\ead{",
      "\\address[",
      "\\fntext[",
      "\\begin{frontmatter}",
    ],
    confidence: {
      documentClass: 50,
      commands: {
        "\\journal{": 20,
        "\\ead{": 15,
        "\\address[": 15,
        "\\fntext[": 10,
        "\\begin{frontmatter}": 10,
      },
    },
  },
  ELSEVIER_CMIG: {
    documentClass: ["elsarticle"],
    commands: [
      "\\journal{Computerized Medical Imaging and Graphics}",
      "Computerized Medical Imaging and Graphics",
      "\\begin{frontmatter}",
    ],
    confidence: {
      documentClass: 35,
      commands: {
        "\\journal{Computerized Medical Imaging and Graphics}": 45,
        "Computerized Medical Imaging and Graphics": 30,
        "\\begin{frontmatter}": 10,
      },
    },
  },
  SPRINGER_NATURE: {
    documentClass: ["sn-jnl"],
    commands: [
      "\\journalname",
      "\\title[",
      "\\author[",
      "\\affil[",
      "\\email{",
    ],
    classOptions: [
      "sn-mathphys-num",
      "sn-nature",
      "sn-basic",
      "sn-aps",
      "sn-vancouver",
      "sn-apa",
      "sn-chicago",
    ],
    confidence: {
      documentClass: 50,
      commands: {
        "\\journalname": 20,
        "\\title[": 15,
        "\\author[": 15,
        "\\affil[": 10,
        "\\email{": 10,
      },
    },
  },
  IEEE: {
    documentClass: ["IEEEtran", "ieeecolor"],
    commands: [
      "\\IEEEtitle",
      "\\IEEEauthor",
      "\\IEEEkeywords",
      "\\thanks{",
      "\\journalname",
    ],
    packages: ["ieeetran", "tmi"],
    confidence: {
      documentClass: 50,
      commands: {
        "\\IEEEtitle": 20,
        "\\IEEEauthor": 15,
        "\\IEEEkeywords": 15,
        "\\thanks{": 10,
        "\\journalname": 10,
      },
    },
  },
  ACM: {
    documentClass: ["acmart"],
    commands: [
      "\\acmConference",
      "\\acmYear",
      "\\acmDOI",
      "\\setcopyright",
      "\\ccsdesc",
    ],
    confidence: {
      documentClass: 50,
      commands: {
        "\\acmConference": 20,
        "\\acmYear": 15,
        "\\setcopyright": 15,
        "\\ccsdesc": 10,
      },
    },
  },
  UJN_THESIS: {
    documentClass: ["ujn_thesis"],
    commands: [
      "\\classificationnum{",
      "\\degreelevel{",
      "\\makecover",
      "\\makeenglishtitlepage",
      "\\makeintegritydeclaration",
      "\\makereference",
      "\\makeendpage",
    ],
    confidence: {
      documentClass: 70,
      commands: {
        "\\classificationnum{": 20,
        "\\degreelevel{": 20,
        "\\makecover": 10,
        "\\makeenglishtitlepage": 20,
        "\\makeintegritydeclaration": 10,
        "\\makereference": 10,
        "\\makeendpage": 10,
      },
    },
  },
  ZSTU_THESIS: {
    documentClass: ["zstu_thesis"],
    commands: [
      "\\coverchineselines{",
      "\\coverenglishlines{",
      "\\category{",
      "\\makecover",
      "\\makeintegritydeclaration",
      "\\makereference",
      "\\makeendpage",
    ],
    confidence: {
      documentClass: 70,
      commands: {
        "\\coverchineselines{": 20,
        "\\coverenglishlines{": 20,
        "\\category{": 15,
        "\\makecover": 10,
        "\\makeintegritydeclaration": 10,
        "\\makereference": 10,
        "\\makeendpage": 10,
      },
    },
  },
} as const;

// Default conversion settings - Optimized for publication-ready output
export const DEFAULT_SETTINGS = {
  fontSize: 12,
  lineSpacing: 1.5,
  fontFamily: "Times New Roman",
  preserveFormatting: true,
  processBibliography: true,
  preserveFonts: true,
  highQualityImages: true,
  preserveMetadata: true,
} as const;
