"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

interface ConsentUploadZoneProps {
  file: File | null;
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

export function ConsentUploadZone({ file, preview, onFile, onClear }: ConsentUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    onDropAccepted: (files) => onFile(files[0]),
  });

  const rejection = fileRejections[0]?.errors[0]?.message;

  if (file) {
    return (
      <div className="relative rounded-xl border-2 border-dashed border-border p-4">
        {preview ? (
          <img
            src={preview}
            alt="Vista previa del documento"
            className="mx-auto max-h-48 rounded-lg object-contain"
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-2 rounded-full bg-background border p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? "Suelta el archivo aquí" : "Arrastra o haz clic para subir el documento"}
        </p>
        <p className="text-xs text-muted-foreground">PDF, JPEG o PNG · Máx. 20 MB</p>
      </div>
      {rejection && (
        <p className="mt-1 text-xs text-destructive">{rejection}</p>
      )}
    </div>
  );
}
