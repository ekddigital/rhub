// LaTeX Conversion Engine - Remote Execution via TTYD Terminal
// Executes Pandoc on VPS server instead of locally

import { promises as fs } from "fs";
import path from "path";
import { ZipContents, resolveAssetPaths, validateAssets } from "./zip-handler";
import {
  executeRemoteCommand,
  checkRemotePandocInstalled,
} from "@/lib/terminal/client";
import type {
  ConversionResult,
  JournalDetectionResult,
  LatexConversionQuality,
  LatexToWordOutputFormat,
  WordInputFormat,
  WordToLatexOutputFormat,
} from "./types";

export interface ConversionContext {
  zipContents: ZipContents;
  journalDetection: JournalDetectionResult;
  tempDir: string;
  outputPath: string;
  manualJournal?: string;
  outputFormat?: LatexToWordOutputFormat;
  qualityLevel?: LatexConversionQuality;
}

export interface WordToLatexContext {
  inputPath: string;
  inputFilename: string;
  inputFormat: WordInputFormat;
  tempDir: string;
  outputPath: string;
  outputFormat?: WordToLatexOutputFormat;
  qualityLevel?: LatexConversionQuality;
}

// Use /tmp for both work directory and templates (accessible to all users)
const REMOTE_WORK_DIR = "/tmp/latex_conversions";
const REMOTE_TEMPLATES_DIR = "/tmp/latex_templates";
const LOCAL_TEMPLATE_ASSETS_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "src/lib/latex/template-assets",
);
const UPLOAD_CHUNK_SIZE = 32000;

const TEMPLATE_DEFAULT_ASSETS: Record<string, string[]> = {
  "ujn_thesis_publication.yaml": [
    "images/default/top_cover_sidebar.jpg",
    "images/default/bottom_cover_sidebar.jpg",
  ],
  "zstu_thesis_publication.yaml": [
    "figures/default/zstu_logo_and_name.jpg",
    "figures/default/zstu_logo.jpg",
  ],
};

const DEFAULT_LATEX_TO_WORD_FORMAT: LatexToWordOutputFormat = "docx";
const DEFAULT_WORD_TO_LATEX_FORMAT: WordToLatexOutputFormat = "tex";
const DEFAULT_QUALITY: LatexConversionQuality = "professional";

const TIMEOUTS = {
  quick: 20000,
  normal: 45000,
  conversion: 240000,
};

interface RemoteCommandOptions {
  command: string;
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
}

interface UploadResult {
  success: boolean;
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toRemotePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function normalizeRelativePath(relativePath: string): string {
  return toRemotePath(relativePath).replace(/^\.\//, "").replace(/^\/+/, "");
}

function getTemplateDefaultAssets(templateName: string): string[] {
  return TEMPLATE_DEFAULT_ASSETS[templateName] ?? [];
}

function buildUploadedAssetSet(zipContents: ZipContents): Set<string> {
  const uploadedAssets = new Set<string>();

  for (const localPath of zipContents.allFiles) {
    const relativePath = normalizeRelativePath(
      path.relative(zipContents.workingDir, localPath),
    );
    uploadedAssets.add(relativePath);
  }

  return uploadedAssets;
}

function extractPandocWarnings(output?: string): string[] {
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      const lower = line.toLowerCase();
      return lower.includes("warning") || lower.includes("error");
    })
    .slice(0, 15);
}

function normalizeManualJournal(
  manualJournal?: string,
): JournalDetectionResult["journalType"] | null {
  if (!manualJournal) {
    return null;
  }

  const normalized = manualJournal.trim().toLowerCase();

  const map: Record<string, JournalDetectionResult["journalType"]> = {
    elsevier: "ELSEVIER",
    elsevier_cmig: "ELSEVIER_CMIG",
    cmig: "ELSEVIER_CMIG",
    springer: "SPRINGER_NATURE",
    springer_nature: "SPRINGER_NATURE",
    springernature: "SPRINGER_NATURE",
    ieee: "IEEE",
    acm: "ACM",
    ujn: "UJN_THESIS",
    ujn_thesis: "UJN_THESIS",
    zstu: "ZSTU_THESIS",
    zstu_thesis: "ZSTU_THESIS",
    generic: "GENERIC",
  };

  return map[normalized] ?? null;
}

