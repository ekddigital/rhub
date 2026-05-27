"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  Package,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  LETTERHEAD_DOWNLOAD_PARTS,
  LETTERHEAD_PART_GROUP_LABELS,
  buildLetterheadAssetUrl,
  type LetterheadPartGroup,
} from "@/lib/conf/letterhead-download-catalog";
import JSZip from "jszip";

const GROUP_ORDER: LetterheadPartGroup[] = [
  "first-page",
  "continuation",
  "full-layout",
];

const PREVIEW_PNG_SCALE = 4;
const DOWNLOAD_PNG_SCALE = 4;
const PREVIEW_OPEN_SCALE = 4;

export function LetterheadDownloadKit() {
  const [confId, setConfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOfficeLabel, setShowOfficeLabel] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchDefaultConference()
      .then((conf) => {
        if (mounted) setConfId(conf.id);
      })
      .catch(() => {
        if (mounted) setError("Could not load conference context.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<
      LetterheadPartGroup,
      typeof LETTERHEAD_DOWNLOAD_PARTS
    >();
    for (const g of GROUP_ORDER) {
      map.set(
        g,
        LETTERHEAD_DOWNLOAD_PARTS.filter((p) => p.group === g),
      );
    }
    return map;
  }, []);

  const downloadAllZip = useCallback(async () => {
    if (!confId) return;
    setZipping(true);
    setError(null);
    try {
      const zip = new JSZip();
      const folder = zip.folder("lsuic-letterhead-parts");
      if (!folder) throw new Error("Could not create zip folder");

      await Promise.all(
        LETTERHEAD_DOWNLOAD_PARTS.flatMap((part) => [
          (async () => {
            const url = buildLetterheadAssetUrl(confId, part, {
              format: "png",
              download: false,
              scale: DOWNLOAD_PNG_SCALE,
              showOfficeLabel,
            });
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${part.title} PNG`);
            const blob = await res.blob();
            folder.file(`${part.filenameBase}.png`, blob);
          })(),
          (async () => {
            const url = buildLetterheadAssetUrl(confId, part, {
              format: "svg",
              download: false,
              showOfficeLabel,
            });
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${part.title} SVG`);
            const blob = await res.blob();
            folder.file(`${part.filenameBase}.svg`, blob);
          })(),
        ]),
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `lsuic-letterhead-parts-${confId}${showOfficeLabel ? "" : "-no-office-label"}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Zip download failed. Try individual files.",
      );
    } finally {
      setZipping(false);
    }
  }, [confId, showOfficeLabel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading letterhead assets…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4">
      <div className="flex flex-wrap items-start gap-4 border-b border-border/40 pb-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            LSUIC Letterhead Downloads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Download header, sidebar, and footer images separately, then place
            them in Word, Google Docs, or similar tools. Use page 1 pieces on
            your first page; use continuation pieces on page 2 and beyond.
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            PNG downloads are exported at high resolution (4x). SVG remains
            available for vector workflows.
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Office label line is currently{" "}
            <strong>{showOfficeLabel ? "enabled" : "disabled"}</strong> for all
            previews and downloads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={showOfficeLabel ? "default" : "outline"}
            onClick={() => setShowOfficeLabel((v) => !v)}
          >
            Office label: {showOfficeLabel ? "On" : "Off"}
          </Button>
          <Button
            size="sm"
            disabled={!confId || zipping}
            onClick={() => void downloadAllZip()}
          >
            {zipping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Package className="size-4" />
            )}
            Download all (ZIP: PNG 4x + SVG)
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/conf/letters">Letter Composer</Link>
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="border-[#C8A061]/30 bg-[#C8A061]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How to assemble a letter</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            <ol className="list-decimal pl-4 space-y-1 mt-1">
              <li>Set page size to A4 (210 × 297 mm).</li>
              <li>
                Insert <strong>Header band (page 1)</strong> at the top; add
                your letter text in the open area to the right of the sidebar.
              </li>
              <li>
                Insert <strong>Left sidebar (page 1)</strong> on the left margin
                (send behind text if your editor supports layering).
              </li>
              <li>
                Insert <strong>Footer strip (page 1)</strong> at the bottom of
                page 1.
              </li>
              <li>
                On page 2+, use the <strong>continuation header</strong> and{" "}
                <strong>continuation footer</strong> instead.
              </li>
            </ol>
          </CardDescription>
        </CardHeader>
      </Card>

      {GROUP_ORDER.map((group) => {
        const parts = grouped.get(group) ?? [];
        if (parts.length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <h2 className="text-sm font-semibold text-[#002868]">
              {LETTERHEAD_PART_GROUP_LABELS[group]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {parts.map((part) => {
                const pngUrl = confId
                  ? buildLetterheadAssetUrl(confId, part, {
                      format: "png",
                      scale: DOWNLOAD_PNG_SCALE,
                      showOfficeLabel,
                    })
                  : "#";
                const previewPngUrl = confId
                  ? buildLetterheadAssetUrl(confId, part, {
                      format: "png",
                      download: false,
                      scale: PREVIEW_PNG_SCALE,
                      showOfficeLabel,
                    })
                  : "#";
                const fullPreviewPngUrl = confId
                  ? buildLetterheadAssetUrl(confId, part, {
                      format: "png",
                      download: false,
                      scale: PREVIEW_OPEN_SCALE,
                      showOfficeLabel,
                    })
                  : "#";
                const svgUrl = confId
                  ? buildLetterheadAssetUrl(confId, part, {
                      format: "svg",
                      showOfficeLabel,
                    })
                  : "#";
                const isHeaderPart =
                  part.mode === "header" || part.mode === "continuation-header";
                const isFooterPart =
                  part.mode === "footer" || part.mode === "continuation-footer";
                return (
                  <Card key={part.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{part.title}</CardTitle>
                      <CardDescription className="text-[11px] leading-snug">
                        {part.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {confId && part.mode !== "sidebar" && isHeaderPart && (
                        <div className="overflow-x-auto rounded-md border border-zinc-100 bg-zinc-50 px-2 py-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewPngUrl}
                            alt={part.title}
                            className="h-44 w-auto min-w-2xl max-w-none object-contain object-top"
                          />
                        </div>
                      )}
                      {confId && part.mode !== "sidebar" && !isHeaderPart && (
                        <div className="overflow-hidden rounded-md border border-zinc-100 bg-zinc-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewPngUrl}
                            alt={part.title}
                            className={`w-full object-contain object-top ${
                              isFooterPart ? "max-h-24" : "max-h-44"
                            }`}
                          />
                        </div>
                      )}
                      {confId && part.mode === "sidebar" && (
                        <div className="flex h-48 items-stretch overflow-hidden rounded-md border border-zinc-100 bg-zinc-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewPngUrl}
                            alt={part.title}
                            className="h-full w-full object-cover object-top-left"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs"
                          asChild
                        >
                          <a href={pngUrl} download>
                            <Download className="size-3.5" />
                            PNG (4x)
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          asChild
                        >
                          <a href={svgUrl} download>
                            <FileImage className="size-3.5" />
                            SVG
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          asChild
                        >
                          <a
                            href={fullPreviewPngUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="size-3.5" />
                            Preview
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
