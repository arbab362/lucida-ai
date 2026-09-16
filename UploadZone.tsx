"use client";

import { useRef, useState } from "react";

interface UploadZoneProps {
  onImageSelected: (imageDataUrl: string, fileName: string) => void;
}

export default function UploadZone({
  onImageSelected,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImageSelected(reader.result, file.name);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="text-4xl">📷</div>

      <h3 className="mt-4 text-lg font-semibold">
        Upload an image
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Click to choose an image or drag and drop it here
      </p>

      <p className="mt-2 text-xs text-gray-400">
        JPG, PNG, WEBP or GIF
      </p>
    </div>
  );
          }