function getTemplateNameFromJournal(
  journalType: JournalDetectionResult["journalType"],
): string {
  const templateMap: Record<JournalDetectionResult["journalType"], string> = {
    ELSEVIER: "elsevier_publication.yaml",
    ELSEVIER_CMIG: "elsevier_cmig_publication.yaml",
    SPRINGER_NATURE: "springer_publication.yaml",
    IEEE: "ieee_publication.yaml",
    ACM: "acm_publication.yaml",
    UJN_THESIS: "ujn_thesis_publication.yaml",
    ZSTU_THESIS: "zstu_thesis_publication.yaml",
    GENERIC: "generic_publication.yaml",
  };

  return templateMap[journalType] ?? "generic_publication.yaml";
}

function selectTemplateName(
  detection: JournalDetectionResult,
  manualJournal: string | undefined,
  warnings: string[],
): {
  templateName: string;
  journalType: JournalDetectionResult["journalType"];
} {
  const manualSelection = normalizeManualJournal(manualJournal);

  if (manualJournal && !manualSelection) {
    warnings.push(
      `Manual journal \"${manualJournal}\" is not recognized. Falling back to auto-detection.`,
    );
  }

  const journalType = manualSelection ?? detection.journalType;

  if (manualSelection) {
    warnings.push(`Using manual journal override: ${manualSelection}`);
  }

  return {
    templateName: getTemplateNameFromJournal(journalType),
    journalType,
  };
}

function deriveOutputFilename(
  outputFormat: LatexToWordOutputFormat | WordToLatexOutputFormat,
): string {
  if (outputFormat === "docx" || outputFormat === "odt") {
    return `converted.${outputFormat}`;
  }

  return "converted.tex";
}

async function runRemoteCommand(
  options: RemoteCommandOptions,
): Promise<Awaited<ReturnType<typeof executeRemoteCommand>>> {
  const {
    command,
    timeout = TIMEOUTS.normal,
    retries = 2,
    retryDelayMs = 800,
  } = options;

  return executeRemoteCommand({
    command,
    timeout,
    retries,
    retryDelayMs,
  });
}

async function uploadBase64ToRemote(
  base64Content: string,
  remotePath: string,
): Promise<UploadResult> {
  const tempBase64Path = `${remotePath}.b64`;

  const initResult = await runRemoteCommand({
    command: `rm -f "${tempBase64Path}" && touch "${tempBase64Path}"`,
    timeout: TIMEOUTS.normal,
    retries: 2,
  });

  if (!initResult.success) {
    return {
      success: false,
      error: `Failed to initialize upload buffer: ${
        initResult.output || initResult.error || "Unknown error"
      }`,
    };
  }

  for (
    let offset = 0;
    offset < base64Content.length;
    offset += UPLOAD_CHUNK_SIZE
  ) {
    const chunk = base64Content.slice(offset, offset + UPLOAD_CHUNK_SIZE);

    const appendResult = await runRemoteCommand({
      command: `printf '%s' '${chunk}' >> "${tempBase64Path}"`,
      timeout: TIMEOUTS.normal,
      retries: 2,
    });

    if (!appendResult.success) {
      return {
        success: false,
        error: `Failed while uploading base64 chunk: ${
          appendResult.output || appendResult.error || "Unknown error"
        }`,
      };
    }
  }

  const decodeResult = await runRemoteCommand({
    command: `base64 -d "${tempBase64Path}" > "${remotePath}" && rm -f "${tempBase64Path}"`,
    timeout: TIMEOUTS.normal,
    retries: 2,
  });

  if (!decodeResult.success) {
    return {
      success: false,
      error: `Failed to decode uploaded file: ${
        decodeResult.output || decodeResult.error || "Unknown error"
      }`,
    };
  }

  return { success: true };
}

