"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";
import type { PaymentStatus } from "@/types/report";

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
};

const PAYMENT_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PARTIAL: "border-orange-200 bg-orange-50 text-orange-800",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-800",
};

const TYPE_LABELS: Record<string, string> = {
  REPAIR_ORDER: "Orden de Reparación",
  BUDGET: "Presupuesto",
  REVISION: "Revisión",
  WARRANTY: "Garantía",
};

function fmt(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: report, isPending, isError } = useQuery({
    queryKey: ["report", id],
    queryFn: () => reportsApi.getOne(id),
  });

  const subtotal = (report?.laborCost ?? 0) + (report?.partsCost ?? 0);
  const discount = report?.discount ?? 0;
  const total = report?.total ?? report?.finalBudget ?? subtotal - discount;

  return (
    <section className="space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/accounting">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          Imprimir / PDF
        </Button>
      </div>

      {isPending && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No fue posible cargar la factura.
        </p>
      )}

      {report && (
        <div className="rounded-2xl border border-border bg-card shadow-sm print:border-none print:shadow-none">
          {/* Invoice header */}
          <div className="flex flex-col gap-6 border-b border-border px-8 py-8 sm:flex-row sm:items-start sm:justify-between">
            {/* Brand */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">PhoneTec</h1>
              <p className="text-sm text-muted-foreground">Servicio técnico de telefonía</p>
              <p className="text-sm text-muted-foreground">info@phonetec.com</p>
            </div>

            {/* Invoice meta */}
            <div className="text-right space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Factura</p>
              <p className="font-mono text-xl font-bold text-foreground">{report.orderNumber}</p>
              <Badge
                variant="outline"
                className={`text-xs ${PAYMENT_CLASSES[report.paymentStatus]}`}
              >
                {PAYMENT_LABELS[report.paymentStatus]}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                Fecha: {fmtDate(report.receptionDate)}
              </p>
              {report.deliveryDate && (
                <p className="text-xs text-muted-foreground">
                  Entrega: {fmtDate(report.deliveryDate)}
                </p>
              )}
            </div>
          </div>

          {/* Customer & device */}
          <div className="grid gap-8 border-b border-border px-8 py-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
              {report.customer ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {report.customer.firstName} {report.customer.lastName}
                  </p>
                  {report.customer.email && (
                    <p className="text-sm text-muted-foreground">{report.customer.email}</p>
                  )}
                  {report.customer.phone1 && (
                    <p className="text-sm text-muted-foreground">{report.customer.phone1}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ID {report.customerId}</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dispositivo</p>
              {report.device ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {report.device.brand?.name ?? String(report.device.brandId)} {report.device.model}
                  </p>
                  {report.device.imeiIn && (
                    <p className="font-mono text-xs text-muted-foreground">IMEI: {report.device.imeiIn}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ID {report.deviceId}</p>
              )}
            </div>
          </div>

          {/* Service details */}
          <div className="border-b border-border px-8 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Detalle del servicio
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de servicio" value={TYPE_LABELS[report.reportType] ?? report.reportType} />
              <Field label="Problema reportado" value={report.reportedIssue} />
              {report.repairPerformed && (
                <Field label="Reparación realizada" value={report.repairPerformed} />
              )}
              {report.technician && (
                <Field
                  label="Técnico"
                  value={`${report.technician.firstName} ${report.technician.lastName}`}
                />
              )}
            </div>
          </div>

          {/* Parts breakdown */}
          {report.parts && report.parts.length > 0 && (
            <div className="border-b border-border px-8 py-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Piezas utilizadas
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Descripción</th>
                    <th className="pb-2 text-right font-medium">Cant.</th>
                    <th className="pb-2 text-right font-medium">P. unitario</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parts.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 text-foreground">{p.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{p.quantity}</td>
                      <td className="py-2 text-right text-muted-foreground">{fmt(p.unitPrice)}</td>
                      <td className="py-2 text-right font-medium text-foreground">
                        {fmt(p.quantity * p.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="px-8 py-6">
            <div className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Mano de obra</span>
                <span>{fmt(report.laborCost)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Piezas</span>
                <span>{fmt(report.partsCost)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Descuento</span>
                  <span>- {fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">{fmt(total)}</span>
              </div>
              {report.paymentMethod && (
                <p className="text-right text-xs text-muted-foreground">
                  Método de pago: {report.paymentMethod}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-8 py-4 text-center text-xs text-muted-foreground">
            PhoneTec · Gracias por confiar en nosotros · {new Date().getFullYear()}
          </div>
        </div>
      )}
    </section>
  );
}
