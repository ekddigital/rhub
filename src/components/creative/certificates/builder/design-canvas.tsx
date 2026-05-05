"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { TemplateData, TemplateElement } from "@/lib/creative/certificates/template-builder/certificate";

interface DesignCanvasProps {
  templateData: TemplateData;
  selectedElement: TemplateElement | null;
  setSelectedElement: (element: TemplateElement | null) => void;
  updateElement: (element: TemplateElement) => void;
  isPreviewMode?: boolean;
  recipientName?: string;
}

export function DesignCanvas({
  templateData,
  selectedElement,
  setSelectedElement,
  updateElement,
  isPreviewMode = false,
  recipientName = "Sample Recipient",
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState<string | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [canvasScale, setCanvasScale] = useState(0.8);

  // Calculate responsive scale based on container size
  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          const canvasWidth = templateData.pageSettings.width;
          const canvasHeight = templateData.pageSettings.height;

          // Calculate scale to fit container with padding
          const horizontalPadding = 40; // 20px on each side
          const verticalPadding = 40; // 20px on top and bottom

          const maxWidthScale =
            (containerWidth - horizontalPadding) / canvasWidth;
          const maxHeightScale =
            (containerHeight - verticalPadding) / canvasHeight;

          // Use the smaller scale to ensure it fits in both dimensions
          const scale = Math.min(maxWidthScale, maxHeightScale, 1.2); // Allow slight zoom up to 1.2x
          const finalScale = Math.max(scale, 0.2); // Minimum scale of 0.2

          setCanvasScale(finalScale);
        }
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, [templateData.pageSettings.width, templateData.pageSettings.height]);

  // Process content to replace placeholders
  const processContent = (content: string): string => {
    if (!isPreviewMode) return content;

    return content
      .replace(/\{\{recipientName\}\}/g, recipientName)
      .replace(/\{\{issueDate\}\}/g, new Date().toLocaleDateString())
      .replace(
        /\{\{certificateId\}\}/g,
        `FOM-${Date.now().toString().slice(-6)}`
      );
  };

  // Build transform string for rotation and flip
  const buildTransform = (
    style: TemplateElement["style"]
  ): string | undefined => {
    const transforms: string[] = [];

    if (style.rotation) {
      transforms.push(`rotate(${style.rotation}deg)`);
    }

    if (style.flipHorizontal) {
      transforms.push("scaleX(-1)");
    }

    if (style.flipVertical) {
      transforms.push("scaleY(-1)");
    }

    return transforms.length > 0 ? transforms.join(" ") : undefined;
  };

  // Set canvas dimensions based on template page settings
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.width = `${templateData.pageSettings.width}px`;
      canvasRef.current.style.height = `${templateData.pageSettings.height}px`;
    }
  }, [templateData.pageSettings.width, templateData.pageSettings.height]);

  // Focus text input when editing text
  useEffect(() => {
    if (editingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [editingText]);

  const handleElementClick = (
    element: TemplateElement,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      setSelectedElement(element);
    }
  };

  const handleElementDoubleClick = (
    element: TemplateElement,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      setSelectedElement(element);

      if (element.type === "text") {
        setEditingText(element.id);
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedElement && selectedElement.type === "text") {
      updateElement({
        ...selectedElement,
        content: e.target.value,
      });
    }
  };

  const handleTextBlur = () => {
    setEditingText(null);
  };

  const handleCanvasClick = () => {
    setSelectedElement(null);
    setEditingText(null);
  };

  const startDrag = (element: TemplateElement, e: React.MouseEvent) => {
    if (editingText) return;
    e.stopPropagation();
    setDragging(true);

    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds) return;

    // Calculate drag start position accounting for canvas scale
    const canvasRelativeX = (e.clientX - canvasBounds.left) / canvasScale;
    const canvasRelativeY = (e.clientY - canvasBounds.top) / canvasScale;

    setDragStart({
      x: canvasRelativeX - element.position.x,
      y: canvasRelativeY - element.position.y,
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!dragging || !selectedElement) return;
    e.stopPropagation();

    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds) return;

    // Calculate new position relative to canvas, accounting for scale
    const canvasRelativeX = (e.clientX - canvasBounds.left) / canvasScale;
    const canvasRelativeY = (e.clientY - canvasBounds.top) / canvasScale;

    let newX = canvasRelativeX - dragStart.x;
    let newY = canvasRelativeY - dragStart.y;

    // Ensure element stays within canvas bounds
    newX = Math.max(
      0,
      Math.min(
        newX,
        templateData.pageSettings.width - selectedElement.position.width
      )
    );
    newY = Math.max(
      0,
      Math.min(
        newY,
        templateData.pageSettings.height - selectedElement.position.height
      )
    );

    updateElement({
      ...selectedElement,
      position: {
        ...selectedElement.position,
        x: newX,
        y: newY,
      },
    });
  };

  const endDrag = () => {
    setDragging(false);
  };

  const handleResizeStart = (
    element: TemplateElement,
    corner: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDragging(true);

    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds) return;

    // Store scaled mouse position
    const canvasRelativeX = (e.clientX - canvasBounds.left) / canvasScale;
    const canvasRelativeY = (e.clientY - canvasBounds.top) / canvasScale;

    setDragStart({ x: canvasRelativeX, y: canvasRelativeY });

    // Store the current dimensions for reference
    if (selectedElement) {
      selectedElement._initialResize = {
        x: element.position.x,
        y: element.position.y,
        width: element.position.width,
        height: element.position.height,
        corner,
      };
    }
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!dragging || !selectedElement || !selectedElement._initialResize)
      return;
    e.stopPropagation();

    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds) return;

    // Calculate scaled mouse position
    const canvasRelativeX = (e.clientX - canvasBounds.left) / canvasScale;
    const canvasRelativeY = (e.clientY - canvasBounds.top) / canvasScale;

    const { corner, x, y, width, height } = selectedElement._initialResize;
    const deltaX = canvasRelativeX - dragStart.x;
    const deltaY = canvasRelativeY - dragStart.y;

    let newPos = { ...selectedElement.position };

    // Handle different resize corners
    switch (corner) {
      case "top-left":
        newPos = {
          x: x + deltaX,
          y: y + deltaY,
          width: width - deltaX,
          height: height - deltaY,
        };
        break;
      case "top-right":
        newPos = {
          x,
          y: y + deltaY,
          width: width + deltaX,
          height: height - deltaY,
        };
        break;
      case "bottom-left":
        newPos = {
          x: x + deltaX,
          y,
          width: width - deltaX,
          height: height + deltaY,
        };
        break;
      case "bottom-right":
        newPos = {
          x,
          y,
          width: width + deltaX,
          height: height + deltaY,
        };
        break;
    }

    // Ensure minimum size
    if (newPos.width < 20) newPos.width = 20;
    if (newPos.height < 20) newPos.height = 20;

    updateElement({
      ...selectedElement,
      position: newPos,
    });
  };

  // Flexible positioning system - automatically adjust elements when canvas size changes
  const adjustElementsForCanvasSize = (
    elements: TemplateElement[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Base canvas size for relative positioning (800x600 is our reference)
    const baseWidth = 800;
    const baseHeight = 600;

    // Calculate scale factors
    const widthScale = canvasWidth / baseWidth;
    const heightScale = canvasHeight / baseHeight;

    return elements.map((element) => {
      // Define relative positioning rules for different element types/IDs
      let relativePosition = { x: 0, y: 0, width: 0, height: 0 };

      switch (element.id) {
        case "title":
          // Title: Top center, 20% from top, 50% width
          relativePosition = {
            x: canvasWidth * 0.25, // 25% from left (centered with 50% width)
            y: canvasHeight * 0.15, // 15% from top
            width: canvasWidth * 0.5, // 50% of canvas width
            height: Math.max(canvasHeight * 0.08, 40), // 8% of height, min 40px
          };
          break;

        case "subtitle":
          // Subtitle: Below title, centered
          relativePosition = {
            x: canvasWidth * 0.3,
            y: canvasHeight * 0.28,
            width: canvasWidth * 0.4,
            height: Math.max(canvasHeight * 0.05, 30),
          };
          break;

        case "recipient":
          // Recipient: Center area, prominent
          relativePosition = {
            x: canvasWidth * 0.25,
            y: canvasHeight * 0.38,
            width: canvasWidth * 0.5,
            height: Math.max(canvasHeight * 0.08, 45),
          };
          break;

        case "achievement":
          // Achievement description: Below recipient
          relativePosition = {
            x: canvasWidth * 0.3,
            y: canvasHeight * 0.52,
            width: canvasWidth * 0.4,
            height: Math.max(canvasHeight * 0.05, 30),
          };
          break;

        case "course":
          // Course name: Below achievement
          relativePosition = {
            x: canvasWidth * 0.25,
            y: canvasHeight * 0.62,
            width: canvasWidth * 0.5,
            height: Math.max(canvasHeight * 0.06, 35),
          };
          break;

        case "date":
          // Date: Bottom left
          relativePosition = {
            x: canvasWidth * 0.1,
            y: canvasHeight * 0.82,
            width: canvasWidth * 0.25,
            height: Math.max(canvasHeight * 0.04, 25),
          };
          break;

        case "signature":
          // Signature: Bottom right
          relativePosition = {
            x: canvasWidth * 0.65,
            y: canvasHeight * 0.82,
            width: canvasWidth * 0.25,
            height: Math.max(canvasHeight * 0.04, 25),
          };
          break;

        default:
          // For custom elements, scale their position proportionally
          relativePosition = {
            x: (element.position.x / baseWidth) * canvasWidth,
            y: (element.position.y / baseHeight) * canvasHeight,
            width: Math.max(
              (element.position.width / baseWidth) * canvasWidth,
              50
            ),
            height: Math.max(
              (element.position.height / baseHeight) * canvasHeight,
              25
            ),
          };
      }

      // Also scale font size proportionally for text elements
      const scaledStyle = { ...element.style };
      if (element.type === "text" && element.style.fontSize) {
        const fontScale = Math.min(widthScale, heightScale);
        scaledStyle.fontSize = Math.max(element.style.fontSize * fontScale, 12);
      }

      return {
        ...element,
        position: {
          x: Math.round(relativePosition.x),
          y: Math.round(relativePosition.y),
          width: Math.round(relativePosition.width),
          height: Math.round(relativePosition.height),
        },
        style: scaledStyle,
      };
    });
  };

  // Auto-adjust elements when canvas size changes
  useEffect(() => {
    const canvasWidth = templateData.pageSettings.width;
    const canvasHeight = templateData.pageSettings.height;

    // Only auto-adjust if we have standard elements (not in preview mode)
    if (!isPreviewMode && templateData.elements.length > 0) {
      const adjustedElements = adjustElementsForCanvasSize(
        templateData.elements,
        canvasWidth,
        canvasHeight
      );

      // Update elements if positions changed significantly
      adjustedElements.forEach((adjustedElement, index) => {
        const originalElement = templateData.elements[index];
        if (
          originalElement &&
          (Math.abs(adjustedElement.position.x - originalElement.position.x) >
            5 ||
            Math.abs(adjustedElement.position.y - originalElement.position.y) >
              5 ||
            Math.abs(
              adjustedElement.position.width - originalElement.position.width
            ) > 10 ||
            Math.abs(
              adjustedElement.position.height - originalElement.position.height
            ) > 5)
        ) {
          updateElement(adjustedElement);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    templateData.pageSettings.width,
    templateData.pageSettings.height,
    isPreviewMode,
  ]);

  // Keyboard support for moving selected elements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement || editingText || isPreviewMode) return;

      const step = e.shiftKey ? 10 : 1; // Hold Shift for bigger steps
      const newPosition = { ...selectedElement.position };
      let handled = false;

      switch (e.key) {
        case "ArrowUp":
          newPosition.y = Math.max(0, selectedElement.position.y - step);
          handled = true;
          break;
        case "ArrowDown":
          newPosition.y = Math.min(
            templateData.pageSettings.height - selectedElement.position.height,
            selectedElement.position.y + step
          );
          handled = true;
          break;
        case "ArrowLeft":
          newPosition.x = Math.max(0, selectedElement.position.x - step);
          handled = true;
          break;
        case "ArrowRight":
          newPosition.x = Math.min(
            templateData.pageSettings.width - selectedElement.position.width,
            selectedElement.position.x + step
          );
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        updateElement({
          ...selectedElement,
          position: newPosition,
        });
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedElement,
    editingText,
    isPreviewMode,
    templateData.pageSettings.width,
    templateData.pageSettings.height,
    updateElement,
  ]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto">
      <div
        ref={canvasRef}
        className="relative bg-white shadow-lg border border-gray-200 flex-shrink-0"
        style={{
          backgroundColor:
            templateData.pageSettings.background?.color || "#ffffff",
          backgroundImage: templateData.pageSettings.background?.image
            ? `url(${templateData.pageSettings.background.image})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // Remove padding - let elements use the full canvas
          // Use responsive scaling
          transform: `scale(${canvasScale})`,
          transformOrigin: "center center",
          // Set actual canvas dimensions
          width: `${templateData.pageSettings.width}px`,
          height: `${templateData.pageSettings.height}px`,
        }}
        onClick={handleCanvasClick}
        onMouseMove={
          dragging
            ? (e) => {
                if (selectedElement?._initialResize) {
                  handleResize(e);
                } else {
                  handleDrag(e);
                }
              }
            : undefined
        }
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {/* Simplified Visual Guidelines */}
        {!isPreviewMode && (
          <div className="absolute inset-0 pointer-events-none opacity-10 z-0">
            {/* Margin Guidelines - Show margin boundaries */}
            <div
              className="absolute border border-dashed border-gray-500"
              style={{
                top: `${templateData.pageSettings.margin.top}px`,
                left: `${templateData.pageSettings.margin.left}px`,
                right: `${templateData.pageSettings.margin.right}px`,
                bottom: `${templateData.pageSettings.margin.bottom}px`,
              }}
            />

            {/* Center guides */}
            <div
              className="absolute border-l border-dashed border-blue-400"
              style={{
                left: `${templateData.pageSettings.width / 2}px`,
                top: 0,
                bottom: 0,
              }}
            />
            <div
              className="absolute border-t border-dashed border-blue-400"
              style={{
                top: `${templateData.pageSettings.height / 2}px`,
                left: 0,
                right: 0,
              }}
            />
          </div>
        )}

        {/* Certificate Elements */}
        {templateData.elements.map((element) => {
          const isSelected = selectedElement?.id === element.id;
          const isEditing = editingText === element.id;

          return (
            <div
              key={element.id}
              className={`absolute z-10 ${
                isSelected
                  ? "ring-2 ring-blue-500 bg-blue-50 bg-opacity-10"
                  : "hover:ring-1 hover:ring-gray-300"
              }`}
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: `${element.position.width}px`,
                height: `${element.position.height}px`,
                cursor: dragging
                  ? selectedElement?._initialResize
                    ? "nwse-resize"
                    : "move"
                  : "pointer",
              }}
              onClick={(e) => handleElementClick(element, e)}
              onDoubleClick={(e) => handleElementDoubleClick(element, e)}
              onMouseDown={(e) => startDrag(element, e)}
            >
              {element.type === "text" &&
                (isEditing ? (
                  <textarea
                    ref={textInputRef}
                    className="w-full h-full p-2 bg-white bg-opacity-90 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-300 rounded shadow-sm"
                    style={{
                      fontSize: `${element.style.fontSize}px`,
                      fontFamily: element.style.fontFamily || "serif",
                      color: element.style.color || "#000000",
                      fontWeight: element.style.fontWeight || "normal",
                      textAlign:
                        (element.style
                          .textAlign as React.CSSProperties["textAlign"]) ||
                        "left",
                      lineHeight: "1.4",
                      transform: buildTransform(element.style),
                      transformOrigin: "center center",
                    }}
                    value={element.content}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    placeholder="Enter text..."
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center"
                    style={{
                      fontSize: `${element.style.fontSize}px`,
                      fontFamily: element.style.fontFamily || "serif",
                      color: element.style.color || "#000000",
                      fontWeight: element.style.fontWeight || "normal",
                      textAlign:
                        (element.style
                          .textAlign as React.CSSProperties["textAlign"]) ||
                        "left",
                      lineHeight: "1.4",
                      letterSpacing:
                        element.style.fontSize && element.style.fontSize > 20
                          ? "0.025em"
                          : "normal",
                      textShadow:
                        element.style.fontSize && element.style.fontSize > 24
                          ? "0 1px 2px rgba(0,0,0,0.1)"
                          : "none",
                      padding: "8px 12px",
                      justifyContent:
                        element.style.textAlign === "center"
                          ? "center"
                          : element.style.textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                      transform: buildTransform(element.style),
                      transformOrigin: "center center",
                    }}
                  >
                    <div className="w-full">
                      {processContent(element.content) || (
                        <span className="text-gray-400 italic">
                          Double-click to edit text
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {element.type === "image" && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  {element.content ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={element.content}
                        alt="Certificate element"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      Click to add image
                    </div>
                  )}
                </div>
              )}

              {element.type === "shape" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: element.style.color || "#000000",
                    borderRadius: element.style.borderRadius || "0px",
                  }}
                />
              )}

              {element.type === "qr" && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-gray-400 text-sm">
                    QR Code Placeholder
                  </div>
                </div>
              )}

              {isSelected && (
                <>
                  <div
                    className="absolute top-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-10"
                    onMouseDown={(e) =>
                      handleResizeStart(element, "top-left", e)
                    }
                  />
                  <div
                    className="absolute top-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize z-10"
                    onMouseDown={(e) =>
                      handleResizeStart(element, "top-right", e)
                    }
                  />
                  <div
                    className="absolute bottom-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize z-10"
                    onMouseDown={(e) =>
                      handleResizeStart(element, "bottom-left", e)
                    }
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-10"
                    onMouseDown={(e) =>
                      handleResizeStart(element, "bottom-right", e)
                    }
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
