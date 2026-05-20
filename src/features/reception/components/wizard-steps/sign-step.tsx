"use client";

import { useRef, useState } from "react";
import { FileText, PenLine, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignaturePad, type SignaturePadHandle } from "@/components/shared/signature-pad";
import {
  ORDER_TYPE_LABELS,
  PRIORITY_LABELS,
  type OrderFormValues,
} from "@/lib/schemas/reception";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";

import { CustomerInfoCard } from "./customer-info-card";

interface SignStepProps {
  customer: Customer;
  device: Device;
  pendingOrderData: OrderFormValues;
  isCreating: boolean;
  isSigning: boolean;
  hasCreateError: boolean;
  hasSignError: boolean;
  onSignAndCreate: (file: File, dataUrl: string, signedBy: string) => Promise<void>;
  onBack: () => void;
}

export function SignStep({
  customer,
  device,
  pendingOrderData,
  isCreating,
  isSigning,
  hasCreateError,
  hasSignError,
  onSignAndCreate,
  onBack,
}: SignStepProps) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [signedBy, setSignedBy] = useState(
    () => `${customer.firstName} ${customer.lastName}`,
  );
  const [padEmpty, setPadEmpty] = useState(true);

  async function handleSign() {
    const file = padRef.current?.toFile(
      `firma-recepcion-${customer.firstName}-${Date.now()}.png`,
    );
    const dataUrl = padRef.current?.toDataUrl();
    if (!file || !dataUrl) return;
    await onSignAndCreate(file, dataUrl, signedBy.trim());
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Documento de recepción</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Phonetec · {new Date().toLocaleDateString("es-ES", { dateStyle: "long" })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cliente
            </p>
            <CustomerInfoCard customer={customer} />
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dispositivo
            </p>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {device.brand?.name} {device.model}
                </p>
                {device.imeiIn && (
                  <p className="text-xs text-muted-foreground">IMEI: {device.imeiIn}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detalles de la orden
            </p>
            <dl className="space-y-1.5 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-muted-foreground">Tipo:</dt>
                <dd className="font-medium">{ORDER_TYPE_LABELS[pendingOrderData.reportType]}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-muted-foreground">Prioridad:</dt>
                <dd className="font-medium">{PRIORITY_LABELS[pendingOrderData.priority]}</dd>
              </div>
              {pendingOrderData.isUrgent && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">Urgente:</dt>
                  <dd className="font-medium text-red-600">Sí</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-muted-foreground">Problema:</dt>
                <dd>{pendingOrderData.reportedIssue}</dd>
              </div>
              {pendingOrderData.estimatedDeliveryDate && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">Entrega est.:</dt>
                  <dd>
                    {new Date(
                      pendingOrderData.estimatedDeliveryDate + "T12:00:00",
                    ).toLocaleDateString("es-ES")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          <div className="rounded-lg border bg-amber-50/50 p-3 text-xs text-muted-foreground dark:bg-amber-950/20">
            <p className="mb-1 font-semibold text-foreground">Cláusula de consentimiento</p>
            <p>
              El cliente declara que los datos anteriores son correctos y autoriza al taller a
              realizar el diagnóstico y/o reparación del dispositivo descrito. El taller no se
              responsabiliza de la pérdida de datos contenidos en el dispositivo. El presupuesto
              de reparación será comunicado antes de iniciar cualquier trabajo.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Firma del cliente
            </p>
            <div className="space-y-1">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="sign-by"
              >
                Nombre del firmante *
              </label>
              <input
                id="sign-by"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                placeholder="Nombre completo del cliente"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
              />
            </div>
            <SignaturePad
              ref={padRef}
              height={200}
              onChange={(isEmpty) => setPadEmpty(isEmpty)}
            />
          </div>

          {(hasCreateError || hasSignError) && (
            <p className="text-sm text-destructive">
              {hasCreateError
                ? "No se pudo crear la orden. Comprueba la conexión e inténtalo de nuevo."
                : "La orden fue creada pero no se pudo guardar la firma. Por favor, inténtalo de nuevo."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            padRef.current?.clear();
            onBack();
          }}
          disabled={isCreating || isSigning}
        >
          Volver
        </Button>
        <Button
          onClick={handleSign}
          disabled={padEmpty || !signedBy.trim() || isCreating || isSigning}
          className="flex-1"
        >
          <PenLine className="h-4 w-4" />
          {isCreating
            ? "Creando orden…"
            : isSigning
              ? "Guardando firma…"
              : "Firmar y crear orden"}
        </Button>
      </div>
    </div>
  );
}
