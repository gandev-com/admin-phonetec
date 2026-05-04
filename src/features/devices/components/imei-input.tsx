"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateImei } from "@/lib/validators/imei";

interface ImeiInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ImeiInput({ label, value = "", onChange, error }: ImeiInputProps) {
  const [touched, setTouched] = useState(false);
  const isValid = value.length === 15 && validateImei(value);
  const hasError = touched && value.length > 0 && !isValid;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {value.length === 15 && (
          <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
            {isValid ? "✓ IMEI válido" : "✗ IMEI inválido"}
          </Badge>
        )}
      </div>
      <Input
        value={value}
        maxLength={15}
        inputMode="numeric"
        placeholder="15 dígitos"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onBlur={() => setTouched(true)}
        className={hasError ? "border-destructive" : ""}
      />
      {(hasError || error) && (
        <p className="text-xs text-destructive">
          {error ?? "IMEI inválido (falla verificación Luhn)"}
        </p>
      )}
    </div>
  );
}