async function ensureTemplateDefaultAssets(params: {
  zipContents: ZipContents;
  remoteWorkDir: string;
  templateName: string;
  warnings: string[];
}): Promise<void> {
  const { zipContents, remoteWorkDir, templateName, warnings } = params;
  const requiredAssets = getTemplateDefaultAssets(templateName);

  if (requiredAssets.length === 0) {
    return;
  }

  const uploadedAssetSet = buildUploadedAssetSet(zipContents);

  for (const assetPath of requiredAssets) {
    const normalizedAssetPath = normalizeRelativePath(assetPath);

    // Keep user-provided assets unchanged.
    if (uploadedAssetSet.has(normalizedAssetPath)) {
      continue;
    }

    const localBundledAssetPath = path.join(
      LOCAL_TEMPLATE_ASSETS_DIR,
      normalizedAssetPath,
    );

    let assetBuffer: Buffer;

    try {
      assetBuffer = await fs.readFile(localBundledAssetPath);
    } catch {
      throw new Error(
        `Missing bundled default asset for ${templateName}: ${normalizedAssetPath}`,
      );
    }

    const remoteAssetPath = `${remoteWorkDir}/input/${normalizedAssetPath}`;
    const remoteAssetDir = path.dirname(remoteAssetPath);

    const mkdirResult = await runRemoteCommand({
      command: `mkdir -p "${remoteAssetDir}"`,
      timeout: TIMEOUTS.normal,
      retries: 2,
    });

    if (!mkdirResult.success) {
      throw new Error(
        `Failed to create remote asset directory for ${normalizedAssetPath}: ${
          mkdirResult.output || mkdirResult.error || "Unknown error"
        }`,
      );
    }

    const uploadResult = await uploadBase64ToRemote(
      assetBuffer.toString("base64"),
      remoteAssetPath,
    );

    if (!uploadResult.success) {
      throw new Error(
        `Failed to upload bundled default asset ${normalizedAssetPath}: ${uploadResult.error}`,
      );
    }

    const verifyResult = await runRemoteCommand({
      command: `test -s "${remoteAssetPath}" && echo "exists" || echo "missing"`,
      timeout: TIMEOUTS.quick,
      retries: 2,
    });

    if (verifyResult.output.trim() !== "exists") {
      throw new Error(
        `Uploaded default asset could not be verified on remote server: ${normalizedAssetPath}`,
      );
    }

    warnings.push(
      `Added bundled default asset for ${templateName}: ${normalizedAssetPath}`,
    );
  }
}

function buildLatexToWordPandocArgs(params: {
  outputFormat: LatexToWordOutputFormat;
  qualityLevel: LatexConversionQuality;
  useTemplate: boolean;
  templatePath: string;
}): string[] {
  const args = [
    "--from=latex",
    `--to=${params.outputFormat}`,
    "--standalone",
    '--resource-path="."',
  ];

  if (params.useTemplate) {
    args.push(`--metadata-file="${params.templatePath}"`);
  }

  if (params.qualityLevel === "standard") {
    args.push("--number-sections");
  }

  if (
    params.qualityLevel === "professional" ||
    params.qualityLevel === "publication"
  ) {
    args.push("--number-sections", "--toc", "--toc-depth=3", "--citeproc");
  }

  if (params.qualityLevel === "publication") {
    args.push("--reference-links", "--strip-comments");
  }

  return args;
}

function buildWordToLatexPandocArgs(
  qualityLevel: LatexConversionQuality,
  remoteWorkDir: string,
  sourceFormat: "docx" | "odt",
): string[] {
  const args = [
    `--from=${sourceFormat}`,
    "--to=latex",
    "--standalone",
    "--wrap=preserve",
    `--extract-media="${remoteWorkDir}/output/media"`,
  ];

  if (qualityLevel === "standard") {
    args.push("--number-sections");
  }

  if (qualityLevel === "professional" || qualityLevel === "publication") {
    args.push("--number-sections", "--toc", "--toc-depth=3");
  }

  if (qualityLevel === "publication") {
    args.push("--citeproc");
  }

  return args;
}

