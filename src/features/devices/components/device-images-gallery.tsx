"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteDeviceImage, useDeviceImages } from "@/features/devices/hooks/use-devices";
import { ImageUploadZone } from "./image-upload-zone";

const TYPE_LABELS: Record<string, string> = {
  FRONT: "Frontal",
  BACK: "Trasera",
  SIDE: "Lateral",
  SCREEN: "Pantalla",
  DAMAGE: "Daño",
  OTHER: "Otra",
};

interface DeviceImagesGalleryProps {
  deviceId: string;
}

export function DeviceImagesGallery({ deviceId }: DeviceImagesGalleryProps) {
  const { data: images = [], isLoading } = useDeviceImages(deviceId);
  const deleteMutation = useDeleteDeviceImage(deviceId);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const handleDelete = async (imageId: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    try {
      await deleteMutation.mutateAsync(imageId);
      toast.success("Imagen eliminada");
    } catch {
      toast.error("Error al eliminar la imagen");
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando imágenes...</p>;
  }

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <ImageIcon className="h-10 w-10" />
          <p className="text-sm">Sin imágenes</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border">
              <div className="relative aspect-square">
                <Image
                  src={`${apiBase}/uploads${img.url}`}
                  alt={img.description ?? img.type}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between p-1.5">
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[img.type] ?? img.type}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(img.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageUploadZone deviceId={deviceId} currentCount={images.length} />
    </div>
  );
}
