"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrands } from "@/features/devices/hooks/use-brands";
import { cn } from "@/lib/utils";
import type { Brand } from "@/types/device";

// ─── Static model suggestions per brand ──────────────────────────────────────

const PHONE_MODELS: Record<string, string[]> = {
  Apple: [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 Mini",
    "iPhone SE (3rd Gen)", "iPhone SE (2nd Gen)",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "iPhone 8 Plus", "iPhone 8",
  ],
  Samsung: [
    "Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25",
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE",
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23",
    "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
    "Galaxy A55", "Galaxy A54", "Galaxy A53", "Galaxy A52",
    "Galaxy A35", "Galaxy A34", "Galaxy A33", "Galaxy A32",
    "Galaxy Z Fold 6", "Galaxy Z Fold 5", "Galaxy Z Fold 4",
    "Galaxy Z Flip 6", "Galaxy Z Flip 5", "Galaxy Z Flip 4",
    "Galaxy Note 20 Ultra", "Galaxy Note 20", "Galaxy Note 10+",
  ],
  Xiaomi: [
    "Xiaomi 14 Ultra", "Xiaomi 14 Pro", "Xiaomi 14",
    "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13",
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
    "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12",
    "POCO X6 Pro", "POCO X6", "POCO F6 Pro", "POCO F5",
    "Redmi 13C", "Redmi 12", "Redmi 12C",
  ],
  Huawei: [
    "Huawei P60 Pro", "Huawei P60", "Huawei P50 Pro", "Huawei P50",
    "Huawei Mate 60 Pro", "Huawei Mate 60", "Huawei Mate 50 Pro",
    "Huawei Nova 12 Pro", "Huawei Nova 12", "Huawei Nova 11 Pro",
    "Huawei Y9a", "Huawei Y8p",
  ],
  OnePlus: [
    "OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 10 Pro",
    "OnePlus Nord 4", "OnePlus Nord 3", "OnePlus Nord CE 3",
    "OnePlus 9 Pro", "OnePlus 9",
  ],
  Motorola: [
    "Moto G85", "Moto G75", "Moto G65", "Moto G55", "Moto G45", "Moto G35",
    "Edge 50 Ultra", "Edge 50 Pro", "Edge 50",
    "Razr 50 Ultra", "Razr 50",
    "ThinkPhone",
  ],
  Google: [
    "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9", "Pixel 9 Pro Fold",
    "Pixel 8 Pro", "Pixel 8", "Pixel 8a",
    "Pixel 7 Pro", "Pixel 7", "Pixel 7a",
    "Pixel 6 Pro", "Pixel 6", "Pixel 6a",
  ],
  Sony: [
    "Xperia 1 VI", "Xperia 5 VI", "Xperia 10 VI",
    "Xperia 1 V", "Xperia 5 V", "Xperia 10 V",
    "Xperia 1 IV", "Xperia 5 IV",
  ],
  OPPO: [
    "Find X8 Pro", "Find X8", "Find X7 Ultra",
    "Reno 12 Pro", "Reno 12", "Reno 11 Pro", "Reno 11",
    "A79", "A78", "A60",
  ],
  Realme: [
    "GT 6", "GT 6T", "GT Neo 6",
    "12 Pro+", "12 Pro", "12+", "12",
    "C65", "C63", "C55",
  ],
  Honor: [
    "Magic 6 Pro", "Magic 6", "Magic 5 Pro",
    "90 Pro", "90", "80 Pro",
    "X9b", "X8b", "X7b",
  ],
  Vivo: [
    "X100 Ultra", "X100 Pro", "X100",
    "V30 Pro", "V30", "V29",
    "Y100", "Y77", "Y36",
  ],
  Nothing: ["Phone (2a) Plus", "Phone (2a)", "Phone (2)", "Phone (1)"],
};

// ─── ModelInput — combobox with suggestions + free typing ────────────────────

interface ModelInputProps {
  brandName?: string;
  value?: string;
  onChange: (model: string) => void;
  error?: string;
  disabled?: boolean;
}

function ModelInput({ brandName, value, onChange, error, disabled }: ModelInputProps) {
  const [inputVal, setInputVal] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when parent resets value (e.g. on brand change)
  useEffect(() => {
    setInputVal(value ?? "");
  }, [value]);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = PHONE_MODELS[brandName ?? ""] ?? [];
  const filtered = inputVal.trim()
    ? suggestions.filter((m) => m.toLowerCase().includes(inputVal.toLowerCase()))
    : suggestions;
  const showSuggestions = open && !disabled && filtered.length > 0;

  const handleChange = (v: string) => {
    setInputVal(v);
    onChange(v);
    setOpen(true);
  };

  const handleSelect = (model: string) => {
    setInputVal(model);
    onChange(model);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={inputVal}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => !disabled && suggestions.length > 0 && setOpen(true)}
        placeholder={disabled ? "Selecciona una marca primero" : "Modelo del dispositivo"}
        disabled={disabled}
        className={cn(error ? "border-destructive" : "")}
        autoComplete="off"
      />
      {showSuggestions && (
        <ul className="absolute z-30 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-lg py-1">
          {filtered.slice(0, 10).map((m) => (
            <li key={m}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(m)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  m === inputVal
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-foreground hover:bg-muted/60",
                )}
              >
                {m === inputVal && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span>{m}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── BrandModelSelector ───────────────────────────────────────────────────────

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
  const selectedBrand = (brands as Brand[]).find((b) => String(b.id) === brandId);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Marca *</Label>
        <Select
          value={brandId ?? null}
          onValueChange={(v) => v && onBrandChange(v)}
          disabled={loadingBrands}
        >
          <SelectTrigger className={brandError ? "border-destructive" : ""}>
            {/* Pass name explicitly so SelectValue shows label even when popup is closed */}
            <SelectValue placeholder="Seleccionar marca">
              {selectedBrand?.name}
            </SelectValue>
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
        <ModelInput
          brandName={selectedBrand?.name}
          value={modelValue}
          onChange={onModelChange}
          error={modelError}
          disabled={!brandId}
        />
        {modelError && <p className="text-xs text-destructive">{modelError}</p>}
      </div>
    </div>
  );
}
