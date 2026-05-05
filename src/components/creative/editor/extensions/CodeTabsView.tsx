"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Check, Copy, X, Plus } from "lucide-react";
import { Button } from "@/components/creative/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/creative/ui/tabs";
import { CodeTab } from "./CodeTabs";

export default function CodeTabsView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const {
    tabs,
    title,
    showLineNumbers = true,
  } = node.attrs as {
    tabs: CodeTab[];
    title?: string;
    showLineNumbers?: boolean;
  };
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("0");

  const copyToClipboard = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      typescript: "text-blue-400",
      javascript: "text-yellow-400",
      python: "text-green-400",
      java: "text-orange-400",
      html: "text-red-400",
      css: "text-purple-400",
      json: "text-gray-400",
      bash: "text-cyan-400",
      shell: "text-cyan-400",
      sql: "text-pink-400",
      rust: "text-orange-500",
      go: "text-cyan-500",
    };
    return colors[lang.toLowerCase()] || "text-gray-400";
  };

  if (!tabs || tabs.length === 0) {
    return (
      <NodeViewWrapper>
        <div className="my-4 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center text-muted-foreground">
          <p>Empty code tabs block. Click to configure.</p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        className={`my-4 rounded-lg overflow-hidden border ${
          selected
            ? "border-primary ring-2 ring-primary/20"
            : "border-border bg-muted/50"
        }`}
      >
        {/* Header */}
        {title && (
          <div className="px-4 py-2.5 bg-muted/80 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              onClick={deleteNode}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-3 pt-2 pb-0 bg-muted/30">
            <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0">
              {tabs.map((tab, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-3 py-1.5 text-muted-foreground"
                >
                  <span className="text-xs font-mono font-semibold uppercase">
                    {tab.label || tab.language}
                  </span>
                </TabsTrigger>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const newTab: CodeTab = {
                    language: "typescript",
                    code: "// Add your code here",
                    label: "New Tab",
                  };
                  updateAttributes({ tabs: [...tabs, newTab] });
                  setActiveTab(tabs.length.toString());
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Tab
              </Button>
            </TabsList>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => {
                const currentIndex = parseInt(activeTab);
                if (tabs[currentIndex]) {
                  copyToClipboard(tabs[currentIndex].code, currentIndex);
                }
              }}
            >
              {copiedIndex === parseInt(activeTab) ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>

          {tabs.map((tab, index) => {
            const lines = tab.code.split("\n");
            return (
              <TabsContent
                key={index}
                value={index.toString()}
                className="mt-0"
              >
                <div className="flex">
                  {showLineNumbers && (
                    <div className="hidden sm:flex flex-col py-3 px-2.5 text-right text-xs text-muted-foreground/50 select-none bg-muted/20 border-r border-border min-w-[3rem]">
                      {lines.map((_, i) => (
                        <div key={i} className="leading-6">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  <pre className="flex-1 p-3 overflow-x-auto bg-transparent">
                    <code
                      className={`language-${tab.language} text-sm leading-6 text-foreground font-mono`}
                    >
                      {tab.code}
                    </code>
                  </pre>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </NodeViewWrapper>
  );
}
