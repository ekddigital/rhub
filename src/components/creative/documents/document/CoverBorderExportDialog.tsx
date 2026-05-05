"use client";

/**
 * CoverBorderExportDialog
 *
 * Allows the user to download isolated document assets as images:
 *  - Full cover page (with or without text)
 *  - Page border / frame only (blank, no content)
 *  - Header strip only
 *  - Footer strip only
 *  - Sidebar / corner decorations only
 *
 * Downloads as PNG or JPEG at high resolution (3× scale = 300 DPI equiv.)
 * Uses html-to-image for reliable rendering of inline-styled React elements.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toPng, toJpeg } from "html-to-image";
import { Download, Image as ImageIcon, Loader2, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/creative/ui/dialog";
import { Button } from "@/components/creative/ui/button";
import { Label } from "@/components/creative/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Switch } from "@/components/creative/ui/switch";
import { Separator } from "@/components/creative/ui/separator";
import { toast } from "sonner";

import { CoverPage } from "./CoverPage";
import { PageFrame, TopRightBanner } from "./CornerDecorations";
import { FirstPageHeader } from "./FirstPageHeader";
import { SubsequentPageHeader } from "./SubsequentPageHeader";
import { Footer } from "./Footer";
import { A4, LETTERHEAD } from "@/lib/creative/documents/constants";
import type { DocumentMeta, CoverStyle } from "@/lib/creative/documents/types";

/* ─── Types ─────────────────────────────────────────────────────── */

type AssetType =
  | "cover"
  | "frame"
  | "header-first"
  | "header-subsequent"
  | "footer"
  | "sidebar";

type ImageFormat = "png" | "jpeg";

interface AssetOption {
  value: AssetType;
  label: string;
  description: string;
  width: number;
  height: number;
}

const ASSET_OPTIONS: AssetOption[] = [
  {
    value: "cover",
    label: "Cover Page",
    description: "Full A4 cover with company branding",
    width: A4.px96.width,
    height: A4.px96.height,
  },
  {
    value: "frame",
    label: "Page Border / Frame",
    description: "Full A4 gold border frame (first page style)",
    width: A4.px96.width,
    height: A4.px96.height,
  },
  {
    value: "header-first",
    label: "First Page Header",
    description: "Header with logo, company name, and contact info",
    width: A4.px96.width,
    height: 172,
  },
  {
    value: "header-subsequent",
    label: "Subsequent Page Header",
    description: "Slim header with gold divider for page 2+",
    width: A4.px96.width,
    height: 100,
  },
  {
    value: "footer",
    label: "Footer Band",
    description: "Gold footer band with company name",
    width: A4.px96.width,
    height: 64,
  },
  {
    value: "sidebar",
    label: "Sidebar / Left Strip",
    description: "Left gold accent strip with diagonal accent",
    width: 80,
    height: A4.px96.height,
  },
];

/* ─── Silent render container ───────────────────────────────────── */
// Strategy: wrap the capture target inside a zero-size clipping div that is
// position:fixed at (0,0). The outer wrapper is invisible to the user
// (overflow:hidden, width/height:0) but the browser DOES paint the child,
// which is what html-to-image needs. The ref points to the inner element —
// the exact node passed to toPng/toJpeg.

interface RenderContainerProps {
  assetType: AssetType;
  meta: DocumentMeta;
  withText: boolean;
  /** Ref attached to the INNER capture target (not the clipping wrapper) */
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
}

