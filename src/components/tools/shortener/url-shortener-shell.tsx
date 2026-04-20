"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Link,
  Loader2,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  QrCode,
  Download,
  ImagePlus,
  Type,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  History,
} from "lucide-react";
import QRCodeLib from "qrcode";

interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  customSlug: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface UrlStats {
  clicks: number;
  lastClickAt: string | null;
  createdAt: string;
}

interface LinkRecord {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  customSlug: string | null;
  clicks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  lastClickAt: string | null;
}

interface HistoryMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface EditDraft {
  id: string;
  originalUrl: string;
  customSlug: string;
  expiresIn: string; // days, empty = no change, "0" = remove expiry
}

type CenterMode = "text" | "logo";

interface QrCenter {
  mode: CenterMode;
  text: string;
  logoDataUrl: string | null;
}

export function UrlShortenerShell() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresIn, setExpiresIn] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ShortenedUrl | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<UrlStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCenter, setQrCenter] = useState<QrCenter>({
    mode: "text",
    text: "R",
    logoDataUrl: null,
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Link History ─────────────────────────────────────────────────────────
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [historyMeta, setHistoryMeta] = useState<HistoryMeta>({
    total: 0, page: 1, limit: 10, pages: 1,
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState("");
  const [historySearchInput, setHistorySearchInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (page: number, search: string) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/tools/shorten?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLinks(data.data);
        setHistoryMeta(data.meta);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    fetchHistory(1, "");
  }, [fetchHistory]);

  // Reload after new shorten
  const refreshHistory = useCallback(() => {
    fetchHistory(historyPage, historySearch);
  }, [fetchHistory, historyPage, historySearch]);

  const handleHistorySearch = () => {
    setHistoryPage(1);
    setHistorySearch(historySearchInput);
    fetchHistory(1, historySearchInput);
  };

  const handlePageChange = (newPage: number) => {
    setHistoryPage(newPage);
    fetchHistory(newPage, historySearch);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (link: LinkRecord) => {
    setEditDraft({
      id: link.id,
      originalUrl: link.originalUrl,
      customSlug: link.customSlug ?? "",
      expiresIn: "",
    });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditDraft(null);
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    setEditSaving(true);
    setEditError("");
    try {
      const body: Record<string, unknown> = { id: editDraft.id };
      if (editDraft.originalUrl.trim()) body.originalUrl = editDraft.originalUrl.trim();
      if (editDraft.customSlug.trim() !== "") body.customSlug = editDraft.customSlug.trim();
      else body.customSlug = null;
      if (editDraft.expiresIn === "0") body.expiresIn = null;
      else if (editDraft.expiresIn !== "") body.expiresIn = Number(editDraft.expiresIn);

      const res = await fetch("/api/tools/shorten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Failed to save");
        return;
      }
      setEditDraft(null);
      refreshHistory();
    } catch (err) {
      setEditError("An error occurred");
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const toggleActive = async (link: LinkRecord) => {
    try {
      await fetch("/api/tools/shorten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, isActive: !link.isActive }),
      });
      refreshHistory();
    } catch (err) {
      console.error("Failed to toggle link", err);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await fetch(`/api/tools/shorten?id=${deleteConfirmId}`, { method: "DELETE" });
      setDeleteConfirmId(null);
      refreshHistory();
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Copy short URL ────────────────────────────────────────────────────────
  const copyLink = async (shortUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate QR code when result is available
  useEffect(() => {
    if (result?.shortUrl) {
      generateQRCode(result.shortUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Regenerate composite whenever center settings change
  useEffect(() => {
    if (result?.shortUrl) {
      generateQRCode(result.shortUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCenter]);

  const generateQRCode = useCallback(
    async (targetUrl: string) => {
      try {
        const SIZE = 600;
        const CENTER_R = 52; // radius of the white backing circle
        const LOGO_R = 44; // radius of the gold circle / logo clip

        // 1. Render raw QR to data URL
        const rawDataUrl = await QRCodeLib.toDataURL(targetUrl, {
          width: SIZE,
          margin: 2,
          color: { dark: "#1F1C18", light: "#FFFFFF" },
          errorCorrectionLevel: "H",
        });

        // 2. Composite on canvas
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw QR
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, SIZE, SIZE);
            resolve();
          };
          img.src = rawDataUrl;
        });

        const cx = SIZE / 2;
        const cy = SIZE / 2;

        // White backing circle
        ctx.beginPath();
        ctx.arc(cx, cy, CENTER_R, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        if (qrCenter.mode === "logo" && qrCenter.logoDataUrl) {
          // Draw uploaded logo clipped to circle
          await new Promise<void>((resolve) => {
            const logo = new window.Image();
            logo.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, LOGO_R, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(
                logo,
                cx - LOGO_R,
                cy - LOGO_R,
                LOGO_R * 2,
                LOGO_R * 2,
              );
              ctx.restore();
              resolve();
            };
            logo.src = qrCenter.logoDataUrl!;
          });
        } else {
          // Gold circle with text
          ctx.beginPath();
          ctx.arc(cx, cy, LOGO_R, 0, Math.PI * 2);
          ctx.fillStyle = "#C8A030";
          ctx.fill();

          const label = qrCenter.text.trim() || "R";
          const fontSize =
            label.length === 1 ? 42 : label.length <= 3 ? 28 : 18;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "#1F1C18";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, cx, cy);
        }

        setQrCode(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    },
    [qrCenter],
  );

  const handleShorten = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setStats(null);

    try {
      const response = await fetch("/api/tools/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          customSlug: customSlug.trim() || undefined,
          expiresIn: expiresIn || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to shorten URL");
        return;
      }

      setResult(data.data);
      setUrl("");
      setCustomSlug("");
      setExpiresIn("");
      // Refresh history to include new link
      fetchHistory(1, historySearch);
      setHistoryPage(1);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const fetchStats = async () => {
    if (!result) return;

    setLoadingStats(true);
    try {
      const code = result.customSlug || result.shortCode;
      const response = await fetch(`/api/tools/shorten?code=${code}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setQrCenter((prev) => ({ ...prev, mode: "logo", logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.download = `qr-${
      result?.customSlug || result?.shortCode || "code"
    }.png`;
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

        {/* ── LEFT COLUMN: form + result + how it works ─────────────── */}
        <div className="space-y-6">

      {/* Input Section */}
      <Card className="p-6 border-ekd-charcoal/10 dark:border-ekd-light-gray/10">
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Long URL <span className="text-ekd-maroon">*</span>
            </label>
            <Textarea
              id="url"
              placeholder="https://example.com/very/long/url/that/needs/shortening..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="customSlug"
                className="block text-sm font-medium mb-2"
              >
                Custom Slug (Optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ekd-charcoal/60 dark:text-ekd-light-gray/60 whitespace-nowrap">
                  rhub.ekddigital.com/s/
                </span>
                <Input
                  id="customSlug"
                  placeholder="my-link"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-ekd-charcoal/50 dark:text-ekd-light-gray/50 mt-1">
                Letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div>
              <label
                htmlFor="expiresIn"
                className="block text-sm font-medium mb-2"
              >
                Expires In (Days)
              </label>
              <Input
                id="expiresIn"
                type="number"
                placeholder="Never expires"
                value={expiresIn}
                onChange={(e) =>
                  setExpiresIn(e.target.value ? Number(e.target.value) : "")
                }
                min="1"
              />
              <p className="text-xs text-ekd-charcoal/50 dark:text-ekd-light-gray/50 mt-1">
                Leave empty for permanent links
              </p>
            </div>
          </div>

          <Button
            onClick={handleShorten}
            disabled={loading || !url.trim()}
            className="w-full bg-ekd-gold hover:bg-ekd-gold/90 text-ekd-charcoal"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Shortening...
              </>
            ) : (
              <>
                <Link className="mr-2 h-4 w-4" />
                Shorten URL
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {/* Result Section */}
      {result && (
        <Card className="p-6 border-ekd-gold/20 bg-ekd-gold/5 dark:bg-ekd-gold/10">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <h3 className="font-semibold text-ekd-charcoal dark:text-ekd-light-gray">
                    URL Shortened Successfully!
                  </h3>
                </div>

                <div className="bg-white dark:bg-ekd-charcoal/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-ekd-charcoal/60 dark:text-ekd-light-gray/60 mb-1">
                      Short URL
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={result.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ekd-gold hover:text-ekd-light-gold font-medium break-all"
                      >
                        {result.shortUrl}
                      </a>
                      <ExternalLink className="h-4 w-4 text-ekd-gold/60 flex-shrink-0" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-ekd-charcoal/60 dark:text-ekd-light-gray/60 mb-1">
                      Original URL
                    </p>
                    <p className="text-sm text-ekd-charcoal/80 dark:text-ekd-light-gray/80 break-all">
                      {result.originalUrl}
                    </p>
                  </div>

                  {result.expiresAt && (
                    <div>
                      <p className="text-xs text-ekd-charcoal/60 dark:text-ekd-light-gray/60 mb-1">
                        Expires
                      </p>
                      <p className="text-sm text-ekd-charcoal/80 dark:text-ekd-light-gray/80">
                        {new Date(result.expiresAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowQrCode(!showQrCode)}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {showQrCode ? "Hide QR Code" : "Show QR Code"}
              </Button>

              <Button
                onClick={fetchStats}
                disabled={loadingStats}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {loadingStats ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Stats
                  </>
                )}
              </Button>
            </div>

            {/* QR Code Display */}
            {showQrCode && qrCode && (
              <div className="bg-white dark:bg-ekd-charcoal/50 rounded-lg p-6 mt-4 space-y-5">
                <h4 className="font-medium text-ekd-charcoal dark:text-ekd-light-gray text-center">
                  QR Code
                </h4>

                {/* Center customization */}
                <div className="rounded-lg border border-ekd-charcoal/10 dark:border-ekd-light-gray/10 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ekd-charcoal/60 dark:text-ekd-light-gray/60">
                    Center Badge
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={qrCenter.mode === "text" ? "default" : "outline"}
                      className={
                        qrCenter.mode === "text"
                          ? "bg-ekd-gold text-ekd-charcoal"
                          : ""
                      }
                      onClick={() =>
                        setQrCenter((p) => ({ ...p, mode: "text" }))
                      }
                    >
                      <Type className="mr-1.5 h-3.5 w-3.5" />
                      Text
                    </Button>
                    <Button
                      size="sm"
                      variant={qrCenter.mode === "logo" ? "default" : "outline"}
                      className={
                        qrCenter.mode === "logo"
                          ? "bg-ekd-gold text-ekd-charcoal"
                          : ""
                      }
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                      Upload Logo
                    </Button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>

                  {qrCenter.mode === "text" && (
                    <div className="flex items-center gap-3">
                      <Label htmlFor="centerText" className="text-sm shrink-0">
                        Badge text
                      </Label>
                      <Input
                        id="centerText"
                        value={qrCenter.text}
                        onChange={(e) =>
                          setQrCenter((p) => ({
                            ...p,
                            text: e.target.value.slice(0, 12),
                          }))
                        }
                        placeholder="R"
                        className="max-w-45"
                      />
                      <span className="text-xs text-ekd-charcoal/50">
                        {qrCenter.text.length}/12
                      </span>
                    </div>
                  )}

                  {qrCenter.mode === "logo" && qrCenter.logoDataUrl && (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCenter.logoDataUrl}
                        alt="Center logo"
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() =>
                          setQrCenter((p) => ({
                            ...p,
                            mode: "text",
                            logoDataUrl: null,
                          }))
                        }
                      >
                        Remove logo
                      </Button>
                    </div>
                  )}
                </div>

                {/* QR preview */}
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-ekd-charcoal/70 dark:text-ekd-light-gray/70 text-center max-w-sm">
                    Scan this QR code to quickly access your shortened URL
                  </p>
                  <Button
                    onClick={downloadQRCode}
                    variant="default"
                    className="bg-ekd-gold hover:bg-ekd-gold/90 text-ekd-charcoal"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            )}

            {/* Stats Display */}
            {stats && (
              <div className="bg-white dark:bg-ekd-charcoal/50 rounded-lg p-4 mt-4">
                <h4 className="font-medium mb-3 text-ekd-charcoal dark:text-ekd-light-gray">
                  Link Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-ekd-charcoal/60 dark:text-ekd-light-gray/60">
                      Total Clicks
                    </p>
                    <p className="text-2xl font-bold text-ekd-gold">
                      {stats.clicks}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ekd-charcoal/60 dark:text-ekd-light-gray/60">
                      Last Clicked
                    </p>
                    <p className="text-sm text-ekd-charcoal dark:text-ekd-light-gray">
                      {stats.lastClickAt
                        ? new Date(stats.lastClickAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Information Section */}
      <Card className="p-6 border-ekd-charcoal/10 dark:border-ekd-light-gray/10">
        <h3 className="font-semibold mb-3 text-ekd-charcoal dark:text-ekd-light-gray">
          How It Works
        </h3>
        <ul className="space-y-2 text-sm text-ekd-charcoal/80 dark:text-ekd-light-gray/80">
          <li className="flex items-start gap-2">
            <span className="text-ekd-gold mt-0.5">•</span>
            <span>Enter any long URL you want to shorten</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ekd-gold mt-0.5">•</span>
            <span>Optionally customize the slug for a memorable link</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ekd-gold mt-0.5">•</span>
            <span>Set an expiration date if you want the link to expire</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ekd-gold mt-0.5">•</span>
            <span>
              Track clicks and view statistics for your shortened URLs
            </span>
          </li>
        </ul>
      </Card>

        </div>{/* end LEFT COLUMN */}

        {/* ── RIGHT COLUMN: Link History (sticky) ──────────────────────── */}
        <div className="lg:sticky lg:top-24">

      {/* ── Link History ─────────────────────────────────────────────────── */}
      <Card className="p-6 border-ekd-charcoal/10 dark:border-ekd-light-gray/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-ekd-gold" />
            <h3 className="font-semibold text-ekd-charcoal dark:text-ekd-light-gray">
              Link History
              {historyMeta.total > 0 && (
                <span className="ml-2 text-xs font-normal text-ekd-charcoal/50 dark:text-ekd-light-gray/50">
                  ({historyMeta.total} total)
                </span>
              )}
            </h3>
          </div>
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search links…"
              value={historySearchInput}
              onChange={(e) => setHistorySearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHistorySearch()}
              className="w-48 sm:w-60"
            />
            <Button size="icon" variant="outline" onClick={handleHistorySearch}>
              <Search className="h-4 w-4" />
            </Button>
            {historySearch && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setHistorySearchInput("");
                  setHistorySearch("");
                  setHistoryPage(1);
                  fetchHistory(1, "");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12 text-ekd-charcoal/50 dark:text-ekd-light-gray/50">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : links.length === 0 ? (
          <p className="text-center py-10 text-sm text-ekd-charcoal/50 dark:text-ekd-light-gray/50">
            {historySearch ? "No links match your search." : "No links yet. Shorten your first URL above!"}
          </p>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {links.map((link) => {
              const isEditing = editDraft?.id === link.id;
              const isDeleteTarget = deleteConfirmId === link.id;

              return (
                <div
                  key={link.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    !link.isActive
                      ? "border-ekd-charcoal/10 dark:border-ekd-light-gray/10 opacity-60"
                      : "border-ekd-charcoal/10 dark:border-ekd-light-gray/10"
                  }`}
                >
                  {isEditing ? (
                    /* ── Edit form ─────────────────────────────────────── */
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs mb-1 block">Original URL</Label>
                        <Input
                          value={editDraft.originalUrl}
                          onChange={(e) =>
                            setEditDraft((d) => d && { ...d, originalUrl: e.target.value })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">
                            Custom slug{" "}
                            <span className="text-ekd-charcoal/40 dark:text-ekd-light-gray/40 font-normal">
                              (leave blank to clear)
                            </span>
                          </Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-ekd-charcoal/50 shrink-0">
                              /s/
                            </span>
                            <Input
                              value={editDraft.customSlug}
                              onChange={(e) =>
                                setEditDraft((d) => d && { ...d, customSlug: e.target.value })
                              }
                              placeholder={link.shortCode}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Extend expiry{" "}
                            <span className="text-ekd-charcoal/40 dark:text-ekd-light-gray/40 font-normal">
                              (days, 0 = remove)
                            </span>
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={editDraft.expiresIn}
                            onChange={(e) =>
                              setEditDraft((d) => d && { ...d, expiresIn: e.target.value })
                            }
                            placeholder="Unchanged"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      {editError && (
                        <p className="text-xs text-red-500">{editError}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="bg-ekd-gold hover:bg-ekd-gold/90 text-ekd-charcoal"
                          onClick={saveEdit}
                          disabled={editSaving}
                        >
                          {editSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : isDeleteTarget ? (
                    /* ── Delete confirm ────────────────────────────────── */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <p className="text-sm text-ekd-charcoal dark:text-ekd-light-gray flex-1">
                        Delete{" "}
                        <span className="font-mono text-ekd-gold">
                          {link.customSlug ?? link.shortCode}
                        </span>
                        ? This cannot be undone.
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={confirmDelete}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal row ────────────────────────────────────── */
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Short URL row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-ekd-gold hover:underline break-all"
                          >
                            {link.shortUrl}
                          </a>
                          <button
                            onClick={() => copyLink(link.shortUrl, link.id)}
                            className="text-ekd-charcoal/40 hover:text-ekd-gold transition-colors shrink-0"
                            title="Copy"
                          >
                            {copiedId === link.id ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ekd-charcoal/30 hover:text-ekd-gold shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        {/* Original URL */}
                        <p className="text-xs text-ekd-charcoal/60 dark:text-ekd-light-gray/60 break-all line-clamp-1">
                          {link.originalUrl}
                        </p>
                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ekd-charcoal/50 dark:text-ekd-light-gray/50 pt-0.5">
                          <span>{link.clicks} click{link.clicks !== 1 ? "s" : ""}</span>
                          <span>
                            Created{" "}
                            {new Date(link.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {link.expiresAt && (
                            <span
                              className={
                                new Date(link.expiresAt) < new Date()
                                  ? "text-red-400"
                                  : ""
                              }
                            >
                              Expires{" "}
                              {new Date(link.expiresAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {!link.isActive && (
                            <span className="text-red-400 font-medium">Disabled</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(link)}
                          title={link.isActive ? "Disable link" : "Enable link"}
                          className="p-1.5 rounded hover:bg-ekd-charcoal/5 dark:hover:bg-ekd-light-gray/5 transition-colors text-ekd-charcoal/50 dark:text-ekd-light-gray/50"
                        >
                          {link.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(link)}
                          title="Edit"
                          className="p-1.5 rounded hover:bg-ekd-charcoal/5 dark:hover:bg-ekd-light-gray/5 transition-colors text-ekd-charcoal/50 dark:text-ekd-light-gray/50 hover:text-ekd-gold"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(link.id)}
                          title="Delete"
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-ekd-charcoal/50 dark:text-ekd-light-gray/50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {historyMeta.pages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-ekd-charcoal/10 dark:border-ekd-light-gray/10">
            <p className="text-xs text-ekd-charcoal/50 dark:text-ekd-light-gray/50">
              Page {historyMeta.page} of {historyMeta.pages}
            </p>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                disabled={historyPage <= 1}
                onClick={() => handlePageChange(historyPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={historyPage >= historyMeta.pages}
                onClick={() => handlePageChange(historyPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

        </div>{/* end RIGHT COLUMN */}

      </div>{/* end grid */}
    </div>
  );
}
