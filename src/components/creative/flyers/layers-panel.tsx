"use client";

import React, { useState } from "react";
import { Button } from "@/components/creative/ui/button";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/creative/ui/badge";
import { FlyerTemplateData } from "./flyer-preview";

interface Layer {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  isDuplicate: boolean;
}

interface LayersPanelProps {
  template: FlyerTemplateData;
  selectedElementId: string | null;
  onElementSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  inline?: boolean; // New prop to control display mode
}

export function LayersPanel({
  template,
  selectedElementId,
  onElementSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onReorder,
  inline = false, // Default to popup mode for backward compatibility
}: LayersPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Build layers list
  const layers: Layer[] = [];

  // Add original elements
  const originalElements = [
    { id: "logo", type: "logo", name: "Logo" },
    { id: "companyName", type: "text", name: "Company Name" },
    { id: "headline", type: "text", name: "Headline" },
    { id: "subheadline", type: "text", name: "Subheadline" },
    { id: "body", type: "text", name: "Body Text" },
    { id: "callToAction", type: "button", name: "Call to Action" },
    { id: "contactInfo", type: "text", name: "Contact Info" },
    { id: "qrCode", type: "image", name: "QR Code" },
  ];

  originalElements.forEach((el, idx) => {
    layers.push({
      id: el.id,
      type: el.type,
      name: el.name,
      visible:
        template.visibility?.[el.id as keyof typeof template.visibility] !==
        false,
      locked: false,
      zIndex: idx,
      isDuplicate: false,
    });
  });

  // Add duplicates
  if (template.content.additionalTextBlocks) {
    template.content.additionalTextBlocks.forEach(
      (block: Record<string, unknown>, idx: number) => {
        layers.push({
          id: String(block.id),
          type: String(block.type),
          name: `${block.type} Copy #${idx + 1}`,
          visible: block.visible !== false,
          locked: false,
          zIndex: originalElements.length + idx,
          isDuplicate: true,
        });
      }
    );
  }

  // Add custom images
  if (template.graphics?.customImages) {
    template.graphics.customImages.forEach(
      (img: Record<string, unknown>, idx: number) => {
        layers.push({
          id: `custom-image-${idx}`,
          type: "image",
          name: `Custom Image ${idx + 1}`,
          visible: img.visible !== false,
          locked: false,
          zIndex:
            img.zIndex !== undefined
              ? Number(img.zIndex)
              : originalElements.length +
                (template.content.additionalTextBlocks?.length || 0) +
                idx,
          isDuplicate: false,
        });
      }
    );
  }
  // Sort by z-index (reverse for visual stacking)
  layers.sort((a, b) => b.zIndex - a.zIndex);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    onReorder(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < layers.length - 1) {
      onReorder(index, index + 1);
    }
  };

  const getLayerIcon = (type: string) => {
    const icons: Record<string, string> = {
      logo: "🖼️",
      text: "📝",
      button: "🔘",
      image: "🖼️",
      headline: "📰",
      subheadline: "📰",
      body: "📄",
      callToAction: "🔘",
      contactInfo: "📧",
      qrCode: "📱",
    };
    return icons[type] || "📄";
  };

  // Render layers content
  const layersContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2 mb-2">
        <span className="font-medium">Element</span>
        <span className="font-medium">Actions</span>
      </div>

      {layers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No layers yet</p>
        </div>
      ) : (
        layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable={!layer.locked}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer
              ${
                selectedElementId === layer.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-1 ring-blue-300"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }
              ${draggedIndex === index ? "opacity-50 scale-95" : "opacity-100"}
              ${!layer.visible ? "opacity-60" : ""}
            `}
            onClick={() => onElementSelect(layer.id)}
          >
            <GripVertical className="w-3 h-3 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />

            <div className="text-base flex-shrink-0">
              {getLayerIcon(layer.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs truncate">
                  {layer.name}
                </span>
                {layer.isDuplicate && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Copy
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Move Up/Down buttons */}
              <div className="flex flex-col gap-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveUp(index);
                  }}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveDown(index);
                  }}
                  disabled={index === layers.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              {/* Visibility toggle */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                title={layer.visible ? "Hide" : "Show"}
              >
                {layer.visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
              </Button>

              {/* Lock toggle */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                title={layer.locked ? "Unlock" : "Lock"}
              >
                {layer.locked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3 text-gray-400" />
                )}
              </Button>

              {/* Delete button for duplicates */}
              {layer.isDuplicate && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(layer.id);
                  }}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Layer Tips */}
      {inline && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-semibold text-xs mb-2">Layer Tips</h4>
          <ul className="space-y-1 text-[10px] text-muted-foreground">
            <li>• Drag layers to reorder</li>
            <li>• Use ↑↓ buttons to move</li>
            <li>• Click to select element</li>
            <li>• Lock to prevent edits</li>
          </ul>
        </div>
      )}
    </div>
  );

  // If inline mode, return content directly
  if (inline) {
    return layersContent;
  }

  // Otherwise, return in Dialog (for backward compatibility)
  return <div className="inline-block">{layersContent}</div>;
}
