// API Route: /api/tools/latex/convert
// Handles LaTeX <-> Word conversion requests

// Force Node.js runtime - this route uses fs/path/os APIs.
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { extractAndAnalyzeZip, cleanupTempDir } from "@/lib/latex/zip-handler";
import {
  convertLatexToWord,
  convertWordToLatex,
  checkPandocInstalled,
  ensureRemoteTemplates,
} from "@/lib/latex/engine-remote";
import { detectJournalType } from "@/lib/latex/journal-detector";
import type {
  ConversionResult,
  LatexConversionQuality,
  LatexToWordOutputFormat,
  WordInputFormat,
  WordToLatexOutputFormat,
} from "@/lib/latex/types";

const LATEX_TO_WORD_TOOL = "latex-to-word";
const WORD_TO_LATEX_TOOL = "word-to-latex";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
const CONVERSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DEFAULT_QUALITY: LatexConversionQuality = "professional";

function parseQualityLevel(
  value: FormDataEntryValue | null,
): LatexConversionQuality {
  if (typeof value !== "string") {
    return DEFAULT_QUALITY;
  }

  const normalized = value.toLowerCase();

  if (
    normalized === "basic" ||
    normalized === "standard" ||
    normalized === "professional" ||
    normalized === "publication"
  ) {
    return normalized;
  }

  return DEFAULT_QUALITY;
}

function parseLatexToWordOutputFormat(
  value: FormDataEntryValue | null,
): LatexToWordOutputFormat | null {
  if (value === null) {
    return "docx";
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === "docx" || normalized === "odt") {
    return normalized;
  }

  return null;
}

function parseWordToLatexOutputFormat(
  value: FormDataEntryValue | null,
): WordToLatexOutputFormat | null {
  if (value === null) {
    return "tex";
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === "tex" || normalized === "latex") {
    return normalized;
  }

  return null;
}

function detectWordInputFormat(fileName: string): WordInputFormat | null {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".docx")) {
    return "docx";
  }

  if (normalized.endsWith(".odt")) {
    return "odt";
  }

  if (normalized.endsWith(".doc")) {
    return "doc";
  }

  return null;
}

