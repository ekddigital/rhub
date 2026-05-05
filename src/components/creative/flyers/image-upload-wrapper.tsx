"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface ImageUploadWrapperProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  onImageChange: (imageUrl: string) => void;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  placeholder?: string;
}

/**
 * Reusable image wrapper component that allows click-to-upload functionality
 * for logos, QR codes, and any other images in flyers
 */
export function ImageUploadWrapper({
  src,
  alt,
  width,
  height,
  onImageChange,
  className = "",
  style = {},
  editable = true,
  placeholder = "Click to upload image",
}: ImageUploadWrapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!editable) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editable) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange("");
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      style={style}
      onMouseEnter={() => editable && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image or placeholder */}
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`object-contain ${editable ? "cursor-pointer" : ""}`}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      ) : (
        <div
          className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded ${
            editable ? "cursor-pointer hover:bg-gray-200" : ""
          }`}
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <div className="text-center text-gray-400 text-xs p-2">
            <Upload className="h-6 w-6 mx-auto mb-1" />
            <p>{placeholder}</p>
          </div>
        </div>
      )}

      {/* Hover overlay - only show in edit mode */}
      {editable && (isHovering || isDragging) && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            isDragging
              ? "bg-blue-500/30 border-2 border-blue-500"
              : "bg-black/40"
          } rounded transition-all`}
        >
          <div className="text-white text-center">
            <Upload className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs font-medium">
              {isDragging ? "Drop image here" : "Click or drag to upload"}
            </p>
          </div>

          {/* Clear button */}
          {src && !isDragging && (
            <button
              onClick={handleClearImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
