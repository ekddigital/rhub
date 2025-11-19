"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionOptions {
  includeAbstract: boolean;
  includeKeywords: boolean;
  includeNotes: boolean;
  escapeLatex: boolean;
  citationStyle: "bibtex" | "biblatex" | "acm";
}

interface ConversionResponse {
  bibtex: string;
  warnings?: string[];
  entryCount: number;
  durationMs: number;
}

export function ConverterShell() {
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    includeAbstract: false,
    includeKeywords: true,
    includeNotes: false,
    escapeLatex: true,
    citationStyle: "bibtex",
  });
  const [result, setResult] = useState<ConversionResponse | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy BibTeX");

  const hasInput = Boolean(input.trim());

  useEffect(() => {
    setCopyLabel("Copy BibTeX");
  }, [result]);

  async function handleConvert() {
    setIsConverting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tools/ref/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, options, fileName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Conversion failed");
      }

      const data = (await response.json()) as ConversionResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsConverting(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setInput(text);
    setFileName(file.name);
  }

  async function handleCopy() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.bibtex);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    } finally {
      setTimeout(() => setCopyLabel("Copy BibTeX"), 1800);
    }
  }

  function handleDownload() {
    if (!result) return;

    const blob = new Blob([result.bibtex], {
      type: "text/x-bibtex;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName ?? "ekd-reference"}.bib`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Card className="space-y-4 border-white/10 bg-card/80 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept=".xml,.ris,.enl,.txt"
              onChange={handleFile}
            />
            <span className="text-xs text-foreground/60">
              Supported: EndNote XML, RIS, and enriched XML exports
            </span>
          </div>
          {fileName && (
            <p className="text-xs text-foreground/60">
              Loaded file: <span className="font-semibold">{fileName}</span>
            </p>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste XML, RIS, or EndNote exports here"
            className="min-h-80 bg-black/10"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleConvert}
              disabled={!hasInput || isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <WandSparkles className="size-4" />
                  Convert to BibTeX
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInput("");
                setFileName(null);
              }}
            >
              Clear
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="border-white/10 bg-card/90 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground/60">Entries converted</p>
                <p className="text-3xl font-semibold text-foreground">
                  {result.entryCount}
                </p>
              </div>
              <Badge variant="secondary">{result.durationMs} ms</Badge>
            </div>
            <Textarea
              className="mt-4 min-h-[260px]"
              readOnly
              value={result.bibtex}
            />
            <div className="mt-3 flex gap-3">
              <Button variant="secondary" onClick={handleCopy}>
                {copyLabel}
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                Download .bib
              </Button>
            </div>
            {result.warnings && result.warnings.length > 0 && (
              <Alert className="mt-4 border-amber-500/40 bg-amber-500/10 text-amber-100">
                <AlertTriangle className="size-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Conversion failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <aside className="space-y-6">
        <Card className="border-white/10 bg-card/80 p-6">
          <h3 className="font-semibold text-foreground">Conversion options</h3>
          <div className="mt-4 space-y-4 text-sm">
            {[
              {
                key: "includeAbstract",
                label: "Include abstract",
                description: "Append <abstract> nodes as BibTeX abstracts",
              },
              {
                key: "includeKeywords",
                label: "Capture keywords",
                description:
                  "Normalize keyword lists into comma-separated tags",
              },
              {
                key: "escapeLatex",
                label: "Escape LaTeX characters",
                description: "Protect &, %, _, and math glyphs",
              },
            ].map((setting) => (
              <label
                key={setting.key}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-3 transition",
                  options[setting.key as keyof ConversionOptions]
                    ? "bg-[#1F1C18]/60 text-white"
                    : "bg-transparent text-foreground/70"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(
                    options[setting.key as keyof ConversionOptions]
                  )}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      [setting.key]: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="block text-sm font-medium">
                    {setting.label}
                  </span>
                  <span className="text-xs text-foreground/70">
                    {setting.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>
        <Card className="border-white/10 bg-card/80 p-6">
          <h3 className="font-semibold text-foreground">Format intelligence</h3>
          <p className="mt-3 text-sm text-foreground/70">
            We auto-detect EndNote XML, RIS, and plain XML. Semantic Scholar and
            CrossRef enrichment can be toggled per job once APIs are wired.
            Every conversion is logged to ConversionJobs for reproducibility.
          </p>
        </Card>
      </aside>
    </div>
  );
}