function toDownloadExtension(outputFormat: string): string {
  if (outputFormat === "latex") {
    return "tex";
  }

  return outputFormat;
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (
        Number.isFinite(contentLength) &&
        contentLength > MAX_ZIP_SIZE + 5 * 1024 * 1024
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Upload too large for converter endpoint. Reduce file size or increase reverse-proxy body-size limits.",
          },
          { status: 413 },
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const toolSlugValue = formData.get("toolSlug");
    const toolSlug =
      typeof toolSlugValue === "string" && toolSlugValue.trim().length > 0
        ? toolSlugValue
        : LATEX_TO_WORD_TOOL;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    if (toolSlug !== LATEX_TO_WORD_TOOL && toolSlug !== WORD_TO_LATEX_TOOL) {
      return NextResponse.json(
        { success: false, error: `Unsupported tool slug: ${toolSlug}` },
        { status: 400 },
      );
    }

    // Check if Pandoc is installed on remote server
    const pandocInstalled = await checkPandocInstalled();
    if (!pandocInstalled) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pandoc is not installed on the remote server. Please contact support.",
        },
        { status: 500 },
      );
    }

    const qualityLevel = parseQualityLevel(formData.get("qualityLevel"));

    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "latex-convert-"));
    const outputDir = path.join(tempDir, "output");
    await fs.mkdir(outputDir);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result: ConversionResult;
    let requestedOutputFormat: string;

    if (toolSlug === LATEX_TO_WORD_TOOL) {
      const outputFormat = parseLatexToWordOutputFormat(
        formData.get("outputFormat"),
      );
      if (!outputFormat) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid output format. Supported values: docx, odt.",
          },
          { status: 400 },
        );
      }

      // Ensure remote templates are uploaded for LaTeX -> Word mode
      const templatesResult = await ensureRemoteTemplates();
      if (!templatesResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to setup remote templates: ${templatesResult.error}`,
          },
          { status: 500 },
        );
      }

      const fileName = file.name.toLowerCase();
      const isZip = fileName.endsWith(".zip");
      const isTex = fileName.endsWith(".tex") || fileName.endsWith(".latex");

      if (!isZip && !isTex) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid file type. Please upload a .tex, .latex, or .zip file.",
          },
          { status: 400 },
        );
      }

      const maxSize = isZip ? MAX_ZIP_SIZE : MAX_FILE_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
          },
          { status: 400 },
        );
      }

      // Handle ZIP or single .tex file
      let zipContents;
      if (isZip) {
        zipContents = await extractAndAnalyzeZip(buffer, tempDir);
      } else {
        const texPath = path.join(tempDir, file.name);
        await fs.writeFile(texPath, buffer);

        const texContent = buffer.toString("utf-8");

        zipContents = {
          mainTexFile: texPath,
          mainTexContent: texContent,
          workingDir: tempDir,
          allFiles: [texPath],
          texFiles: [texPath],
          bibFiles: [],
          figureFiles: [],
          styleFiles: [],
        };
      }

      const journalDetection = detectJournalType(zipContents.mainTexContent);
      const manualJournalValue = formData.get("manualJournal");
      const manualJournal =
        typeof manualJournalValue === "string" &&
        manualJournalValue.trim().length > 0
          ? manualJournalValue
          : undefined;

      requestedOutputFormat = outputFormat;

      const conversionPromise = convertLatexToWord({
        zipContents,
        journalDetection,
        tempDir,
        outputPath: outputDir,
        manualJournal,
        outputFormat,
        qualityLevel,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Conversion timeout exceeded (5 minutes)"));
        }, CONVERSION_TIMEOUT);
      });

      result = await Promise.race([conversionPromise, timeoutPromise]);
    } else {
      const outputFormat = parseWordToLatexOutputFormat(
        formData.get("outputFormat"),
      );
      if (!outputFormat) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid output format. Supported values: tex, latex.",
          },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          },
          { status: 400 },
        );
      }

      const inputFormat = detectWordInputFormat(file.name);
      if (!inputFormat) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid file type. Please upload a .docx, .doc, or .odt file.",
          },
          { status: 400 },
        );
      }

      requestedOutputFormat = outputFormat;

      const localInputPath = path.join(tempDir, `input.${inputFormat}`);
      await fs.writeFile(localInputPath, buffer);

      const conversionPromise = convertWordToLatex({
        inputPath: localInputPath,
        inputFilename: file.name,
        inputFormat,
        tempDir,
        outputPath: outputDir,
        outputFormat,
        qualityLevel,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Conversion timeout exceeded (5 minutes)"));
        }, CONVERSION_TIMEOUT);
      });

      result = await Promise.race([conversionPromise, timeoutPromise]);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || "Conversion failed - check server logs",
          warnings: result.warnings,
          durationMs: result.durationMs,
        },
        { status: 500 },
      );
    }

    // Read the output file
    const outputFile = result.outputFile;
    if (!outputFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Conversion completed but no output file was returned.",
        },
        { status: 500 },
      );
    }

    const outputBuffer = await fs.readFile(outputFile);
    const base64File = outputBuffer.toString("base64");

    const outputFormat = result.outputFormat ?? requestedOutputFormat;
    const extension = toDownloadExtension(outputFormat);

    return NextResponse.json({
      success: true,
      file: base64File,
      filename: `converted_${Date.now()}.${extension}`,
      outputFormat,
      outputSize: result.outputSize,
      detectedJournal: result.detectedJournal,
      documentClass: result.documentClass,
      bibEntryCount: result.bibEntryCount,
      figureCount: result.figureCount,
      tableCount: result.tableCount,
      warningCount: result.warningCount,
      warnings: result.warnings,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("Conversion error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Conversion failed",
      },
      { status: 500 },
    );
  } finally {
    if (tempDir) {
      cleanupTempDir(tempDir).catch(console.error);
    }
  }
}