/**
 * Main conversion engine for LaTeX -> Word
 */
export async function convertLatexToWord(
  context: ConversionContext,
): Promise<ConversionResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  const outputFormat = context.outputFormat ?? DEFAULT_LATEX_TO_WORD_FORMAT;
  const qualityLevel = context.qualityLevel ?? DEFAULT_QUALITY;

  let remoteWorkDir: string | null = null;

  try {
    // Step 1: Validate assets locally
    const assets = resolveAssetPaths(
      context.zipContents.mainTexContent,
      context.zipContents.workingDir,
    );

    const validation = await validateAssets(
      assets,
      context.zipContents.workingDir,
      context.zipContents.allFiles,
    );

    warnings.push(...validation.warnings);

    // Step 2: Create unique remote directory
    const remoteSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    remoteWorkDir = `${REMOTE_WORK_DIR}/${remoteSessionId}`;

    // Step 3: Setup remote environment
    const setupResult = await setupRemoteEnvironment(remoteWorkDir);
    if (!setupResult.success) {
      throw new Error(
        `Failed to setup remote environment: ${setupResult.error}`,
      );
    }

    // Step 4: Upload files to remote server
    await uploadFilesToRemote(context.zipContents, remoteWorkDir, warnings);

    // Step 5: Select and prepare template
    const templateSelection = selectTemplateName(
      context.journalDetection,
      context.manualJournal,
      warnings,
    );

    const templateDefaultAssets = getTemplateDefaultAssets(
      templateSelection.templateName,
    );
    const templateDefaultAssetSet = new Set(
      templateDefaultAssets.map((assetPath) =>
        normalizeRelativePath(assetPath),
      ),
    );

    const nonDefaultMissingAssets = validation.missing.filter(
      (missingAsset) => {
        const normalizedMissingAsset = normalizeRelativePath(missingAsset);
        return !templateDefaultAssetSet.has(normalizedMissingAsset);
      },
    );

    if (nonDefaultMissingAssets.length > 0) {
      warnings.push(`Missing assets: ${nonDefaultMissingAssets.join(", ")}`);
    }

    // Add bundled defaults for templates that require fixed cover/logo figures.
    await ensureTemplateDefaultAssets({
      zipContents: context.zipContents,
      remoteWorkDir,
      templateName: templateSelection.templateName,
      warnings,
    });

    // Step 6: Run Pandoc conversion remotely
    const mainTexRelativePath = toRemotePath(
      path.relative(
        context.zipContents.workingDir,
        context.zipContents.mainTexFile,
      ),
    );

    const conversionResult = await runRemotePandocConversion({
      remoteWorkDir,
      mainTexRelativePath,
      templateName: templateSelection.templateName,
      outputFormat,
      qualityLevel,
      warnings,
    });

    if (!conversionResult.success) {
      throw new Error(conversionResult.error || "Remote conversion failed");
    }

    // Step 7: Download converted file
    const outputFile = await downloadConvertedFile(
      remoteWorkDir,
      context.outputPath,
      conversionResult.outputFilename,
    );

    // Step 8: Gather statistics
    const stats = await gatherConversionStats(outputFile, context.zipContents);

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      outputFile,
      outputFormat,
      outputSize: stats.outputSize,
      detectedJournal: templateSelection.journalType,
      documentClass: context.journalDetection.documentClass,
      bibEntryCount: stats.bibEntryCount,
      figureCount: assets.figures.length,
      tableCount: stats.tableCount,
      warningCount: warnings.length,
      warnings,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Unknown conversion error",
      warnings,
      durationMs,
    };
  } finally {
    if (remoteWorkDir) {
      await cleanupRemoteDirectory(remoteWorkDir);
    }
  }
}

