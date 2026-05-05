"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/creative/ui/dialog";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import { Textarea } from "@/components/creative/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { CodeTab } from "../extensions/CodeTabs";

interface CodeTabsDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "sql", label: "SQL" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
];

export function CodeTabsDialog({
  editor,
  open,
  onOpenChange,
}: CodeTabsDialogProps) {
  const [title, setTitle] = useState("");
  const [tabs, setTabs] = useState<CodeTab[]>([
    { language: "typescript", code: "", label: "" },
  ]);

  const addTab = () => {
    setTabs([...tabs, { language: "typescript", code: "", label: "" }]);
  };

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      setTabs(tabs.filter((_, i) => i !== index));
    }
  };

  const updateTab = (index: number, field: keyof CodeTab, value: string) => {
    const updated = [...tabs];
    updated[index] = { ...updated[index], [field]: value };
    setTabs(updated);
  };

  const handleInsert = () => {
    // Filter out empty tabs
    const validTabs = tabs.filter((tab) => tab.code.trim());

    if (validTabs.length === 0) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "codeTabs",
        attrs: {
          tabs: validTabs,
          title: title.trim() || undefined,
          showLineNumbers: true,
        },
      })
      .run();

    // Reset form
    setTitle("");
    setTabs([{ language: "typescript", code: "", label: "" }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Multi-Language Code Tabs</DialogTitle>
          <DialogDescription>
            Add multiple code snippets in different languages with tabs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title (optional) */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., API Request Examples"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Code Tabs */}
          <div className="space-y-4">
            {tabs.map((tab, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Tab {index + 1}</h4>
                  {tabs.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeTab(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`language-${index}`}>Language</Label>
                    <Select
                      value={tab.language}
                      onValueChange={(value) =>
                        updateTab(index, "language", value)
                      }
                    >
                      <SelectTrigger id={`language-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`label-${index}`}>
                      Tab Label (Optional)
                    </Label>
                    <Input
                      id={`label-${index}`}
                      placeholder={`e.g., ${
                        LANGUAGES.find((l) => l.value === tab.language)?.label
                      }`}
                      value={tab.label}
                      onChange={(e) =>
                        updateTab(index, "label", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`code-${index}`}>Code</Label>
                  <Textarea
                    id={`code-${index}`}
                    placeholder="Paste your code here..."
                    value={tab.code}
                    onChange={(e) => updateTab(index, "code", e.target.value)}
                    className="font-mono text-sm min-h-[150px]"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addTab}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Tab
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInsert}
              disabled={tabs.every((tab) => !tab.code.trim())}
            >
              Insert Code Tabs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
