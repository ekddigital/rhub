"use client";

/**
 * Document Share Dialog
 * Manages sharing: generate share link, add/remove collaborators by email.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Link2,
  Link2Off,
  UserPlus,
  Trash2,
  Loader2,
  Users,
  Crown,
} from "lucide-react";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/creative/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────────── */

interface CollaboratorUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

interface Collaborator {
  id: string;
  userId: string;
  role: "VIEWER" | "EDITOR" | "ADMIN";
  createdAt: string;
  user: CollaboratorUser | null;
}

interface ShareInfo {
  shareId: string | null;
  ownerId: string;
  collaborators: Collaborator[];
}

interface DocumentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  documentTitle: string;
}

/* ─── Component ──────────────────────────────────────────────── */

export function DocumentShareDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: DocumentShareDialogProps) {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("EDITOR");
  const [adding, setAdding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  /* ─── Fetch share info on open ────────────────────────────── */
  const fetchShareInfo = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`);
      if (res.ok) {
        const data = await res.json();
        setShareInfo(data);
      } else {
        // If 403/404, might be a local-only (guest) document
        setShareInfo(null);
      }
    } catch {
      setShareInfo(null);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (open && documentId) {
      fetchShareInfo();
    }
  }, [open, documentId, fetchShareInfo]);

  /* ─── Generate share link ─────────────────────────────────── */
  const handleGenerateLink = async () => {
    if (!documentId) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-link" }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareInfo((prev) =>
          prev ? { ...prev, shareId: data.shareId } : prev,
        );
        toast.success("Share link generated");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate link");
      }
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  /* ─── Revoke share link ───────────────────────────────────── */
  const handleRevokeLink = async () => {
    if (!documentId) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-link" }),
      });
      if (res.ok) {
        setShareInfo((prev) => (prev ? { ...prev, shareId: null } : prev));
        toast.success("Share link revoked");
      }
    } catch {
      toast.error("Failed to revoke link");
    }
  };

  /* ─── Copy share link ─────────────────────────────────────── */
  const handleCopyLink = () => {
    if (!shareInfo?.shareId) return;
    const url = `${window.location.origin}/brand/document/shared/${shareInfo.shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      toast.success("Share link copied");
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  /* ─── Add collaborator ────────────────────────────────────── */
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-collaborator",
          email: email.trim(),
          role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareInfo((prev) =>
          prev
            ? {
                ...prev,
                collaborators: [
                  ...prev.collaborators.filter(
                    (c) => c.userId !== data.collaborator.userId,
                  ),
                  data.collaborator,
                ],
              }
            : prev,
        );
        setEmail("");
        toast.success(`Added ${data.collaborator.user?.name || email}`);
      } else {
        toast.error(data.error || "Failed to add collaborator");
      }
    } catch {
      toast.error("Failed to add collaborator");
    } finally {
      setAdding(false);
    }
  };

  /* ─── Remove collaborator ─────────────────────────────────── */
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!documentId) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove-collaborator",
          collaboratorId,
        }),
      });
      if (res.ok) {
        setShareInfo((prev) =>
          prev
            ? {
                ...prev,
                collaborators: prev.collaborators.filter(
                  (c) => c.id !== collaboratorId,
                ),
              }
            : prev,
        );
        toast.success("Collaborator removed");
      }
    } catch {
      toast.error("Failed to remove collaborator");
    }
  };

  /* ─── Render ──────────────────────────────────────────────── */
  const isGuestDoc = !documentId || (shareInfo === null && !loading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#C8A061]" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Share &ldquo;{documentTitle}&rdquo; with collaborators.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#C8A061]" />
          </div>
        )}

        {isGuestDoc && !loading && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <p>Sharing is available for signed-in users.</p>
            <p className="text-xs mt-1">
              Sign in to share documents and add collaborators.
            </p>
          </div>
        )}

        {shareInfo && !loading && (
          <div className="space-y-6 mt-2">
            {/* ── Share Link Section ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#C8A061] flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Share Link
              </h3>

              {shareInfo.shareId ? (
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/brand/document/shared/${shareInfo.shareId}`}
                    className="h-8 text-xs font-mono flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleRevokeLink}
                    title="Revoke share link"
                  >
                    <Link2Off className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={handleGenerateLink}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Generate Share Link
                </Button>
              )}
            </div>

            {/* ── Add Collaborator Section ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#C8A061] flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Add Collaborator
              </h3>
              <form
                onSubmit={handleAddCollaborator}
                className="flex items-end gap-2"
              >
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Email address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-8"
                    required
                  />
                </div>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as "VIEWER" | "EDITOR")}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 bg-[#C8A061] hover:bg-[#b8914f] text-white"
                  disabled={adding || !email.trim()}
                >
                  {adding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                </Button>
              </form>
            </div>

            {/* ── Collaborators List ── */}
            {shareInfo.collaborators.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#C8A061]">
                  Collaborators ({shareInfo.collaborators.length})
                </h3>
                <div className="space-y-2">
                  {shareInfo.collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {collab.user?.avatar ? (
                          <img
                            src={collab.user.avatar}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {(collab.user?.name || collab.user?.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {collab.user?.name ||
                              collab.user?.email ||
                              "Unknown"}
                          </p>
                          {collab.user?.name && collab.user?.email && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {collab.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            collab.role === "ADMIN"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : collab.role === "EDITOR"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {collab.role === "ADMIN" && (
                            <Crown className="h-2.5 w-2.5 inline mr-0.5" />
                          )}
                          {collab.role}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveCollaborator(collab.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
