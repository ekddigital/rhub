"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import { Move, Eye } from "lucide-react";
import { FlyerPreview, FlyerTemplateData } from "./flyer-preview";
import { InteractiveFlyerEditor } from "./interactive-flyer-editor";

interface FlyerPreviewPanelProps {
  template: FlyerTemplateData;
  isInteractiveMode: boolean;
  onUpdateTemplate: (path: string, value: unknown) => void;
  onElementSelect?: (elementId: string | null) => void;
}

export function FlyerPreviewPanel({
  template,
  isInteractiveMode,
  onUpdateTemplate,
  onElementSelect,
}: FlyerPreviewPanelProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isInteractiveMode ? (
            <Move className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
          {isInteractiveMode ? "Interactive Editing Mode" : "Live Preview"}
        </CardTitle>
        <CardDescription>
          {isInteractiveMode
            ? "Click any element to edit, drag to reposition, right-click for options"
            : "Real-time preview of your flyer design"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isInteractiveMode ? (
          <div className="flex justify-center items-center p-8 bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[800px]">
            <InteractiveFlyerEditor
              template={template}
              onUpdateTemplate={onUpdateTemplate}
              onElementSelect={onElementSelect}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[800px]">
            <div
              id="live-flyer-preview"
              className="transform scale-90 origin-center"
            >
              <FlyerPreview template={template} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
