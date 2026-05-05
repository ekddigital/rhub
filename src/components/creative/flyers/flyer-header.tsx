"use client";

import React from "react";
import { Button } from "@/components/creative/ui/button";
import { Download, Settings, Sparkles, Undo2, Redo2 } from "lucide-react";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";

interface FlyerHeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onReset: () => void;
  onDownload: (format: "png" | "jpg") => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function FlyerHeader({
  canUndo,
  canRedo,
  onReset,
  onDownload,
  onUndo,
  onRedo,
}: FlyerHeaderProps) {
  return (
    <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-amber-400">
                Flyer Design Studio
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional flyers in minutes
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="gap-2"
                title="Undo (Cmd/Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="gap-2"
                title="Redo (Cmd/Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcutsDialog />

            <Button variant="outline" onClick={onReset} className="gap-2">
              <Settings className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={() => onDownload("png")}
              className="gap-2 bg-gradient-to-r from-primary-dark to-secondary hover:from-primary-dark/90 hover:to-secondary/90 text-white"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
