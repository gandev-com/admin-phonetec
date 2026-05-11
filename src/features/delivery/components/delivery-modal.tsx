"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PenLine, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad, type SignaturePadHandle } from "@/components/shared/signature-pad";
import { ConsentUploadZone } from "./consent-upload-zone";
import { reportsApi } from "@/lib/api/reports";
import type { Report } from "@/types/report";

type Step = "summary" | "sign";
type SignMode = "draw" | "upload";

interface DeliveryModalProps {
  report: Report;
  onSuccess: (updated: Report) => void;
  onClose: () => void;
}

export function DeliveryModal({ report, onSuccess, onClose }: DeliveryModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("summary");
  const [signMode, setSignMode] = useState<SignMode>("draw");
  const [signedBy, setSignedBy] = useState(
    report.customer ? `${report.customer.firstName} ${report.customer.lastName}` : "",
  );

  // Upload mode state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Draw mode state
  const padRef = useRef<SignaturePadHandle>(null);
  const [padEmpty, setPadEmpty] = useState(true);

  const deliverMutation = useMutation({
    mutationFn: (f: File) => reportsApi.deliver(report.id, f, signedBy.trim()),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Orden ${report.orderNumber} entregada correctamente`);
      onSuccess(updated);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al confirmar la entrega");
    },
  });

  function handleFile(f: File) {
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  function handleClearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  }

  function handleSubmit() {
    if (signMode === "draw") {
      const sigFile = padRef.current?.toFile(`firma-entrega-${report.orderNumber}.png`);
      if (!sigFile) return;
      deliverMutation.mutate(sigFile);
    } else {
      if (!file) return;
      deliverMutation.mutate(file);
    }
  }

  const nameOk = signedBy.trim().length > 0;
  const signOk = signMode === "draw" ? !padEmpty : !!file;
  const canSubmit = nameOk && signOk;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {step === "summary" ? "Resumen de la orden" : "Firma de consentimiento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1 — Summary */}
        {step === "summary" && (
          <div className="space-y-3 p-6 text-sm">
            <dl className="space-y-2">
              <Row label="Orden" value={report.orderNumber} />
              <Row
                label="Cliente"
                value={
                  report.customer
                    ? `${report.customer.firstName} ${report.customer.lastName}`
                    : "—"
                }
              />
              <Row
                label="Dispositivo"
                value={
                  report.device
                    ? `${report.device.brand?.name ?? ""} ${report.device.model ?? ""}`.trim()
                    : "—"
                }
              />
              <Row label="Estado actual" value="Lista para recoger" />
            </dl>
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/60 p-3">
              Al continuar, el cliente deberá firmar el documento de recogida y el estado pasará
              a <strong>Entregada</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("sign")}>Continuar →</Button>
            </div>
          </div>
        )}

        {/* Step 2 — Sign */}
        {step === "sign" && (
          <div className="space-y-4 p-6">
            {/* Mode tabs */}
            <div className="flex rounded-lg border p-1 gap-1 bg-muted/40">
              <button
                type="button"
                onClick={() => setSignMode("draw")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  signMode === "draw"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                Firma digital
              </button>
              <button
                type="button"
                onClick={() => setSignMode("upload")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  signMode === "upload"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Subir documento
              </button>
            </div>

            {/* Name field */}
            <div className="space-y-1">
              <Label htmlFor="dm-signed-by">Firmado por *</Label>
              <Input
                id="dm-signed-by"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                placeholder="Nombre completo del cliente"
              />
            </div>

            {/* Draw mode */}
            {signMode === "draw" && (
              <div className="space-y-1">
                <Label>Firma del cliente *</Label>
                <SignaturePad
                  ref={padRef}
                  height={200}
                  onChange={(isEmpty) => setPadEmpty(isEmpty)}
                />
              </div>
            )}

            {/* Upload mode */}
            {signMode === "upload" && (
              <div className="space-y-1">
                <Label>Documento firmado *</Label>
                <ConsentUploadZone
                  file={file}
                  preview={preview}
                  onFile={handleFile}
                  onClear={handleClearFile}
                />
              </div>
            )}

            {deliverMutation.isError && (
              <p className="text-sm text-destructive">
                {(deliverMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                  "Error al confirmar la entrega."}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep("summary")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Volver
              </button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || deliverMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {deliverMutation.isPending ? "Confirmando…" : "Confirmar entrega"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 font-medium text-foreground">{label}:</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
}
