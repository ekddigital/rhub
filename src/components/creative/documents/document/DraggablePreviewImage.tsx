"use client";

/**
 * DraggablePreviewImage
 * Interactive image positioning in document preview.
 * Allows dragging images to exact positions for PDF layout.
 *
 * Behavior:
 * - If initialPosX/Y provided: Starts in absolute positioned mode
 * - If no initial position: Starts in flow-based layout, converts to absolute on first drag
 *
 * v2 fixes:
 * - Uses refs for drag tracking to avoid stale-closure issues
 * - Correct offset calculation for smooth drag feel
 * - Added resize handle for scaling the image in-place
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Move, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY, LETTERHEAD } from "@/lib/creative/documents/constants";

interface DraggablePreviewImageProps {
  src: string;
  alt: string;
  width?: string;
  initialPosX?: number;
  initialPosY?: number;
  onPositionChange?: (posX: number, posY: number) => void;
  /** Key for React reconciliation */
  imageKey?: string;
  caption?: string;
  figureNumber?: number;
}

export function DraggablePreviewImage({
  src,
  alt,
  width,
  initialPosX,
  initialPosY,
  onPositionChange,
  imageKey,
  caption,
  figureNumber,
}: DraggablePreviewImageProps) {
  const hasInitialPosition =
    initialPosX !== undefined && initialPosY !== undefined;

  // Track if image has been positioned (either loaded with position, or user has dragged)
  const [isPositioned, setIsPositioned] = useState(hasInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({
    x: initialPosX ?? 0,
    y: initialPosY ?? 0,
  });
  const [imgWidth, setImgWidth] = useState<number | null>(null);

  // Refs for drag tracking (avoids stale closures in event handlers)
  const posRef = useRef(position);
  const imageRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, startWidth: 0 });

  // Keep ref in sync with state
  posRef.current = position;

  // Update position from props if they change
  useEffect(() => {
    if (initialPosX !== undefined && initialPosY !== undefined) {
      const newPos = { x: initialPosX, y: initialPosY };
      setPosition(newPos);
      posRef.current = newPos;
    }
  }, [initialPosX, initialPosY]);

  const getContainer = useCallback((): HTMLElement | null => {
    return imageRef.current?.offsetParent as HTMLElement | null;
  }, []);

  // ─── DRAG HANDLING ───
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const container = getContainer();
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const imageRect = imageRef.current!.getBoundingClientRect();

      // If not yet positioned, capture current flow position as percentage
      if (!isPositioned) {
        const currentPxX =
          imageRect.left - containerRect.left + container.scrollLeft;
        const currentPxY =
          imageRect.top - containerRect.top + container.scrollTop;
        const newPos = {
          x: containerRect.width
            ? Math.round((currentPxX / containerRect.width) * 10000) / 100
            : 0,
          y: containerRect.height
            ? Math.round((currentPxY / containerRect.height) * 10000) / 100
            : 0,
        };
        setPosition(newPos);
        posRef.current = newPos;
        setIsPositioned(true);
      }

      // Offset = mouse position relative to the image's top-left corner
      dragOffsetRef.current = {
        x: e.clientX - imageRect.left,
        y: e.clientY - imageRect.top,
      };

      setIsDragging(true);
    },
    [isPositioned, getContainer],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = getContainer();
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const pxX = e.clientX - containerRect.left - dragOffsetRef.current.x;
      const pxY = e.clientY - containerRect.top - dragOffsetRef.current.y;

      // Store as percentage for portability across different container sizes
      const newPos = {
        x: containerRect.width
          ? Math.round((pxX / containerRect.width) * 10000) / 100
          : 0,
        y: containerRect.height
          ? Math.round((pxY / containerRect.height) * 10000) / 100
          : 0,
      };
      setPosition(newPos);
      posRef.current = newPos;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Use ref for the actual current position (avoids stale closure)
      if (onPositionChange) {
        onPositionChange(
          Math.round(posRef.current.x * 100) / 100,
          Math.round(posRef.current.y * 100) / 100,
        );
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPositionChange, getContainer]);

  // ─── RESIZE HANDLING ───
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const imgEl = imageRef.current?.querySelector("img");
    if (!imgEl) return;

    resizeStartRef.current = {
      mouseX: e.clientX,
      startWidth: imgEl.offsetWidth,
    };
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const newWidth = Math.max(40, resizeStartRef.current.startWidth + dx);
      setImgWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPos = { x: 0, y: 0 };
    setPosition(newPos);
    posRef.current = newPos;
    setIsPositioned(false);
    setImgWidth(null);
    if (onPositionChange) {
      onPositionChange(0, 0);
    }
  };

  const captionEl = caption ? (
    <div
      style={{
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: "10px",
        fontWeight: 700,
        color: LETTERHEAD.goldColor,
        marginTop: "4px",
        textAlign: "center",
        letterSpacing: "0.3px",
      }}
    >
      {figureNumber != null ? `Figure ${figureNumber}: ${caption}` : caption}
    </div>
  ) : null;

  const resolvedWidth = imgWidth ? `${imgWidth}px` : width || "auto";

  // ─── Flow mode (not yet positioned) ───
  if (!isPositioned) {
    return (
      <figure
        ref={imageRef}
        className={cn(
          "relative cursor-move select-none group",
          "border-2 border-dashed border-[#C8A061]/40",
          "hover:border-[#C8A061] hover:bg-[#C8A061]/5",
          "transition-all duration-150",
          "p-2 my-2",
        )}
        style={{
          textAlign: "center",
          margin: "8px auto",
        }}
        onMouseDown={handleDragStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Click and drag to position this image"
      >
        {/* Hint banner */}
        <div
          className={cn(
            "mb-2 px-3 py-1.5 rounded text-xs font-medium",
            "bg-[#C8A061] text-white flex items-center justify-center gap-1.5",
            "group-hover:bg-[#B89050] transition-colors",
          )}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Drag to position image</span>
        </div>

        {/* The image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: "100%",
            width: resolvedWidth,
            height: "auto",
            display: "block",
            margin: "0 auto",
            userSelect: "none",
          }}
        />

        {captionEl}
      </figure>
    );
  }

  // ─── Positioned mode (absolute) ───
  return (
    <div
      ref={imageRef}
      className={cn(
        "absolute select-none group",
        isDragging ? "z-50 opacity-90 cursor-grabbing" : "cursor-grab",
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: resolvedWidth,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      key={imageKey}
    >
      {/* Drag handle + controls overlay */}
      {(isHovered || isDragging || isResizing) && (
        <div className="absolute inset-0 border-2 border-dashed border-[#C8A061] bg-[#C8A061]/5 pointer-events-none rounded">
          {/* Top control bar */}
          <div className="absolute -top-8 left-0 right-0 flex items-center justify-between gap-2 bg-[#C8A061] text-white px-2 py-1 text-xs rounded-t pointer-events-auto">
            <div
              className="flex items-center gap-1 cursor-grab active:cursor-grabbing flex-1"
              onMouseDown={handleDragStart}
            >
              <Move className="w-3 h-3 flex-shrink-0" />
              <span>
                {Math.round(position.x)}%, {Math.round(position.y)}%
              </span>
            </div>
            <button
              onClick={handleReset}
              className="hover:bg-white/20 p-0.5 rounded"
              title="Reset to flow position"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Resize handle — bottom-right */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize pointer-events-auto flex items-center justify-center bg-[#C8A061] rounded-tl"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          >
            <Maximize2 className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Click area for drag on the image itself */}
      <div
        onMouseDown={handleDragStart}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-full h-auto"
          style={{
            userSelect: "none",
            width: resolvedWidth,
          }}
        />
      </div>

      {captionEl}
    </div>
  );
}
