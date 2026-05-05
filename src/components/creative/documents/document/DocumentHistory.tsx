/**
 * DocumentHistory — Sidebar panel listing saved documents.
 * ChatGPT-style: click a title to load, trash to delete,
 * plus button to create a new document.
 * Supports drag-to-reorder.
 */

"use client";

import React, { useState, useRef } from "react";
import {
  FilePlus2,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
  GripVertical,
  Users,
} from "lucide-react";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/creative/ui/tooltip";
import type {
  DocIndexEntry,
  SharedDocEntry,
} from "@/lib/creative/hooks/use-document-history";

interface DocumentHistoryProps {
  documents: DocIndexEntry[];
  sharedDocuments?: SharedDocEntry[];
  activeDocId: string | null;
  onSelect: (docId: string) => void;
  onDelete: (docId: string) => void;
  onCreate: () => void;
  onRename: (docId: string, newTitle: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function DocumentHistory({
  documents,
  sharedDocuments = [],
  activeDocId,
  onSelect,
  onDelete,
  onCreate,
  onRename,
  onReorder,
  collapsed,
  onToggleCollapse,
}: DocumentHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleStartRename = (doc: DocIndexEntry) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
  };

  const handleConfirmRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDelete = (docId: string) => {
    if (confirmDeleteId === docId) {
      // Second click — actually delete
      onDelete(docId);
      setConfirmDeleteId(null);
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    } else {
      // First click — enter confirm state
      setConfirmDeleteId(docId);
      // Clear any previous timer
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      // Auto-dismiss confirmation after 3 seconds
      confirmTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
        confirmTimerRef.current = null;
      }, 3000);
    }
  };

  /* ── Drag-to-reorder handlers ─────────────────────────────────── */

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIndex !== null && fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
  };

  if (collapsed) {
    return (
      <div className="w-10 flex flex-col items-center pt-2 border-r border-border/50 bg-muted/30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 mb-2"
                onClick={onToggleCollapse}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Expand History</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCreate}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">New Document</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="w-56 flex flex-col border-r border-border/50 bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/40">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          History
        </span>
        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onCreate}
                >
                  <FilePlus2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">New Document</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto py-1">
        {documents.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No saved documents</p>
            <p className="mt-1">
              Click <strong>+</strong> to create one
            </p>
          </div>
        ) : (
          documents.map((doc, index) => {
            const isActive = doc.id === activeDocId;
            const isEditing = editingId === doc.id;
            const isConfirmingDelete = confirmDeleteId === doc.id;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={doc.id}
                draggable={!isEditing && !!onReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`group relative px-2 py-1.5 mx-1 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#C8A061]/15 border border-[#C8A061]/30"
                    : "hover:bg-muted/60 border border-transparent"
                } ${isDragOver ? "border-t-2 !border-t-[#C8A061]" : ""}`}
                onClick={() => {
                  if (!isEditing) onSelect(doc.id);
                }}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmRename();
                        if (e.key === "Escape") handleCancelRename();
                      }}
                      className="h-6 text-xs px-1.5"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmRename();
                      }}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelRename();
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-1.5">
                      {/* Drag handle — visible on hover when reorder is enabled */}
                      {onReorder && (
                        <GripVertical
                          className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      )}
                      <FileText
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          isActive
                            ? "text-[#C8A061]"
                            : "text-muted-foreground/60"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate leading-tight ${
                            isActive ? "text-foreground" : "text-foreground/80"
                          }`}
                        >
                          {doc.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {timeAgo(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {/* Action buttons — visible on hover */}
                    <TooltipProvider>
                      <div className="absolute right-1 top-1 hidden group-hover:flex items-center gap-0.5 bg-muted/90 rounded px-0.5 py-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(doc);
                              }}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-xs">Rename</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-5 w-5 ${
                                isConfirmingDelete
                                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                  : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(doc.id);
                              }}
                            >
                              <Trash2
                                className={`h-3 w-3 ${
                                  isConfirmingDelete
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-xs">
                              {isConfirmingDelete
                                ? "Click again to delete"
                                : "Delete"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Shared with me section */}
      {sharedDocuments.length > 0 && (
        <>
          <div className="px-2 py-1.5 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Shared with me
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground/60 bg-muted rounded px-1">
                {sharedDocuments.length}
              </span>
            </div>
          </div>
          <div className="overflow-y-auto py-1 max-h-[200px]">
            {sharedDocuments.map((doc) => {
              const isActive = doc.id === activeDocId;
              const roleBadge =
                doc.role === "ADMIN"
                  ? { text: "Admin", color: "text-red-500 bg-red-500/10" }
                  : doc.role === "EDITOR"
                    ? {
                        text: "Editor",
                        color: "text-amber-600 bg-amber-500/10",
                      }
                    : { text: "Viewer", color: "text-blue-500 bg-blue-500/10" };

              return (
                <div
                  key={doc.id}
                  className={`group relative px-2 py-1.5 mx-1 rounded-md cursor-pointer transition-colors ${
                    isActive
                      ? "bg-[#C8A061]/15 border border-[#C8A061]/30"
                      : "hover:bg-muted/60 border border-transparent"
                  }`}
                  onClick={() => onSelect(doc.id)}
                >
                  <div className="flex items-start gap-1.5">
                    <Users
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        isActive ? "text-[#C8A061]" : "text-muted-foreground/60"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate leading-tight ${
                          isActive ? "text-foreground" : "text-foreground/80"
                        }`}
                      >
                        {doc.title || "Untitled"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[9px] font-medium px-1 rounded ${roleBadge.color}`}
                        >
                          {roleBadge.text}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          by {doc.sharedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground text-center">
          {documents.length} document{documents.length !== 1 ? "s" : ""} saved
          {sharedDocuments.length > 0 && (
            <span> · {sharedDocuments.length} shared</span>
          )}
        </p>
      </div>
    </div>
  );
}