/**
 * Main conversion engine for Word -> LaTeX
 */
export async function convertWordToLatex(
  context: WordToLatexContext,
): Promise<ConversionResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  const outputFormat = context.outputFormat ?? DEFAULT_WORD_TO_LATEX_FORMAT;
  const qualityLevel = context.qualityLevel ?? DEFAULT_QUALITY;

  let remoteWorkDir: string | null = null;

  try {
    const remoteSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    remoteWorkDir = `${REMOTE_WORK_DIR}/${remoteSessionId}`;

    const setupResult = await setupRemoteEnvironment(remoteWorkDir);
    if (!setupResult.success) {
      throw new Error(
        `Failed to setup remote environment: ${setupResult.error}`,
      );
    }

    const inputBuffer = await fs.readFile(context.inputPath);
    const base64Content = inputBuffer.toString("base64");

    const remoteInputPath = `${remoteWorkDir}/input/input.${context.inputFormat}`;
    const uploadResult = await uploadBase64ToRemote(
      base64Content,
      remoteInputPath,
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload Word document");
    }

    const conversionResult = await runRemoteWordToLatexConversion({
      remoteWorkDir,
      inputFormat: context.inputFormat,
      outputFormat,
      qualityLevel,
      warnings,
    });

    if (!conversionResult.success) {
      throw new Error(conversionResult.error || "Remote conversion failed");
    }

    const outputFile = await downloadConvertedFile(
      remoteWorkDir,
      context.outputPath,
      conversionResult.outputFilename,
    );

    const outputStats = await fs.stat(outputFile);
    const durationMs = Date.now() - startTime;

    return {
      success: true,
      outputFile,
      outputFormat,
      outputSize: outputStats.size,
      warningCount: warnings.length,
      warnings,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Unknown conversion error",
      warnings,
      durationMs,
    };
  } finally {
    if (remoteWorkDir) {
      await cleanupRemoteDirectory(remoteWorkDir);
    }
  }
}

/**
 * Sets up remote directory structure
 */
async function setupRemoteEnvironment(remoteWorkDir: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const commands = [
    `mkdir -p ${remoteWorkDir}`,
    `mkdir -p ${remoteWorkDir}/input`,
    `mkdir -p ${remoteWorkDir}/output`,
    `chmod 755 ${remoteWorkDir}`,
  ];

  for (const command of commands) {
    const result = await runRemoteCommand({
      command,
      timeout: TIMEOUTS.normal,
      retries: 2,
    });

    if (!result.success) {
      return {
        success: false,
        error: `Setup failed: ${result.output || result.error}`,
      };
    }
  }

  return { success: true };
}

/**
 * Uploads local files to remote server using base64 encoding
 */
async function uploadFilesToRemote(
  zipContents: ZipContents,
  remoteWorkDir: string,
  warnings: string[],
): Promise<void> {
  const filesToUpload = [
    ...zipContents.texFiles,
    ...zipContents.bibFiles,
    ...zipContents.figureFiles,
    ...zipContents.styleFiles,
  ];

  // Upload files in batches to avoid overwhelming the connection
  const batchSize = 3;

  for (let i = 0; i < filesToUpload.length; i += batchSize) {
    const batch = filesToUpload.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (localPath) => {
        try {
          const content = await fs.readFile(localPath);
          const base64Content = content.toString("base64");

          // Get relative path from working directory
          const relativePath = toRemotePath(
            path.relative(zipContents.workingDir, localPath),
          );
          const remotePath = `${remoteWorkDir}/input/${relativePath}`;
          const remoteDir = path.dirname(remotePath);

          const mkdirResult = await runRemoteCommand({
            command: `mkdir -p "${remoteDir}"`,
            timeout: TIMEOUTS.normal,
            retries: 2,
          });

          if (!mkdirResult.success) {
            throw new Error(
              mkdirResult.output ||
                mkdirResult.error ||
                "Directory creation failed",
            );
          }

          const uploadResult = await uploadBase64ToRemote(
            base64Content,
            remotePath,
          );

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || "Upload failed");
          }
        } catch (error) {
          const relativePath = toRemotePath(
            path.relative(zipContents.workingDir, localPath),
          );
          const message = `Failed to upload ${relativePath}: ${
            error instanceof Error ? error.message : "Unknown"
          }`;

          const isCriticalFile =
            zipContents.texFiles.includes(localPath) ||
            zipContents.bibFiles.includes(localPath) ||
            zipContents.styleFiles.includes(localPath);

          if (isCriticalFile) {
            throw new Error(message);
          }

          warnings.push(message);
        }
      }),
    );

    if (i + batchSize < filesToUpload.length) {
      await sleep(120);
    }
  }
}

