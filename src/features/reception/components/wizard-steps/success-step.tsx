"use client";

import { useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Printer, Smartphone } from "lucide-react";
import { useReactToPrint } from "react-to-print";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ORDER_TYPE_LABELS,
  PRIORITY_LABELS,
  type OrderFormValues,
} from "@/lib/schemas/reception";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";
import type { Report } from "@/types/report";

import { CustomerInfoCard } from "./customer-info-card";

interface SuccessStepProps {
  customer: Customer;
  device: Device;
  report: Report;
  pendingOrderData: OrderFormValues;
  signatureDataUrl: string | null;
  signedBy: string;
  onReset: () => void;
}

export function SuccessStep({
  customer,
  device,
  report,
  pendingOrderData,
  signatureDataUrl,
  signedBy,
  onReset,
}: SuccessStepProps) {
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintReceipt = useReactToPrint({ contentRef: receiptPrintRef });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div>
            <p className="text-lg font-semibold text-foreground">Recepción completada</p>
            <p className="font-mono text-sm text-muted-foreground">{report.orderNumber}</p>
          </div>
        </CardContent>
      </Card>

      <Card id="reception-receipt">
        <CardHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Phonetec</CardTitle>
              <p className="text-sm text-muted-foreground">Taller de reparación</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono font-bold">{report.orderNumber}</p>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString("es-ES", { dateStyle: "medium" })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div ref={receiptPrintRef} className="print-doc-root space-y-5">
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
                responsabiliza de la pérdida de datos contenidos en el dispositivo.
              </p>
            </div>

            {signatureDataUrl && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Firma del cliente
                </p>
                <div className="rounded-xl border bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureDataUrl}
                    alt="Firma del cliente"
                    className="h-24 w-auto max-w-full"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Firmado por:{" "}
                    <span className="font-medium text-foreground">{signedBy}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handlePrintReceipt()}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={onReset}>
          Nueva recepción
        </Button>
        <Link href={`/reports/${report.id}`} className={buttonVariants({ variant: "default" })}>
          Ver orden
        </Link>
      </div>
    </div>
  );
}
