"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  FileUp,
  Server,
  FileCheck,
} from "lucide-react";
import {
  parseErrorResponse,
  parseJsonResponse,
} from "@/lib/http/client-response";

interface ConversionResult {
  success: boolean;
  file?: string;
  filename?: string;
  outputFormat?: string;
  outputSize?: number;
  detectedJournal?: string;
  documentClass?: string;
  bibEntryCount?: number;
  figureCount?: number;
  tableCount?: number;
  warningCount?: number;
  errorMessage?: string;
  error?: string;
  warnings?: string[];
  durationMs?: number;
}

type ConversionStep =
  | "idle"
  | "uploading"
  | "processing"
  | "converting"
  | "downloading"
  | "complete"
  | "error";

type ToolMode = "latex-to-word" | "word-to-latex";
type OutputFormat = "docx" | "odt" | "tex" | "latex";
type QualityLevel = "basic" | "standard" | "professional" | "publication";

const STEP_CONFIG = {
  idle: { label: "Ready", icon: FileText, progress: 0 },
  uploading: { label: "Preparing upload...", icon: FileUp, progress: 20 },
  processing: {
    label: "Setting up remote server...",
    icon: Server,
    progress: 40,
  },
  converting: { label: "Running conversion...", icon: Loader2, progress: 70 },
  downloading: { label: "Preparing download...", icon: Download, progress: 90 },
  complete: { label: "Complete!", icon: CheckCircle2, progress: 100 },
  error: { label: "Error", icon: XCircle, progress: 0 },
};

const QUALITY_OPTIONS: {
  value: QualityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "basic",
    label: "Basic",
    description: "Fastest conversion with minimal post-processing.",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Adds section numbering and balanced formatting defaults.",
  },
  {
    value: "professional",
    label: "Professional",
    description:
      "Adds TOC depth, citations, and publication-friendly structure.",
  },
  {
    value: "publication",
    label: "Publication",
    description: "Most strict profile with advanced formatting preservation.",
  },
];

const MODE_CONFIG: Record<
  ToolMode,
  {
    uploadLabel: string;
    uploadHint: string;
    accept: string;
    convertButton: string;
    successText: string;
  }
> = {
  "latex-to-word": {
    uploadLabel: "Upload LaTeX Document",
    uploadHint:
      "Upload a .tex/.latex file or a .zip containing your LaTeX project",
    accept: ".tex,.latex,.zip",
    convertButton: "Convert to Word",
    successText: "Your document has been converted to Word-compatible output",
  },
  "word-to-latex": {
    uploadLabel: "Upload Word Document",
    uploadHint: "Upload a .docx, .doc, or .odt document",
    accept: ".docx,.doc,.odt",
    convertButton: "Convert to LaTeX",
    successText: "Your document has been converted to LaTeX output",
  },
};

interface LaTeXConverterShellProps {
  toolSlug: string;
}