/**
 * Runs Pandoc conversion on remote server (LaTeX -> Word)
 */
async function runRemotePandocConversion(params: {
  remoteWorkDir: string;
  mainTexRelativePath: string;
  templateName: string;
  outputFormat: LatexToWordOutputFormat;
  qualityLevel: LatexConversionQuality;
  warnings: string[];
}): Promise<{ success: boolean; outputFilename: string; error?: string }> {
  const {
    remoteWorkDir,
    mainTexRelativePath,
    templateName,
    outputFormat,
    qualityLevel,
    warnings,
  } = params;

  const mainTexPath = `${remoteWorkDir}/input/${mainTexRelativePath}`;
  const outputFilename = deriveOutputFilename(outputFormat);
  const outputPath = `${remoteWorkDir}/output/${outputFilename}`;
  const templatePath = `${REMOTE_TEMPLATES_DIR}/${templateName}`;

  const mainFileCheck = await runRemoteCommand({
    command: `test -f "${mainTexPath}" && echo "exists" || echo "missing"`,
    timeout: TIMEOUTS.quick,
    retries: 2,
  });

  if (mainFileCheck.output.trim() !== "exists") {
    return {
      success: false,
      outputFilename,
      error: `Main .tex file was not uploaded correctly: ${mainTexRelativePath}`,
    };
  }

  // Check if template exists
  const templateCheckResult = await runRemoteCommand({
    command: `test -f "${templatePath}" && echo "exists" || echo "missing"`,
    timeout: TIMEOUTS.quick,
    retries: 2,
  });

  const useTemplate = templateCheckResult.output.trim() === "exists";
  if (!useTemplate) {
    warnings.push(`Template not found: ${templateName}, using defaults`);
  }

  const pandocArgs = buildLatexToWordPandocArgs({
    outputFormat,
    qualityLevel,
    useTemplate,
    templatePath,
  });

  const pandocCommand = `cd "${remoteWorkDir}/input" && pandoc "${mainTexPath}" -o "${outputPath}" ${pandocArgs.join(
    " ",
  )} 2>&1`;

  const conversionResult = await runRemoteCommand({
    command: pandocCommand,
    timeout: TIMEOUTS.conversion,
    retries: 1,
  });

  warnings.push(...extractPandocWarnings(conversionResult.output));

  if (!conversionResult.success) {
    return {
      success: false,
      outputFilename,
      error: `Pandoc conversion failed: ${
        conversionResult.output || conversionResult.error
      }`,
    };
  }

  // Verify output file was created
  const verifyResult = await runRemoteCommand({
    command: `test -s "${outputPath}" && echo "exists" || echo "missing"`,
    timeout: TIMEOUTS.normal,
    retries: 2,
  });

  if (verifyResult.output.trim() !== "exists") {
    const debugResult = await runRemoteCommand({
      command: `ls -la "${remoteWorkDir}/output" 2>/dev/null || echo "output_directory_missing"`,
      timeout: TIMEOUTS.normal,
      retries: 1,
    });

    return {
      success: false,
      outputFilename,
      error: `Output file was not created. Remote output state: ${
        debugResult.output || "unknown"
      }`,
    };
  }

  return { success: true, outputFilename };
}

