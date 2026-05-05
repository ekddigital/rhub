/**
 * Code Block Dialog Component
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/creative/ui/button";
import { Textarea } from "@/components/creative/ui/textarea";
import { Label } from "@/components/creative/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/creative/ui/dialog";

interface CodeBlockDialogProps {
  onInsert: (code: string, language: string) => void;
  trigger: React.ReactNode;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
];

export function CodeBlockDialog({ onInsert, trigger }: CodeBlockDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  const handleInsert = () => {
    if (code) {
      onInsert(code, language);
      setCode("");
      setLanguage("javascript");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert Code Block</DialogTitle>
          <DialogDescription>
            Add syntax-highlighted code to your content
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Programming Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="border-border bg-background hover:border-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {LANGUAGES.map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}
                    className="hover:bg-secondary/10 focus:bg-secondary/10"
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Code</Label>
            <Textarea
              placeholder="// Your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[200px] border-border bg-muted/30 focus:border-secondary/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleInsert}
            disabled={!code}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            Insert Code Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
