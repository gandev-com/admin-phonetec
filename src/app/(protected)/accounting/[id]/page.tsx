"use client";

import { use, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Download, ExternalLink, FileSignature, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/shared/back-button";
import { reportsApi } from "@/lib/api/reports";
import { API_URL } from "@/lib/api/client";
import type { ConsentDocument, PaymentStatus } from "@/types/report";

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
  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: invoiceRef });

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
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <BackButton fallback="/accounting" />
        <div className="flex flex-wrap gap-2">
          {report && (
            <Link
              href={`/reports/${report.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Ver orden
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => handlePrint()}>
            <Printer className="h-3.5 w-3.5" />
            Imprimir / PDF
          </Button>
        </div>
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
        <div ref={invoiceRef} className="print-doc-root rounded-2xl border border-border bg-card shadow-sm">
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

          {/* Signature documents */}
          {(() => {
            const allConsents: ConsentDocument[] = [
              ...(report.consentDocuments ?? []),
              ...(report.consentDocument && !(report.consentDocuments ?? []).find((d) => d.id === report.consentDocument!.id)
                ? [{ ...report.consentDocument, type: "DELIVERY" as const }]
                : []),
            ];
            if (allConsents.length === 0) return null;
            return (
              <div className="border-t border-border px-8 py-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Documentos firmados
                </p>
                <div className="space-y-4">
                  {allConsents.map((doc) => {
                    // Use relative URL so Next.js proxy (/uploads/* → API) is used,
                    // avoiding Cross-Origin-Resource-Policy blocks.
                    const rawUrl = doc.fileUrl ?? doc.filePath;
                    const url = rawUrl.replace(/^https?:\/\/[^/]+/, "").replace(/^\/?\//, "/") || `/${rawUrl}`;
                    const imageExtRe = /\.(png|jpe?g|webp)$/i;
                    const isImage = imageExtRe.test(doc.filePath) || imageExtRe.test(doc.fileUrl ?? "") || (!doc.filePath.includes(".") && !doc.fileUrl?.includes("."));
                    const label = doc.type === "RECEPTION" ? "Firma de recepción" : "Firma de entrega";
                    return (
                      <div key={doc.id} className="rounded-xl border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileSignature className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{label}</p>
                          </div>
                          <div className="flex items-center gap-2 print:hidden">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Ver
                            </a>
                            <a
                              href={url}
                              download
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Descargar
                            </a>
                          </div>
                        </div>
                        {isImage && (
                          <div className="rounded-lg border bg-white p-2">
                            <div className="relative h-24 max-w-full">
                              <Image src={url} alt={label} fill className="object-contain" />
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Firmado por: <span className="font-medium text-foreground">{doc.signedBy}</span>
                          {" · "}
                          {new Date(doc.signedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="border-t border-border px-8 py-4 text-center text-xs text-muted-foreground">
            PhoneTec · Gracias por confiar en nosotros · {new Date().getFullYear()}
          </div>
        </div>
      )}
    </section>
  );
}
