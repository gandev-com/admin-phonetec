"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCESSORIES = [
  { key: "hasBackCover", label: "Tapa trasera" },
  { key: "hasBattery", label: "Batería" },
  { key: "hasSimCard", label: "Tarjeta SIM" },
  { key: "hasSdCard", label: "Tarjeta SD" },
  { key: "hasCharger", label: "Cargador" },
] as const;

interface AccessoriesChecklistProps {
  values: Record<string, boolean>;
  otherAccessories?: string;
  onChange: (key: string, value: boolean) => void;
  onOtherChange: (value: string) => void;
}

export function AccessoriesChecklist({
  values,
  otherAccessories = "",
  onChange,
  onOtherChange,
}: AccessoriesChecklistProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Accesorios entregados</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACCESSORIES.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={key}
              checked={values[key] ?? false}
              onCheckedChange={(checked) => onChange(key, Boolean(checked))}
            />
            <label htmlFor={key} className="cursor-pointer text-sm">
              {label}
            </label>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label className="text-sm">Otros accesorios</Label>
        <Input
          value={otherAccessories}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Funda, auriculares, caja..."
        />
      </div>
    </div>
  );
}