/**
 * Runs Pandoc conversion on remote server (Word -> LaTeX)
 */
async function runRemoteWordToLatexConversion(params: {
  remoteWorkDir: string;
  inputFormat: WordInputFormat;
  outputFormat: WordToLatexOutputFormat;
  qualityLevel: LatexConversionQuality;
  warnings: string[];
}): Promise<{ success: boolean; outputFilename: string; error?: string }> {
  const { remoteWorkDir, inputFormat, outputFormat, qualityLevel, warnings } =
    params;

  const outputFilename = deriveOutputFilename(outputFormat);
  const outputPath = `${remoteWorkDir}/output/${outputFilename}`;

  let sourcePath = `${remoteWorkDir}/input/input.${inputFormat}`;
  let sourceFormat: "docx" | "odt" = inputFormat === "odt" ? "odt" : "docx";

  if (inputFormat === "doc") {
    warnings.push(
      "Legacy .doc input detected. Converting to .docx on the remote server before Pandoc processing.",
    );

    const preconvertResult = await runRemoteCommand({
      command:
        `if command -v libreoffice >/dev/null 2>&1; then ` +
        `libreoffice --headless --convert-to docx --outdir "${remoteWorkDir}/input" "${sourcePath}" 2>&1; ` +
        `elif command -v soffice >/dev/null 2>&1; then ` +
        `soffice --headless --convert-to docx --outdir "${remoteWorkDir}/input" "${sourcePath}" 2>&1; ` +
        `else echo "Missing libreoffice/soffice for .doc conversion"; exit 1; fi`,
      timeout: TIMEOUTS.conversion,
      retries: 1,
    });

    warnings.push(...extractPandocWarnings(preconvertResult.output));

    if (!preconvertResult.success) {
      return {
        success: false,
        outputFilename,
        error: `Failed to pre-convert .doc file: ${
          preconvertResult.output || preconvertResult.error
        }`,
      };
    }

    const convertedDocxPath = `${remoteWorkDir}/input/input.docx`;
    const convertedCheck = await runRemoteCommand({
      command: `test -f "${convertedDocxPath}" && echo "exists" || echo "missing"`,
      timeout: TIMEOUTS.quick,
      retries: 2,
    });

    if (convertedCheck.output.trim() !== "exists") {
      return {
        success: false,
        outputFilename,
        error: "Converted .docx file was not created on remote server",
      };
    }

    sourcePath = convertedDocxPath;
    sourceFormat = "docx";
  }

  const pandocArgs = buildWordToLatexPandocArgs(
    qualityLevel,
    remoteWorkDir,
    sourceFormat,
  );

  const pandocCommand = `pandoc "${sourcePath}" -o "${outputPath}" ${pandocArgs.join(
    " ",
  )} 2>&1`;

  const conversionResult = await runRemoteCommand({
    command: pandocCommand,
    timeout: TIMEOUTS.conversion,
    retries: 1,
  });

  warnings.push(...extractPandocWarnings(conversionResult.output));

  if (!conversionResult.success) {
    return {
      success: false,
      outputFilename,
      error: `Pandoc conversion failed: ${
        conversionResult.output || conversionResult.error
      }`,
    };
  }

  const verifyResult = await runRemoteCommand({
    command: `test -s "${outputPath}" && echo "exists" || echo "missing"`,
    timeout: TIMEOUTS.normal,
    retries: 2,
  });

  if (verifyResult.output.trim() !== "exists") {
    return {
      success: false,
      outputFilename,
      error: "Output .tex file was not created",
    };
  }

  return { success: true, outputFilename };
}

/**
 * Downloads converted file from remote server
 */