function RenderContainer({
  assetType,
  meta,
  withText,
  containerRef,
  onReady,
}: RenderContainerProps) {
  const option = ASSET_OPTIONS.find((o) => o.value === assetType)!;

  // Signal parent once we've mounted and the browser has had a chance to paint
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      // Second rAF ensures we're past the first paint
      requestAnimationFrame(() => {
        onReady?.();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [assetType, withText, onReady]);

  /** Outer: zero-size clipping box — browser still renders the child */
  const clipWrapperStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    overflow: "hidden",
    zIndex: 9999,
    pointerEvents: "none",
  };

  /** Inner: the actual pixel-perfect capture target */
  const innerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: `${option.width}px`,
    height: `${option.height}px`,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  };

  const renderContent = () => {
    switch (assetType) {
      case "cover":
        return (
          <div style={{ width: option.width, height: option.height }}>
            {withText ? (
              <CoverPage meta={meta} />
            ) : (
              <CoverPageBlanked meta={meta} />
            )}
          </div>
        );

      case "frame":
        return (
          <div
            style={{
              width: option.width,
              height: option.height,
              position: "relative",
              backgroundColor: "#FFFFFF",
            }}
          >
            <PageFrame isFirstPage />
            {withText && <TopRightBanner />}
          </div>
        );

      case "header-first":
        return (
          <div
            style={{
              width: option.width,
              height: option.height,
              position: "relative",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            {/* Gold top bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "36px",
                backgroundColor: LETTERHEAD.goldColor,
              }}
            />
            {/* Gold left strip */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "34px",
                height: "100%",
                backgroundColor: LETTERHEAD.goldColor,
              }}
            />
            {/* Gold right panel */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "28px",
                height: "100%",
                backgroundColor: LETTERHEAD.goldColor,
              }}
            />
            {withText && <FirstPageHeader />}
          </div>
        );

      case "header-subsequent":
        return (
          <div
            style={{
              width: option.width,
              height: option.height,
              position: "relative",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            {/* Gold top bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "36px",
                backgroundColor: LETTERHEAD.goldColor,
              }}
            />
            {/* Gold left strip */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "34px",
                height: "100%",
                backgroundColor: LETTERHEAD.goldColor,
              }}
            />
            {withText && <SubsequentPageHeader />}
          </div>
        );

      case "footer":
        return (
          <div
            style={{
              width: option.width,
              height: option.height,
              position: "relative",
              backgroundColor: LETTERHEAD.goldColor,
              overflow: "hidden",
            }}
          >
            {withText && (
              <Footer pageNumber={1} totalPages={1} numberStyle="arabic" />
            )}
          </div>
        );

      case "sidebar":
        return (
          <div
            style={{
              width: option.width,
              height: option.height,
              position: "relative",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            {/* Left gold strip */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "34px",
                height: "100%",
                backgroundColor: LETTERHEAD.goldColor,
              }}
            />
            {/* Diagonal accent */}
            <svg
              width={option.width}
              height={option.height}
              style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
            >
              <polygon
                points={`0,790 ${34 + 16},${790 + 12} ${34 + 16},${790 + 52} 0,${790 + 64}`}
                fill={LETTERHEAD.goldColor}
              />
              <polygon
                points={`0,${790 + 10} ${34 + 10},${790 + 18} ${34 + 10},${790 + 44} 0,${790 + 52}`}
                fill={LETTERHEAD.primaryColor}
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div style={clipWrapperStyle} aria-hidden="true">
      <div ref={containerRef} style={innerStyle}>
        {renderContent()}
      </div>
    </div>
  );
}

/* ─── Blanked cover (frame + logo, no text) ─────────────────────── */
function CoverPageBlanked({ meta }: { meta: DocumentMeta }) {
  // Use blankMode prop — suppresses all variable text while keeping graphic elements
  return <CoverPage meta={meta} blankMode />;
}

/* ─── Main Dialog ────────────────────────────────────────────────── */

interface CoverBorderExportDialogProps {
  meta: DocumentMeta;
  /** Optional trigger override */
  trigger?: React.ReactNode;
}

export function CoverBorderExportDialog({
  meta,
  trigger,
}: CoverBorderExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>("cover");
  const [imageFormat, setImageFormat] = useState<ImageFormat>("png");
  const [withText, setWithText] = useState(true);
  const [loading, setLoading] = useState(false);
  /** True once RenderContainer signals it has painted */
  const [renderReady, setRenderReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset ready flag whenever the options change so we re-wait for paint
  useEffect(() => {
    setRenderReady(false);
  }, [assetType, withText, open]);

  const handleRenderReady = useCallback(() => {
    setRenderReady(true);
  }, []);

  const selectedOption = ASSET_OPTIONS.find((o) => o.value === assetType)!;

  const handleDownload = useCallback(async () => {
    const el = containerRef.current;
    if (!el) {
      toast.error("Render element not ready — please try again.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Generating ${selectedOption.label}…`);

    try {
      const pixelRatio = 3; // 3× = ~288 DPI equivalent for A4 at 96 DPI

      // Wait for any images inside the capture target to finish loading.
      // This is critical for the logo in CoverPage.
      const imgEls = Array.from(el.querySelectorAll("img"));
      await Promise.all(
        imgEls.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // still continue on error
              }),
        ),
      );

      // Give the browser one more frame to finish any CSS paint work
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const sharedOpts = {
        pixelRatio,
        backgroundColor: "#FFFFFF",
        width: selectedOption.width,
        height: selectedOption.height,
        // Inline the element's own computed styles so cloning is accurate
        style: { margin: "0", padding: "0", overflow: "hidden" },
        // Bust cache on assets so CORS/cached-response issues don't blank images
        cacheBust: true,
      };

      const dataUrl =
        imageFormat === "png"
          ? await toPng(el, sharedOpts)
          : await toJpeg(el, { ...sharedOpts, quality: 0.95 });

      // Sanity check: a truly blank PNG is ~tiny; the cover should be >50 KB
      if (dataUrl.length < 1000) {
        throw new Error(
          "Output image is unexpectedly small — the element may not have painted.",
        );
      }

      const textSuffix = withText ? "" : "_blank";
      const filename = `ekd-${assetType}${textSuffix}.${imageFormat}`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${filename}`, { id: toastId });
    } catch (err) {
      console.error("[CoverBorderExport]", err);
      toast.error(
        err instanceof Error ? err.message : "Export failed — see console.",
        { id: toastId },
      );
    } finally {
      setLoading(false);
    }
  }, [assetType, imageFormat, withText, selectedOption]);

  const canToggleText = assetType !== "footer" && assetType !== "sidebar";

  return (
    <>
      {/* Off-screen render target — mounted when dialog open, signals ready via onReady */}
      {open && (
        <RenderContainer
          assetType={assetType}
          meta={meta}
          withText={withText}
          containerRef={containerRef}
          onReady={handleRenderReady}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              title="Export cover, border, or header/footer as image"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Export Assets
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#C8A061]" />
              Export Document Assets
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">
              Download individual document components as high-resolution images
              (3× / ~288 DPI) to use in Word, Canva, or other tools.
            </p>

            {/* Asset Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Asset to export</Label>
              <Select
                value={assetType}
                onValueChange={(v) => setAssetType(v as AssetType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Dimension preview */}
              <p className="text-[11px] text-muted-foreground pl-0.5">
                Output: {selectedOption.width * 3} × {selectedOption.height * 3}{" "}
                px at 3× scale
              </p>
            </div>

            {/* Include text toggle */}
            {canToggleText && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Include text & content
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {withText
                      ? "Text, titles, and metadata are visible"
                      : "Pure graphic — no text, clean template"}
                  </p>
                </div>
                <Switch
                  checked={withText}
                  onCheckedChange={setWithText}
                  className="data-[state=checked]:bg-[#C8A061]"
                />
              </div>
            )}

            <Separator />

            {/* Image format */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Image format</Label>
              <div className="flex gap-2">
                {(["png", "jpeg"] as ImageFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setImageFormat(fmt)}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                      imageFormat === fmt
                        ? "border-[#C8A061] bg-[#C8A061]/10 text-[#C8A061]"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {fmt.toUpperCase()}
                    {fmt === "png" && (
                      <span className="block text-[10px] font-normal opacity-70">
                        lossless, transparent support
                      </span>
                    )}
                    {fmt === "jpeg" && (
                      <span className="block text-[10px] font-normal opacity-70">
                        smaller file, white bg
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Download button */}
            <Button
              className="w-full bg-[#C8A061] hover:bg-[#b8914f] text-white"
              onClick={handleDownload}
              disabled={loading || !renderReady}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedOption.label}
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              Use the downloaded image as a background or overlay in Word,
              Canva, PowerPoint, or any design tool.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
