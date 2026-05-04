"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadDeviceImage } from "@/features/devices/hooks/use-devices";

const IMAGE_TYPES = [
  { value: "FRONT", label: "Frontal" },
  { value: "BACK", label: "Trasera" },
  { value: "SIDE", label: "Lateral" },
  { value: "SCREEN", label: "Pantalla" },
  { value: "DAMAGE", label: "Daño" },
  { value: "OTHER", label: "Otra" },
];

interface ImageUploadZoneProps {
  deviceId: string;
  currentCount: number;
}

export function ImageUploadZone({ deviceId, currentCount }: ImageUploadZoneProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [type, setType] = useState("OTHER");
  const uploadMutation = useUploadDeviceImage(deviceId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!pendingFile) return;
    try {
      await uploadMutation.mutateAsync({ file: pendingFile, type, order: currentCount });
      toast.success("Imagen subida");
      setPendingFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch {
      toast.error("Error al subir la imagen");
    }
  };

  const clearPending = () => {
    setPendingFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      {!pendingFile ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Suelta la imagen aquí"
              : "Arrastra una imagen o haz clic para seleccionar"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP — máx. 10 MB</p>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview!} alt="preview" className="h-20 w-20 rounded object-cover" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">{pendingFile.name}</p>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo de imagen" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={clearPending}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Subiendo..." : "Subir imagen"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
