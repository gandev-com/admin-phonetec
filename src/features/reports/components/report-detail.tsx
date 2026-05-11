"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  Pencil,
  Printer,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { reportsApi } from "@/lib/api/reports";
import { usersApi } from "@/lib/api/users";
import { API_URL } from "@/lib/api/client";
import type {
  ConsentDocument,
  ExitCondition,
  PaymentStatus,
  Priority,
  ReportStatus,
  ReportType,
  UpdateReportDto,
  WarrantyType,
} from "@/types/report";

// ─── Display maps ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ReportStatus, string> = {
  RECEIVED: "Recibido",
  IN_DIAGNOSIS: "Diagnóstico",
  BUDGET_SENT: "Presupuesto enviado",
  BUDGET_ACCEPTED: "Pres. aceptado",
  BUDGET_REJECTED: "Pres. rechazado",
  WAITING_PARTS: "Esp. repuesto",
  IN_REPAIR: "En reparación",
  REPAIRED: "Reparado",
  TESTING: "En pruebas",
  READY_FOR_PICKUP: "Listo para recoger",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  IRREPARABLE: "No reparable",
};

const STATUS_COLOR: Record<ReportStatus, string> = {
  RECEIVED: "border-blue-200 bg-blue-50 text-blue-800",
  IN_DIAGNOSIS: "border-purple-200 bg-purple-50 text-purple-800",
  BUDGET_SENT: "border-indigo-200 bg-indigo-50 text-indigo-800",
  BUDGET_ACCEPTED: "border-teal-200 bg-teal-50 text-teal-800",
  BUDGET_REJECTED: "border-red-200 bg-red-50 text-red-800",
  WAITING_PARTS: "border-amber-200 bg-amber-50 text-amber-800",
  IN_REPAIR: "border-orange-200 bg-orange-50 text-orange-800",
  REPAIRED: "border-green-200 bg-green-50 text-green-800",
  TESTING: "border-cyan-200 bg-cyan-50 text-cyan-800",
  READY_FOR_PICKUP: "border-lime-200 bg-lime-50 text-lime-800",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-gray-200 bg-gray-50 text-gray-600",
  IRREPARABLE: "border-rose-200 bg-rose-50 text-rose-800",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pago pendiente",
  PARTIAL: "Pago parcial",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
};

const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PARTIAL: "border-orange-200 bg-orange-50 text-orange-800",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-800",
};

const ORDER_TYPE_LABELS: Record<ReportType, string> = {
  REPAIR_ORDER: "Reparación",
  BUDGET: "Presupuesto",
  REVISION: "Revisión",
  WARRANTY: "Garantía",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const WARRANTY_LABELS: Record<WarrantyType, string> = {
  NO_WARRANTY: "Sin garantía",
  WARRANTY_3_MONTHS: "3 meses",
  WARRANTY_6_MONTHS: "6 meses",
  WARRANTY_12_MONTHS: "12 meses",
  WARRANTY_24_MONTHS: "24 meses",
  MANUFACTURER_WARRANTY: "Garantía fabricante",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { dateStyle: "medium" });
}

