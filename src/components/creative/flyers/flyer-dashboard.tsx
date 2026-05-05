"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FlyerHeader } from "./flyer-header";
import { FlyerSidebar } from "./flyer-sidebar";
import { FlyerPreviewPanel } from "./flyer-preview-panel";
import { ContextMenuProvider, useContextMenu } from "./context-menu-provider";
import { useFlyerHistory } from "./hooks/use-flyer-history";
import { useFlyerElementActions } from "./hooks/use-flyer-element-actions";
import {
  flyerTemplates,
  FlyerTemplateKey,
  FlyerTemplateData,
  FlyerTextBlock,
  CustomImage,
} from "./flyer-templates";
import { downloadFlyerAsImage, downloadFlyerAsJPG } from "./flyer-download";

type LayerDefinition =
  | { id: string; type: "original" }
  | { id: string; type: "duplicate"; data: FlyerTextBlock }
  | { id: string; type: "customImage"; index: number };

function FlyerDashboardContent() {
  const { registerAction } = useContextMenu();
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<FlyerTemplateKey>("modernEvent");
  const [isInteractiveMode] = useState(true); // Always in edit mode
  const [isDownloading, setIsDownloading] = useState(false);

  // Use history hook for undo/redo
  const {
    template,
    canUndo,
    canRedo,
    undo,
    redo,
    updateWithHistory,
    resetHistory,
  } = useFlyerHistory(JSON.parse(JSON.stringify(flyerTemplates.modernEvent)));

  // Generic update function
  const updateTemplate = useCallback(
    (path: string, value: unknown) => {
      const updated: FlyerTemplateData = JSON.parse(JSON.stringify(template));
      const keys = path.split(".");
      let current: Record<string, unknown> = updated as unknown as Record<
        string,
        unknown
      >;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      updateWithHistory(updated);
    },
    [template, updateWithHistory],
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (key: FlyerTemplateKey) => {
      setSelectedTemplateKey(key);
      const newTemplate = JSON.parse(JSON.stringify(flyerTemplates[key]));
      resetHistory(newTemplate);
    },
    [resetHistory],
  );

  // Use custom hook for element actions
  const { handleUpdateElement, handleDuplicateElement, handleDeleteElement } =
    useFlyerElementActions(template, updateTemplate);

  // Handle download
  const handleDownload = async (format: "png" | "jpg" = "png") => {
    if (isDownloading) return; // Prevent multiple simultaneous downloads

    setIsDownloading(true);

    // Show loading toast
    try {
      // Add a small delay to ensure UI updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (format === "jpg") {
        await downloadFlyerAsJPG(
          "live-flyer-preview",
          template.name || "flyer",
        );
      } else {
        await downloadFlyerAsImage(
          "live-flyer-preview",
          template.name || "flyer",
        );
      }

      toast("Download Complete!", {
        description: `Your flyer has been downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download flyer",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    const newTemplate = JSON.parse(
      JSON.stringify(flyerTemplates[selectedTemplateKey]),
    );
    resetHistory(newTemplate);
    setSelectedElementId(null);
    toast("Template Reset", {
      description: "All changes have been discarded.",
    });
  };

  // Wrapped undo with toast
  const handleUndo = () => {
    undo();
    toast("Undone", { description: "Last change has been undone." });
  };

  // Wrapped redo with toast
  const handleRedo = () => {
    redo();
    toast("Redone", { description: "Change has been redone." });
  };

  // Handle duplicate and select the new element
  const handleDuplicateAndSelect = useCallback(
    (elementId: string) => {
      const newElementId = handleDuplicateElement(elementId);
      if (newElementId) {
        setSelectedElementId(newElementId as string);
      }
    },
    [handleDuplicateElement],
  );

  // Handle delete and deselect
  const handleDeleteAndDeselect = useCallback(
    (elementId: string) => {
      handleDeleteElement(elementId);
      setSelectedElementId(null);
    },
    [handleDeleteElement],
  );

  // Handle visibility toggle
  const handleToggleVisibility = useCallback(
    (elementId: string) => {
      // Check if it's a custom image
      if (elementId.startsWith("custom-image-")) {
        const imageIndex = parseInt(elementId.replace("custom-image-", ""));
        const customImages = template.graphics?.customImages || [];

        if (customImages[imageIndex]) {
          const updatedImages = [...customImages];
          updatedImages[imageIndex] = {
            ...updatedImages[imageIndex],
            visible: updatedImages[imageIndex].visible === false ? true : false,
          };
          updateTemplate("graphics.customImages", updatedImages);
          return;
        }
      }

      // Check if it's a duplicate element
      const blocks = template.content.additionalTextBlocks || [];
      const block = blocks.find((b) => b.id === elementId);

      if (block) {
        // It's a duplicate
        const index = blocks.findIndex((b) => b.id === elementId);
        const updatedBlocks = [...blocks];
        updatedBlocks[index] = { ...block, visible: !block.visible };
        updateTemplate("content.additionalTextBlocks", updatedBlocks);
      } else {
        // It's an original element
        const currentVisibility =
          template.visibility?.[elementId as keyof typeof template.visibility];
        updateTemplate(
          `visibility.${elementId}`,
          currentVisibility === false ? true : false,
        );
      }

      toast("Visibility Updated", {
        description: "Element visibility has been toggled.",
      });
    },
    [template, updateTemplate, toast],
  );

  // Handle lock toggle (for future implementation)
  const handleToggleLock = (elementId: string) => {
    // To be implemented: add lock state to template
    console.log("Toggle lock for:", elementId);
  };

  // Handle layer reorder
  const handleReorderLayers = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    // Get all layers (similar to LayersPanel)
    const layers: LayerDefinition[] = [];

    // Add original elements
    const originalElements: Array<{ id: string; type: "original" }> = [
      { id: "logo", type: "original" },
      { id: "companyName", type: "original" },
      { id: "headline", type: "original" },
      { id: "subheadline", type: "original" },
      { id: "body", type: "original" },
      { id: "callToAction", type: "original" },
      { id: "contactInfo", type: "original" },
      { id: "qrCode", type: "original" },
    ];

    originalElements.forEach((el) => layers.push(el));

    // Add duplicates
    const blocks = template.content.additionalTextBlocks || [];
    blocks.forEach((block) => {
      layers.push({ id: block.id, type: "duplicate", data: block });
    });

    // Add custom images
    const customImages = template.graphics?.customImages || [];
    customImages.forEach((_, idx) => {
      layers.push({
        id: `custom-image-${idx}`,
        type: "customImage",
        index: idx,
      });
    });

    // Reorder the layers array
    const [movedLayer] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, movedLayer);

    // Now we need to update z-indices based on the new order
    // Reverse the array since layers are displayed top-to-bottom (high z-index first)
    const reversedLayers = [...layers].reverse();

    // Update z-indices for duplicates
    const updatedBlocks = blocks.map((block) => {
      const layerIndex = reversedLayers.findIndex((l) => l.id === block.id);
      return { ...block, zIndex: layerIndex };
    });

    // Update custom images with z-indices
    const updatedCustomImages = customImages.map((img: CustomImage, idx) => {
      const layerIndex = reversedLayers.findIndex(
        (l) => l.id === `custom-image-${idx}`,
      );
      return { ...img, zIndex: layerIndex };
    });

    // Apply updates
    if (updatedBlocks.length > 0) {
      updateTemplate("content.additionalTextBlocks", updatedBlocks);
    }

    if (updatedCustomImages.length > 0) {
      updateTemplate("graphics.customImages", updatedCustomImages);
    }

    toast("Layer Reordered", {
      description: "Elements have been reordered successfully.",
    });
  };

  // Handle bring to front
  const handleBringToFront = useCallback(
    (elementId: string) => {
      const blocks = template.content.additionalTextBlocks || [];
      const block = blocks.find((b) => b.id === elementId);

      if (block) {
        const maxZIndex = Math.max(...blocks.map((b) => b.zIndex || 0), 0);
        const index = blocks.findIndex((b) => b.id === elementId);
        const updatedBlocks = [...blocks];
        updatedBlocks[index] = { ...block, zIndex: maxZIndex + 1 };
        updateTemplate("content.additionalTextBlocks", updatedBlocks);
        toast("Layer moved", { description: "Element brought to front." });
      }
    },
    [template, updateTemplate, toast],
  );

  // Handle send to back
  const handleSendToBack = useCallback(
    (elementId: string) => {
      const blocks = template.content.additionalTextBlocks || [];
      const block = blocks.find((b) => b.id === elementId);

      if (block) {
        const index = blocks.findIndex((b) => b.id === elementId);
        const updatedBlocks = [...blocks];
        updatedBlocks[index] = { ...block, zIndex: 0 };
        updateTemplate("content.additionalTextBlocks", updatedBlocks);
        toast("Layer moved", { description: "Element sent to back." });
      }
    },
    [template, updateTemplate, toast],
  );

  // Handle copy element
  const handleCopyElement = useCallback(
    (elementId: string) => {
      // Store in clipboard (simplified - could use navigator.clipboard for real clipboard)
      toast.success(`Element ${elementId} copied to clipboard.`);
    },
    [toast],
  );

  // Register context menu actions
  useEffect(() => {
    registerAction("duplicate", (data) => {
      handleDuplicateAndSelect(data.elementId);
      toast("Duplicated", { description: "Element has been duplicated." });
    });

    registerAction("delete", (data) => {
      handleDeleteAndDeselect(data.elementId);
    });

    registerAction("bringToFront", (data) => {
      handleBringToFront(data.elementId);
    });

    registerAction("sendToBack", (data) => {
      handleSendToBack(data.elementId);
    });

    registerAction("copy", (data) => {
      handleCopyElement(data.elementId);
    });

    registerAction("toggleVisibility", (data) => {
      handleToggleVisibility(data.elementId);
      toast("Visibility toggled", {
        description: "Element visibility has been changed.",
      });
    });
  }, [
    template,
    registerAction,
    handleDuplicateAndSelect,
    handleDeleteAndDeselect,
    handleBringToFront,
    handleSendToBack,
    handleCopyElement,
    handleToggleVisibility,
    toast,
  ]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (!selectedElementId) return;

      // Duplicate (Cmd/Ctrl + D)
      if (isCtrlOrCmd && e.key === "d") {
        e.preventDefault();
        handleDuplicateAndSelect(selectedElementId);
        toast("Duplicated", { description: "Element has been duplicated." });
        return;
      }

      // Bring to Front (Cmd/Ctrl + ])
      if (isCtrlOrCmd && e.key === "]") {
        e.preventDefault();
        handleBringToFront(selectedElementId);
        return;
      }

      // Send to Back (Cmd/Ctrl + [)
      if (isCtrlOrCmd && e.key === "[") {
        e.preventDefault();
        handleSendToBack(selectedElementId);
        return;
      }

      // Toggle Visibility (Cmd/Ctrl + H)
      if (isCtrlOrCmd && e.key === "h") {
        e.preventDefault();
        handleToggleVisibility(selectedElementId);
        toast("Visibility toggled", {
          description: "Element visibility has been changed.",
        });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElementId,
    template,
    handleDuplicateAndSelect,
    handleBringToFront,
    handleSendToBack,
    handleToggleVisibility,
    toast,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-800">
      {/* Header */}
      <FlyerHeader
        canUndo={canUndo}
        canRedo={canRedo}
        onReset={handleReset}
        onDownload={handleDownload}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Split View */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="col-span-12 lg:col-span-4">
            <FlyerSidebar
              selectedElementId={selectedElementId}
              selectedTemplateKey={selectedTemplateKey}
              template={template}
              onTemplateChange={handleTemplateChange}
              onUpdateElement={handleUpdateElement}
              onDuplicateElement={handleDuplicateAndSelect}
              onDeleteElement={handleDeleteAndDeselect}
              onUpdateTemplate={updateTemplate}
              onElementSelect={setSelectedElementId}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onReorderLayers={handleReorderLayers}
            />
          </div>

          {/* Right Side - Live Preview */}
          <div className="col-span-12 lg:col-span-8">
            <FlyerPreviewPanel
              template={template}
              isInteractiveMode={isInteractiveMode}
              onUpdateTemplate={updateTemplate}
              onElementSelect={setSelectedElementId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with ContextMenuProvider
export default function FlyerDashboardV3() {
  return (
    <ContextMenuProvider>
      <FlyerDashboardContent />
    </ContextMenuProvider>
  );
}
