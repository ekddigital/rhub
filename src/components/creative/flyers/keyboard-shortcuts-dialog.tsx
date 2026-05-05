"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/creative/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/creative/ui/dialog";
import { Keyboard } from "lucide-react";

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const mod = isMac ? "⌘" : "Ctrl";

  // Listen for '?' key to open dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const shortcuts = [
    {
      category: "Editing",
      items: [
        { keys: [`${mod}`, "C"], action: "Copy selected element" },
        { keys: [`${mod}`, "V"], action: "Paste / Duplicate element" },
        { keys: [`${mod}`, "D"], action: "Duplicate selected element" },
        { keys: ["Delete", "Backspace"], action: "Delete selected element" },
        { keys: [`${mod}`, "H"], action: "Toggle element visibility" },
      ],
    },
    {
      category: "History",
      items: [
        { keys: [`${mod}`, "Z"], action: "Undo last change" },
        { keys: [`${mod}`, "Shift", "Z"], action: "Redo last change" },
        { keys: [`${mod}`, "Y"], action: "Redo last change (alternative)" },
      ],
    },
    {
      category: "Movement",
      items: [
        { keys: ["↑", "↓", "←", "→"], action: "Move element 1px" },
        { keys: ["Shift", "↑↓←→"], action: "Move element 10px" },
      ],
    },
    {
      category: "Layers",
      items: [
        { keys: [`${mod}`, "]"], action: "Bring element to front" },
        { keys: [`${mod}`, "["], action: "Send element to back" },
      ],
    },
    {
      category: "General",
      items: [
        { keys: ["Right Click"], action: "Show context menu" },
        { keys: ["Esc"], action: "Deselect / Close menu" },
        { keys: ["?"], action: "Show this help dialog" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="w-4 h-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-blue-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master these shortcuts to speed up your flyer design workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-blue-900 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 ">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-blue-990 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 mx-1">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Pro Tip:</strong> Press{" "}
            <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 border rounded">
              ?
            </kbd>{" "}
            anytime to open this shortcuts panel!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
