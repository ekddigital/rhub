"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/creative/ui/dialog";
import { Button } from "@/components/creative/ui/button";
import { TemplateData } from "@/lib/creative/certificates/template-builder/certificate";
import { X, Download } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateData: TemplateData;
  previewData?: Record<string, string>;
}

export function PreviewModal({
  isOpen,
  onClose,
  templateData,
  previewData = {},
}: PreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // TODO: Implement actual PDF generation and download
      console.log("Generating PDF with data:", { templateData, previewData });
      // For now, just simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPreview = () => {
    return (
      <div
        className="relative bg-white border-2 border-dashed border-gray-300 mx-auto"
        style={{
          width: `${Math.min(templateData.pageSettings.width * 0.5, 400)}px`,
          height: `${Math.min(templateData.pageSettings.height * 0.5, 300)}px`,
        }}
      >
        {templateData.elements.map((element) => {
          const style = {
            position: "absolute" as const,
            left: `${
              (element.position.x / templateData.pageSettings.width) * 100
            }%`,
            top: `${
              (element.position.y / templateData.pageSettings.height) * 100
            }%`,
            width: `${
              (element.position.width / templateData.pageSettings.width) * 100
            }%`,
            height: `${
              (element.position.height / templateData.pageSettings.height) * 100
            }%`,
            transform: `rotate(${element.style.rotation || 0}deg)`,
            ...element.style,
          };

          if (element.type === "text") {
            const displayText = previewData[element.content] || element.content;
            return (
              <div
                key={element.id}
                style={style}
                className="flex items-center justify-center text-center"
              >
                {displayText}
              </div>
            );
          }

          if (element.type === "image") {
            return (
              <Image
                key={element.id}
                src={element.content}
                alt="Template element"
                style={style}
                className="object-contain"
                fill
              />
            );
          }

          return null;
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Certificate Preview
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {templateData.name || "Untitled Template"}
            </h3>
            <p className="text-gray-600">
              {templateData.description || "No description"}
            </p>
          </div>

          <div className="flex justify-center">{renderPreview()}</div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
