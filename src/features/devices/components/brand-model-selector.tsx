"use client";

import { useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrandModels, useBrands } from "@/features/devices/hooks/use-brands";
import type { Brand, DeviceModel } from "@/types/device";

interface BrandModelSelectorProps {
  brandId?: string;
  modelValue?: string;
  onBrandChange: (brandId: string) => void;
  onModelChange: (model: string) => void;
  brandError?: string;
  modelError?: string;
}

export function BrandModelSelector({
  brandId,
  modelValue,
  onBrandChange,
  onModelChange,
  brandError,
  modelError,
}: BrandModelSelectorProps) {
  const { data: brands = [], isLoading: loadingBrands } = useBrands();
  const { data: models = [], isLoading: loadingModels } = useBrandModels(brandId);

  // Reset model when brand changes
  useEffect(() => {
    onModelChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Marca *</Label>
        <Select value={brandId} onValueChange={(v) => v && onBrandChange(v)} disabled={loadingBrands}>
          <SelectTrigger className={brandError ? "border-destructive" : ""}>
            <SelectValue placeholder="Seleccionar marca" />
          </SelectTrigger>
          <SelectContent>
            {(brands as Brand[]).map((b) => (
              <SelectItem key={String(b.id)} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {brandError && <p className="text-xs text-destructive">{brandError}</p>}
      </div>

      <div className="space-y-1">
        <Label>Modelo *</Label>
        {(models as DeviceModel[]).length > 0 ? (
          <Select
            value={modelValue}
            onValueChange={(v) => v && onModelChange(v)}
            disabled={!brandId || loadingModels}
          >
            <SelectTrigger className={modelError ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar modelo" />
            </SelectTrigger>
            <SelectContent>
              {(models as DeviceModel[]).map((m) => (
                <SelectItem key={String(m.id)} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={modelValue ?? ""}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={brandId ? "Escribir modelo" : "Selecciona una marca primero"}
            disabled={!brandId}
            className={modelError ? "border-destructive" : ""}
          />
        )}
        {modelError && <p className="text-xs text-destructive">{modelError}</p>}
      </div>
    </div>
  );
}
