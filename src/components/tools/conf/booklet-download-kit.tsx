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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  BOOKLET_DOWNLOAD_PARTS,
  BOOKLET_PART_GROUP_LABELS,
  buildBookletAssetUrl,
  type BookletPartGroup,
} from "@/lib/conf/booklet-download-catalog";
import JSZip from "jszip";

const GROUP_ORDER: BookletPartGroup[] = [
  "cover-pages",
  "interior-chrome",
  "section-dividers",
  "brand-logos",
  "source-photos",
];

const PREVIEW_PNG_SCALE = 2;
const DOWNLOAD_PNG_SCALE = 4;
const PREVIEW_OPEN_SCALE = 4;

export function BookletDownloadKit() {
  const [confId, setConfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const map = new Map<BookletPartGroup, typeof BOOKLET_DOWNLOAD_PARTS>();
    for (const g of GROUP_ORDER) {
      map.set(
        g,
        BOOKLET_DOWNLOAD_PARTS.filter((p) => p.group === g),
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
      const folder = zip.folder("lsuic-booklet-assets");
      if (!folder) throw new Error("Could not create zip folder");

      await Promise.all(
        BOOKLET_DOWNLOAD_PARTS.flatMap((part) => {
          if (part.kind === "static") {
            return [
              (async () => {
                const url = buildBookletAssetUrl(confId, part, {
                  format: "source",
                  download: false,
                });
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to fetch ${part.title}`);
                const blob = await res.blob();
                const ext = part.staticExt ?? "bin";
                folder.file(`${part.filenameBase}.${ext}`, blob);
              })(),
            ];
          }

          return [
            (async () => {
              const url = buildBookletAssetUrl(confId, part, {
                format: "png",
                download: false,
                scale: DOWNLOAD_PNG_SCALE,
              });
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Failed to fetch ${part.title} PNG`);
              const blob = await res.blob();
              folder.file(`${part.filenameBase}.png`, blob);
            })(),
            (async () => {
              const url = buildBookletAssetUrl(confId, part, {
                format: "svg",
                download: false,
              });
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Failed to fetch ${part.title} SVG`);
              const blob = await res.blob();
              folder.file(`${part.filenameBase}.svg`, blob);
            })(),
          ];
        }),
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `lsuic-booklet-assets-${confId}.zip`;
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
  }, [confId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading booklet assets…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4">
      <div className="flex flex-wrap items-start gap-4 border-b border-border/40 pb-4">
        <Link href="/tools/conf/booklet">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            LSUIC Booklet Asset Downloads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Download cover pages, interior chrome, logos, and source photography
            for assembling or customizing the conference booklet outside the
            in-app Booklet Builder.
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Generated page assets export at high resolution (4× PNG). SVG remains
            available for vector workflows. Items marked TBD are placeholder
            templates pending final design.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            Download all (ZIP)
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/conf/booklet">Booklet Builder</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/conf/letterhead">Letterhead Downloads</Link>
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
          <CardTitle className="text-base">How to use these assets</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            <ol className="list-decimal pl-4 space-y-1 mt-1">
              <li>Set page size to A4 (210 × 297 mm) in your layout tool.</li>
              <li>
                Use <strong>Cover page</strong> and <strong>Back cover</strong>{" "}
                as full-page backgrounds or reference art.
              </li>
              <li>
                For custom interior pages, combine{" "}
                <strong>Interior page header</strong> and{" "}
                <strong>Interior page footer</strong> with your content in the
                open area.
              </li>
              <li>
                Source photos and logos are included for supplementary layouts
                or external print vendors.
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
              {BOOKLET_PART_GROUP_LABELS[group]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {parts.map((part) => {
                const isGenerated = part.kind === "generated";
                const previewUrl =
                  confId && isGenerated
                    ? buildBookletAssetUrl(confId, part, {
                        format: "png",
                        download: false,
                        scale: PREVIEW_PNG_SCALE,
                      })
                    : confId && part.kind === "static"
                      ? buildBookletAssetUrl(confId, part, {
                          format: "source",
                          download: false,
                        })
                      : "#";
                const pngUrl =
                  confId && isGenerated
                    ? buildBookletAssetUrl(confId, part, {
                        format: "png",
                        scale: DOWNLOAD_PNG_SCALE,
                      })
                    : "#";
                const fullPreviewUrl =
                  confId && isGenerated
                    ? buildBookletAssetUrl(confId, part, {
                        format: "png",
                        download: false,
                        scale: PREVIEW_OPEN_SCALE,
                      })
                    : previewUrl;
                const svgUrl =
                  confId && isGenerated
                    ? buildBookletAssetUrl(confId, part, { format: "svg" })
                    : "#";
                const sourceUrl =
                  confId && part.kind === "static"
                    ? buildBookletAssetUrl(confId, part, { format: "source" })
                    : "#";
                const isStrip =
                  part.mode === "page-header" || part.mode === "page-footer";

                return (
                  <Card key={part.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm">{part.title}</CardTitle>
                        {part.tbd && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            TBD
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[11px] leading-snug">
                        {part.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {confId && (
                        <div
                          className={`overflow-hidden rounded-md border border-zinc-100 bg-zinc-50 ${
                            isStrip ? "px-2 py-2" : ""
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt={part.title}
                            className={`w-full object-contain object-top ${
                              isStrip
                                ? "max-h-24"
                                : group === "brand-logos" ||
                                    group === "source-photos"
                                  ? "max-h-44"
                                  : "max-h-56"
                            }`}
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {isGenerated && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs"
                              asChild
                            >
                              <a href={pngUrl} download>
                                <Download className="size-3.5" />
                                PNG (4×)
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
                          </>
                        )}
                        {part.kind === "static" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 text-xs"
                            asChild
                          >
                            <a href={sourceUrl} download>
                              <Download className="size-3.5" />
                              Download
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          asChild
                        >
                          <a
                            href={fullPreviewUrl}
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