async function downloadConvertedFile(
  remoteWorkDir: string,
  localOutputPath: string,
  outputFilename: string,
): Promise<string> {
  const remotePath = `${remoteWorkDir}/output/${outputFilename}`;

  // Download file using base64 encoding
  const downloadResult = await runRemoteCommand({
    command: `base64 "${remotePath}"`,
    timeout: TIMEOUTS.normal,
    retries: 2,
  });

  if (!downloadResult.success) {
    throw new Error("Failed to download converted file from remote server");
  }

  // Decode base64 and save locally
  const buffer = Buffer.from(downloadResult.output, "base64");
  const outputFile = path.join(localOutputPath, outputFilename);

  await fs.writeFile(outputFile, buffer);

  return outputFile;
}

/**
 * Cleans up remote directory after conversion
 */
async function cleanupRemoteDirectory(remoteWorkDir: string): Promise<void> {
  await runRemoteCommand({
    command: `rm -rf "${remoteWorkDir}"`,
    timeout: TIMEOUTS.quick,
    retries: 1,
  });
}

/**
 * Gathers conversion statistics
 */
async function gatherConversionStats(
  outputFile: string,
  zipContents: ZipContents,
): Promise<{
  outputSize: number;
  bibEntryCount: number;
  tableCount: number;
}> {
  const stats = await fs.stat(outputFile);

  // Count bibliography entries
  let bibEntryCount = 0;
  for (const bibFile of zipContents.bibFiles) {
    try {
      const content = await fs.readFile(bibFile, "utf-8");
      const entries = content.match(/@\w+\{/g);
      bibEntryCount += entries ? entries.length : 0;
    } catch {
      // Skip files that can't be read
    }
  }

  // Count tables
  const tableMatches = zipContents.mainTexContent.match(/\\begin\{table\*?\}/g);
  const tableCount = tableMatches ? tableMatches.length : 0;

  return {
    outputSize: stats.size,
    bibEntryCount,
    tableCount,
  };
}

/**
 * Checks if Pandoc is installed on remote server
 */
export async function checkPandocInstalled(): Promise<boolean> {
  const result = await checkRemotePandocInstalled();
  return result.installed;
}

/**
 * Ensures remote templates directory exists and templates are uploaded
 */
export async function ensureRemoteTemplates(): Promise<{
  success: boolean;
  error?: string;
}> {
  // Create templates directory
  const mkdirResult = await runRemoteCommand({
    command: `mkdir -p ${REMOTE_TEMPLATES_DIR}`,
    timeout: TIMEOUTS.normal,
    retries: 2,
  });

  if (!mkdirResult.success) {
    return {
      success: false,
      error: "Failed to create remote templates directory",
    };
  }

  // Upload each template file
  const templates = [
    "elsevier_publication.yaml",
    "elsevier_cmig_publication.yaml",
    "ieee_publication.yaml",
    "springer_publication.yaml",
    "acm_publication.yaml",
    "ujn_thesis_publication.yaml",
    "zstu_thesis_publication.yaml",
    "generic_publication.yaml",
  ];

  for (const templateName of templates) {
    const localPath = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "src/lib/latex/templates",
      templateName,
    );

    try {
      const content = await fs.readFile(localPath, "utf-8");
      const base64Content = Buffer.from(content).toString("base64");
      const remotePath = `${REMOTE_TEMPLATES_DIR}/${templateName}`;

      const uploadResult = await uploadBase64ToRemote(
        base64Content,
        remotePath,
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: `Failed to upload template: ${templateName} (${uploadResult.error})`,
        };
      }

      const verifyResult = await runRemoteCommand({
        command: `test -s "${remotePath}" && echo "exists" || echo "missing"`,
        timeout: TIMEOUTS.quick,
        retries: 2,
      });

      if (verifyResult.output.trim() !== "exists") {
        return {
          success: false,
          error: `Template upload verification failed: ${templateName}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error reading template ${templateName}: ${
          error instanceof Error ? error.message : "Unknown"
        }`,
      };
    }
  }

  return { success: true };
}