function fileUrl(doc: ConsentDocument): string {
  // Always return a same-origin relative URL so Next.js proxies
  // the request through /uploads/* → API_URL/uploads/* rewrite.
  // This avoids Cross-Origin-Resource-Policy blocks.
  const raw = doc.fileUrl ?? doc.filePath;
  // Strip absolute origin if present (e.g. http://localhost:3001/uploads/...)
  const relative = raw.replace(/^https?:\/\/[^/]+/, "");
  return relative.startsWith("/") ? relative : `/${relative}`;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

// ─── Edit order schema ────────────────────────────────────────────────────────

const editSchema = z.object({
  reportedIssue: z.string().optional(),
  technicalDiagnosis: z.string().optional(),
  repairPerformed: z.string().optional(),
  entryCondition: z.string().optional(),
  exitCondition: z.enum(["REPAIRED","PARTIALLY_REPAIRED","NOT_REPAIRED","CLIENT_NOT_AUTHORIZED","IRREPARABLE"] as const).optional(),
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  technicianId: z.string().optional(),
  currentStatus: z.string().optional(),
  priority: z.enum(["LOW","NORMAL","HIGH","URGENT"] as const).optional(),
  isUrgent: z.boolean().optional(),
  estimatedDeliveryDate: z.string().optional(),
  initialBudget: z.string().optional(),
  finalBudget: z.string().optional(),
  laborCost: z.string().optional(),
  partsCost: z.string().optional(),
  discount: z.string().optional(),
  paymentStatus: z.enum(["PENDING","PARTIAL","PAID","REFUNDED"] as const).optional(),
  paymentMethod: z.string().optional(),
  warrantyType: z.enum(["NO_WARRANTY","WARRANTY_3_MONTHS","WARRANTY_6_MONTHS","WARRANTY_12_MONTHS","WARRANTY_24_MONTHS","MANUFACTURER_WARRANTY"] as const).optional(),
  warrantyDays: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Edit sheet ───────────────────────────────────────────────────────────────

function EditOrderSheet({
  reportId,
  defaultValues,
  open,
  onOpenChange,
  onSaved,
}: {
  reportId: number | string;
  defaultValues: EditFormValues;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues,
  });

  const techniciansQuery = useQuery({
    queryKey: ["users", { role: "TECHNICIAN" }],
    queryFn: () => usersApi.list({ limit: 50 }),
    enabled: open,
    staleTime: 60_000,
  });
  const technicians = techniciansQuery.data?.data ?? [];

  const mutation = useMutation({
    mutationFn: (values: EditFormValues) => {
      const dto: UpdateReportDto = {
        reportedIssue: values.reportedIssue || undefined,
        technicalDiagnosis: values.technicalDiagnosis || undefined,
        repairPerformed: values.repairPerformed || undefined,
        entryCondition: values.entryCondition || undefined,
        exitCondition: (values.exitCondition as ExitCondition) || undefined,
        internalNotes: values.internalNotes || undefined,
        customerNotes: values.customerNotes || undefined,
        technicianId: values.technicianId === "none" ? undefined : values.technicianId || undefined,
        currentStatus: (values.currentStatus as ReportStatus) || undefined,
        priority: (values.priority as Priority) || undefined,
        isUrgent: values.isUrgent,
        estimatedDeliveryDate: values.estimatedDeliveryDate || undefined,
        initialBudget: values.initialBudget ? parseFloat(values.initialBudget) : undefined,
        finalBudget: values.finalBudget ? parseFloat(values.finalBudget) : undefined,
        laborCost: values.laborCost ? parseFloat(values.laborCost) : undefined,
        partsCost: values.partsCost ? parseFloat(values.partsCost) : undefined,
        discount: values.discount ? parseFloat(values.discount) : undefined,
        paymentStatus: (values.paymentStatus as PaymentStatus) || undefined,
        paymentMethod: values.paymentMethod || undefined,
        warrantyType: (values.warrantyType as WarrantyType) || undefined,
        warrantyDays: values.warrantyDays ? parseInt(values.warrantyDays) : undefined,
      };
      return reportsApi.update(reportId, dto);
    },
    onSuccess: () => {
      toast.success("Orden actualizada");
      onSaved();
      onOpenChange(false);
    },
    onError: () => toast.error("Error al guardar los cambios"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle>Editar orden</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6 pb-10">
          {/* Status & priority */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado y prioridad</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="currentStatus"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>Prioridad</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Prioridad" /></SelectTrigger>
                      <SelectContent>
                        {(["LOW","NORMAL","HIGH","URGENT"] as Priority[]).map((p) => (
                          <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isUrgent" {...register("isUrgent")} className="h-4 w-4 rounded" />
              <Label htmlFor="isUrgent" className="cursor-pointer font-normal">Urgente</Label>
            </div>
          </section>

          <Separator />

          {/* Problem & repair */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diagnóstico y reparación</p>
            <div className="space-y-1">
              <Label>Problema reportado</Label>
              <Textarea {...register("reportedIssue")} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Diagnóstico técnico</Label>
              <Textarea {...register("technicalDiagnosis")} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Reparación realizada</Label>
              <Textarea {...register("repairPerformed")} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estado de entrada</Label>
                <Input {...register("entryCondition")} />
              </div>
              <div className="space-y-1">
                <Label>Estado de salida</Label>
                <Controller
                  control={control}
                  name="exitCondition"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REPAIRED">Reparado</SelectItem>
                        <SelectItem value="PARTIALLY_REPAIRED">Parcialmente reparado</SelectItem>
                        <SelectItem value="NOT_REPAIRED">No reparado</SelectItem>
                        <SelectItem value="CLIENT_NOT_AUTHORIZED">Cliente no autoriza</SelectItem>
                        <SelectItem value="IRREPARABLE">Irreparable</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Technician & dates */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Técnico y fechas</p>
            <div className="space-y-1">
              <Label>Técnico asignado</Label>
              <Controller
                control={control}
                name="technicianId"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={String(t.id)} value={String(t.id)}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Entrega estimada</Label>
              <Input type="date" {...register("estimatedDeliveryDate")} />
            </div>
          </section>

          <Separator />

          {/* Budget & payment */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costes y pago</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Presupuesto inicial (€)</Label>
                <Input type="number" step="0.01" min="0" {...register("initialBudget")} />
              </div>
              <div className="space-y-1">
                <Label>Presupuesto final (€)</Label>
                <Input type="number" step="0.01" min="0" {...register("finalBudget")} />
              </div>
              <div className="space-y-1">
                <Label>Mano de obra (€)</Label>
                <Input type="number" step="0.01" min="0" {...register("laborCost")} />
              </div>
              <div className="space-y-1">
                <Label>Piezas (€)</Label>
                <Input type="number" step="0.01" min="0" {...register("partsCost")} />
              </div>
              <div className="space-y-1">
                <Label>Descuento (€)</Label>
                <Input type="number" step="0.01" min="0" {...register("discount")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estado de pago</Label>
                <Controller
                  control={control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {(["PENDING","PARTIAL","PAID","REFUNDED"] as PaymentStatus[]).map((p) => (
                          <SelectItem key={p} value={p}>{PAYMENT_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>Método de pago</Label>
                <Input {...register("paymentMethod")} placeholder="Efectivo, tarjeta…" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Warranty */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Garantía</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de garantía</Label>
                <Controller
                  control={control}
                  name="warrantyType"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(WARRANTY_LABELS) as WarrantyType[]).map((w) => (
                          <SelectItem key={w} value={w}>{WARRANTY_LABELS[w]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>Días de garantía</Label>
                <Input type="number" min="0" {...register("warrantyDays")} />
              </div>
            </div>
          </section>

          <Separator />

          {/* Notes */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</p>
            <div className="space-y-1">
              <Label>Notas internas (solo taller)</Label>
              <Textarea {...register("internalNotes")} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Notas para el cliente</Label>
              <Textarea {...register("customerNotes")} rows={2} />
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isDirty || mutation.isPending}>
              {mutation.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Consent document card ────────────────────────────────────────────────────

function ConsentDocCard({ doc }: { doc: ConsentDocument }) {
  const url = fileUrl(doc);
  const imageExtRe = /\.(png|jpe?g|webp)$/i;
  const isImage =
    imageExtRe.test(doc.filePath) ||
    imageExtRe.test(doc.fileUrl ?? "") ||
    (!doc.filePath.includes(".") && !doc.fileUrl?.includes("."));
  const label = doc.type === "RECEPTION" ? "Firma de recepción" : "Firma de entrega";

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">{label}</p>
        </div>
        <div className="flex items-center gap-2">
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-24 w-auto max-w-full object-contain" />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Firmado por: <span className="font-medium text-foreground">{doc.signedBy}</span>
        {" · "}
        {new Date(doc.signedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ReportDetailProps {
  id: string;
}

export function ReportDetail({ id }: ReportDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const reportQuery = useQuery({
    queryKey: ["reports", id],
    queryFn: () => reportsApi.getOne(id),
  });

  if (reportQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (reportQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        No fue posible cargar la orden.
      </div>
    );
  }

  const report = reportQuery.data;
  const customer = report.customer;
  const device = report.device;
  const technician = report.technician;

  // Merge consentDocuments (array) + legacy consentDocument
  const allConsents: ConsentDocument[] = [
    ...(report.consentDocuments ?? []),
    ...(report.consentDocument && !(report.consentDocuments ?? []).find((d) => d.id === report.consentDocument!.id)
      ? [{ ...report.consentDocument, type: "DELIVERY" as const }]
      : []),
  ];

  const editDefaults: EditFormValues = {
    reportedIssue: report.reportedIssue ?? "",
    technicalDiagnosis: report.technicalDiagnosis ?? "",
    repairPerformed: report.repairPerformed ?? "",
    entryCondition: report.entryCondition ?? "",
    exitCondition: report.exitCondition ?? undefined,
    internalNotes: report.internalNotes ?? "",
    customerNotes: report.customerNotes ?? "",
    technicianId: report.technicianId ? String(report.technicianId) : "none",
    currentStatus: report.currentStatus,
    priority: report.priority,
    isUrgent: report.isUrgent,
    estimatedDeliveryDate: report.estimatedDeliveryDate?.split("T")[0] ?? "",
    initialBudget: report.initialBudget != null ? String(report.initialBudget) : "",
    finalBudget: report.finalBudget != null ? String(report.finalBudget) : "",
    laborCost: report.laborCost != null ? String(report.laborCost) : "",
    partsCost: report.partsCost != null ? String(report.partsCost) : "",
    discount: report.discount != null ? String(report.discount) : "",
    paymentStatus: report.paymentStatus,
    paymentMethod: report.paymentMethod ?? "",
    warrantyType: report.warrantyType ?? "NO_WARRANTY",
    warrantyDays: report.warrantyDays != null ? String(report.warrantyDays) : "",
  };

  return (
    <div className="space-y-6">
      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold text-foreground">
              {report.orderNumber}
            </h2>
            {report.isUrgent && <Badge variant="destructive">Urgente</Badge>}
            <Badge
              variant="outline"
              className={`text-xs ${STATUS_COLOR[report.currentStatus] ?? ""}`}
            >
              {STATUS_LABELS[report.currentStatus] ?? report.currentStatus}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${PAYMENT_COLOR[report.paymentStatus] ?? ""}`}
            >
              {PAYMENT_LABELS[report.paymentStatus] ?? report.paymentStatus}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {ORDER_TYPE_LABELS[report.reportType]} · Prioridad {PRIORITY_LABELS[report.priority]} ·{" "}
            Recibido el {fmtDate(report.receptionDate || report.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </Button>
          <Link
            href={`/accounting/${report.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Receipt className="h-3.5 w-3.5" />
            Ver factura
          </Link>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      </div>

      {/* ── Customer + Device ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Cliente</CardTitle>
            {customer && (
              <Link
                href={`/customers/${customer.id}`}
                className={buttonVariants({ variant: "ghost", size: "xs" })}
              >
                <ExternalLink className="h-3 w-3" />
                Perfil
              </Link>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {customer ? (
              <>
                <Field
                  label="Nombre"
                  value={`${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`}
                />
                <Field label="Documento" value={`${customer.documentType} ${customer.document}`} />
                <Field label="Teléfono" value={customer.phone1} />
                <Field label="Email" value={customer.email} />
                {(customer.city || customer.province) && (
                  <Field label="Ciudad" value={[customer.city, customer.province].filter(Boolean).join(", ")} />
                )}
              </>
            ) : (
              <Field label="ID" value={String(report.customerId)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Dispositivo</CardTitle>
            {device && (
              <Link
                href={`/devices/${device.id}`}
                className={buttonVariants({ variant: "ghost", size: "xs" })}
              >
                <ExternalLink className="h-3 w-3" />
                Ficha
              </Link>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {device ? (
              <>
                <Field
                  label="Marca / Modelo"
                  value={`${device.brand?.name ?? ""} ${device.model ?? ""}`.trim() || "—"}
                />
                <Field label="IMEI entrada" value={device.imeiIn} />
                <Field label="IMEI salida" value={device.imeiOut} />
                <Field label="Nº Serie" value={device.serialNumber} />
                <Field label="Pantalla" value={device.screenCondition} />
                <Field label="Carcasa" value={device.caseCondition} />
              </>
            ) : (
              <Field label="ID" value={String(report.deviceId)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Diagnosis & repair ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Diagnóstico y reparación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Problema reportado" value={report.reportedIssue} />
          <Field label="Diagnóstico técnico" value={report.technicalDiagnosis} />
          <Field label="Reparación realizada" value={report.repairPerformed} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado de entrada" value={report.entryCondition} />
            <Field label="Estado de salida" value={report.exitCondition} />
          </div>
          {technician && (
            <Field label="Técnico" value={`${technician.firstName} ${technician.lastName}`} />
          )}
        </CardContent>
      </Card>

      {/* ── Dates ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fechas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Recepción" value={fmtDate(report.receptionDate)} />
          <Field label="Entrega estimada" value={fmtDate(report.estimatedDeliveryDate)} />
          <Field label="Reparación" value={fmtDate(report.repairDate)} />
          <Field label="Entrega real" value={fmtDate(report.deliveryDate)} />
        </CardContent>
      </Card>

      {/* ── Costs ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Costes y pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Presupuesto inicial" value={fmt(report.initialBudget)} />
            <Field label="Presupuesto final" value={fmt(report.finalBudget)} />
            <Field label="Mano de obra" value={fmt(report.laborCost)} />
            <Field label="Piezas" value={fmt(report.partsCost)} />
            <Field label="Descuento" value={fmt(report.discount)} />
            <Field
              label="Total"
              value={
                <span className="font-semibold text-primary">
                  {fmt(report.total ?? report.finalBudget)}
                </span>
              }
            />
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado de pago" value={PAYMENT_LABELS[report.paymentStatus]} />
            <Field label="Método de pago" value={report.paymentMethod} />
          </div>
        </CardContent>
      </Card>

      {/* ── Parts ─────────────────────────────────────────────────────────── */}
      {report.parts && report.parts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Repuestos utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Repuesto</th>
                    <th className="pb-2 pr-4 font-medium">Cant.</th>
                    <th className="pb-2 pr-4 font-medium">P. unit.</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parts.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{p.name}</td>
                      <td className="py-2 pr-4">{p.quantity}</td>
                      <td className="py-2 pr-4">{fmt(p.unitPrice)}</td>
                      <td className="py-2 font-medium">{fmt(p.quantity * p.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Warranty ──────────────────────────────────────────────────────── */}
      {report.warrantyType && report.warrantyType !== "NO_WARRANTY" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Garantía</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Tipo" value={WARRANTY_LABELS[report.warrantyType]} />
            <Field label="Días" value={report.warrantyDays != null ? String(report.warrantyDays) : undefined} />
            <Field label="Vence" value={fmtDate(report.warrantyEndDate)} />
          </CardContent>
        </Card>
      )}

      {/* ── Signature documents ───────────────────────────────────────────── */}
      {allConsents.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Documentos firmados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allConsents.map((doc) => (
              <ConsentDocCard key={doc.id} doc={doc} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      {(report.internalNotes || report.customerNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.internalNotes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Internas (solo taller)</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{report.internalNotes}</p>
              </div>
            )}
            {report.customerNotes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Para el cliente</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{report.customerNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Edit sheet ────────────────────────────────────────────────────── */}
      {editOpen && (
        <EditOrderSheet
          reportId={report.id}
          defaultValues={editDefaults}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["reports", id] })}
        />
      )}
    </div>
  );
}