export function LaTeXConverterShell({ toolSlug }: LaTeXConverterShellProps) {
  const mode: ToolMode =
    toolSlug === "word-to-latex" ? "word-to-latex" : "latex-to-word";
  const modeConfig = MODE_CONFIG[mode];

  const [file, setFile] = useState<File | null>(null);
  const [manualJournal, setManualJournal] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    mode === "latex-to-word" ? "docx" : "tex",
  );
  const [qualityLevel, setQualityLevel] =
    useState<QualityLevel>("professional");
  const [step, setStep] = useState<ConversionStep>("idle");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFile(null);
    setManualJournal("");
    setOutputFormat(mode === "latex-to-word" ? "docx" : "tex");
    setQualityLevel("professional");
    setStep("idle");
    setResult(null);
    setError(null);
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setStep("idle");
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setError(null);
    setResult(null);
    setStep("uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("toolSlug", mode);
    formData.append("outputFormat", outputFormat);
    formData.append("qualityLevel", qualityLevel);

    if (mode === "latex-to-word" && manualJournal.trim()) {
      formData.append("manualJournal", manualJournal.trim());
    }

    try {
      setStep("processing");

      const responsePromise = fetch("/api/tools/latex/convert", {
        method: "POST",
        body: formData,
      });

      setStep("converting");
      const response = await responsePromise;

      if (!response.ok) {
        const message = await parseErrorResponse(response, "Conversion failed");
        throw new Error(message);
      }

      const data = await parseJsonResponse<ConversionResult>(
        response,
        "Conversion failed",
      );

      if (!data.success) {
        throw new Error(data.error || data.errorMessage || "Conversion failed");
      }

      setStep("downloading");
      setResult(data);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setStep("error");
    }
  };

  const handleDownload = useCallback(() => {
    if (!result?.file) return;

    try {
      const binaryString = atob(result.file);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const normalizedFormat = (
        result.outputFormat || outputFormat
      ).toLowerCase();
      const extension = normalizedFormat === "latex" ? "tex" : normalizedFormat;

      const mimeByFormat: Record<string, string> = {
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        odt: "application/vnd.oasis.opendocument.text",
        tex: "text/x-tex;charset=utf-8",
      };

      const blob = new Blob([bytes], {
        type: mimeByFormat[extension] || "application/octet-stream",
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;

      const safeInputBaseName =
        file?.name.replace(/\.[^.]+$/, "") || "converted";
      anchor.download =
        result.filename || `${safeInputBaseName}_converted.${extension}`;

      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download converted file");
    }
  }, [result, outputFormat, file]);

  const isProcessing = [
    "uploading",
    "processing",
    "converting",
    "downloading",
  ].includes(step);
  const currentStepConfig = STEP_CONFIG[step];
  const StepIcon = currentStepConfig.icon;

  const outputFormatOptions =
    mode === "latex-to-word"
      ? [
          { value: "docx", label: "DOCX (.docx)" },
          { value: "odt", label: "ODT (.odt)" },
        ]
      : [
          { value: "tex", label: "TeX (.tex)" },
          { value: "latex", label: "LaTeX (.tex)" },
        ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-sm font-medium">
            {modeConfig.uploadLabel}
          </Label>
          <p className="text-xs text-foreground/70">{modeConfig.uploadHint}</p>
        </div>

        <div className="flex items-center gap-4">
          <Input
            id="file-upload"
            type="file"
            accept={modeConfig.accept}
            onChange={handleFileChange}
            disabled={isProcessing}
            className="flex-1"
          />
          {file && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              {file.name}
            </Badge>
          )}
        </div>
      </Card>

      {isProcessing && (
        <Card className="p-6 space-y-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <StepIcon className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">{currentStepConfig.label}</span>
          </div>

          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${currentStepConfig.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-foreground/60">
              <span>Processing on remote server...</span>
              <span>{currentStepConfig.progress}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            {(
              [
                "uploading",
                "processing",
                "converting",
                "downloading",
              ] as ConversionStep[]
            ).map((s, idx) => {
              const isActive = s === step;
              const isPast =
                STEP_CONFIG[s].progress < currentStepConfig.progress;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-1 ${
                    isActive
                      ? "text-primary font-medium"
                      : isPast
                        ? "text-green-500"
                        : "text-foreground/40"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isActive
                        ? "bg-primary animate-pulse"
                        : isPast
                          ? "bg-green-500"
                          : "bg-foreground/20"
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {STEP_CONFIG[s].label.split("...")[0]}
                  </span>
                  {idx < 3 && (
                    <span className="text-foreground/20 mx-2">-&gt;</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === "idle" && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Remote Publication Conversion</h3>
              <p className="text-sm text-foreground/70">
                Select your output format and quality profile. Conversion runs
                on the remote Pandoc pipeline with enhanced timeout and
                reliability handling.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="output-format" className="text-sm font-medium">
            Output Format
          </Label>
          <p className="text-xs text-foreground/70">
            Choose the output format for this conversion.
          </p>
        </div>
        <select
          id="output-format"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          disabled={isProcessing}
          className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          {outputFormatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quality-level" className="text-sm font-medium">
            Quality Profile
          </Label>
          <p className="text-xs text-foreground/70">
            Select how much structural and citation processing should be
            applied.
          </p>
        </div>
        <select
          id="quality-level"
          value={qualityLevel}
          onChange={(e) => setQualityLevel(e.target.value as QualityLevel)}
          disabled={isProcessing}
          className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          {QUALITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </Card>

      {mode === "latex-to-word" && (
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-journal" className="text-sm font-medium">
              Journal Template (Optional)
            </Label>
            <p className="text-xs text-foreground/70">
              Leave empty for auto-detection, or specify: elsevier,
              elsevier_cmig, ieee, springer, acm, ujn_thesis, zstu_thesis,
              generic
            </p>
          </div>

          <Input
            id="manual-journal"
            type="text"
            placeholder="e.g., elsevier_cmig, ujn_thesis, zstu_thesis"
            value={manualJournal}
            onChange={(e) => setManualJournal(e.target.value)}
            disabled={isProcessing}
          />
        </Card>
      )}

      <Button
        onClick={handleConvert}
        disabled={!file || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {currentStepConfig.label}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {modeConfig.convertButton}
          </>
        )}
      </Button>

      {error && step === "error" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Conversion Failed</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-3 text-xs opacity-70">
              Tip: Make sure the uploaded document is valid and self-contained.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {result?.success && step === "complete" && (
        <Card className="p-6 space-y-4 border-green-500/50 bg-green-500/5">
          <div className="flex items-start gap-3">
            <FileCheck className="h-6 w-6 text-green-500 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Conversion Successful!
                </h3>
                <p className="text-sm text-foreground/70">
                  {modeConfig.successText}
                  {result.durationMs &&
                    ` in ${formatDuration(result.durationMs)}`}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/50">
                {result.outputFormat && (
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">
                      Format
                    </div>
                    <div className="font-medium text-sm uppercase">
                      {result.outputFormat}
                    </div>
                  </div>
                )}
                {result.detectedJournal && (
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">
                      Journal
                    </div>
                    <div className="font-medium text-sm">
                      {result.detectedJournal}
                    </div>
                  </div>
                )}
                {result.outputSize && (
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">
                      File Size
                    </div>
                    <div className="font-medium text-sm">
                      {formatSize(result.outputSize)}
                    </div>
                  </div>
                )}
                {result.bibEntryCount !== undefined &&
                  result.bibEntryCount > 0 && (
                    <div>
                      <div className="text-xs text-foreground/60 mb-1">
                        Bibliography
                      </div>
                      <div className="font-medium text-sm">
                        {result.bibEntryCount} entries
                      </div>
                    </div>
                  )}
              </div>

              {result.warnings && result.warnings.length > 0 && (
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-600">
                    Warnings ({result.warningCount || result.warnings.length})
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                      {result.warnings.slice(0, 5).map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                      {result.warnings.length > 5 && (
                        <li className="text-foreground/50">
                          +{result.warnings.length - 5} more warnings
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleDownload} className="w-full" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Download Converted File
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
