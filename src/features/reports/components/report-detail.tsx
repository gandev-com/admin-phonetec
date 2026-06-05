"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Printer,
  Receipt,
  ShieldCheck,
  Smartphone,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useReactToPrint } from "react-to-print";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryModal } from "@/features/delivery/components/delivery-modal";
import { reportsApi } from "@/lib/api/reports";
import { usersApi } from "@/lib/api/users";
import { API_URL } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/components/reports/status-badge";
import { ReportPrintView } from "./report-print-view";
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

// STATUS_LABELS imported from @/components/reports/status-badge

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

function fileUrl(doc: ConsentDocument): string | null {
  const raw = doc.fileUrl ?? doc.filePath;
  if (!raw) return null;
  // Always return a same-origin relative URL so Next.js proxies
  // the request through /uploads/* → API_URL/uploads/* rewrite.
  // This avoids Cross-Origin-Resource-Policy blocks.
  const relative = raw.replace(/^https?:\/\/[^/]+/, "");
  return relative.startsWith("/") ? relative : `/${relative}`;
}

function Field({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm text-foreground">{value ?? "—"}</p>
      </div>
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

type EditTab = "general" | "diagnostico" | "costes" | "notas";

// ─── Edit sheet ───────────────────────────────────────────────────────────────

function EditOrderSheet({
  reportId,
  defaultValues,
  open,
  onOpenChange,
  onSaved,
  initialTab = "general",
}: {
  reportId: number | string;
  defaultValues: EditFormValues;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  initialTab?: EditTab;
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

  const TAB_LABELS: Record<EditTab, string> = {
    general: "General",
    diagnostico: "Diagnóstico",
    costes: "Costes",
    notas: "Notas",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full flex flex-col gap-0 p-0 sm:max-w-2xl">
        {/* ── Sticky header ──────────────────────────────────────────────── */}
        <div className="shrink-0 border-b bg-background px-6 pt-5 pb-0">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-lg font-semibold pr-8">Editar orden</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue={initialTab}>
            <TabsList variant="line" className="w-full justify-start gap-0 h-auto rounded-none bg-transparent p-0 border-0">
              {(Object.keys(TAB_LABELS) as EditTab[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="px-4 py-2.5 text-sm rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-foreground"
                >
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* form wraps all tab panels + sticky footer */}
            <form
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="flex flex-col"
              style={{ height: "calc(100vh - 130px)" }}
            >
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* ── GENERAL ──────────────────────────────────────────── */}
                <TabsContent value="general" className="space-y-5 mt-0">
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado y prioridad</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Estado</Label>
                        <Controller
                          control={control}
                          name="currentStatus"
                          render={({ field }) => (
                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue>{field.value ? STATUS_LABELS[field.value as ReportStatus] : "Estado"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
                                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Prioridad</Label>
                        <Controller
                          control={control}
                          name="priority"
                          render={({ field }) => (
                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue>{field.value ? PRIORITY_LABELS[field.value as Priority] : "Prioridad"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(["LOW", "NORMAL", "HIGH", "URGENT"] as Priority[]).map((p) => (
                                  <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <label className="mt-3 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register("isUrgent")} className="h-4 w-4 rounded border-border accent-destructive" />
                      <span className="text-sm">Marcar como urgente</span>
                    </label>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Técnico y fecha</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Técnico asignado</Label>
                        <Controller
                          control={control}
                          name="technicianId"
                          render={({ field }) => (
                            <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue>
                                  {!field.value || field.value === "none"
                                    ? "Sin asignar"
                                    : (() => { const t = technicians.find((u) => String(u.id) === field.value); return t ? `${t.firstName} ${t.lastName}` : "Cargando…"; })()
                                  }
                                </SelectValue>
                              </SelectTrigger>
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
                      <div className="space-y-1.5">
                        <Label>Entrega estimada</Label>
                        <Input type="date" {...register("estimatedDeliveryDate")} />
                      </div>
                    </div>
                  </section>
                </TabsContent>

                {/* ── DIAGNÓSTICO ─────────────────────────────────────── */}
                <TabsContent value="diagnostico" className="space-y-5 mt-0">
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Información técnica</h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Problema reportado</Label>
                        <Textarea {...register("reportedIssue")} rows={3} placeholder="Descripción del problema según el cliente…" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Diagnóstico técnico</Label>
                        <Textarea {...register("technicalDiagnosis")} rows={3} placeholder="Diagnóstico interno del técnico…" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Reparación realizada</Label>
                        <Textarea {...register("repairPerformed")} rows={3} placeholder="Pasos o piezas cambiadas…" />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado del equipo</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Estado de entrada</Label>
                        <Input {...register("entryCondition")} placeholder="Ej: pantalla rota" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Estado de salida</Label>
                        <Controller
                          control={control}
                          name="exitCondition"
                          render={({ field }) => (
                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue>
                                  {field.value
                                    ? { REPAIRED: "Reparado", PARTIALLY_REPAIRED: "Parcialmente reparado", NOT_REPAIRED: "No reparado", CLIENT_NOT_AUTHORIZED: "Cliente no autoriza", IRREPARABLE: "Irreparable" }[field.value] ?? "—"
                                    : "—"
                                  }
                                </SelectValue>
                              </SelectTrigger>
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
                </TabsContent>

                {/* ── COSTES ─────────────────────────────────────────── */}
                <TabsContent value="costes" className="space-y-5 mt-0">
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presupuestos y costes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Presupuesto inicial (€)</Label>
                        <Input type="number" step="0.01" min="0" {...register("initialBudget")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Presupuesto final (€)</Label>
                        <Input type="number" step="0.01" min="0" {...register("finalBudget")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Mano de obra (€)</Label>
                        <Input type="number" step="0.01" min="0" {...register("laborCost")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Piezas (€)</Label>
                        <Input type="number" step="0.01" min="0" {...register("partsCost")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Descuento (€)</Label>
                        <Input type="number" step="0.01" min="0" {...register("discount")} />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pago</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Estado de pago</Label>
                        <Controller
                          control={control}
                          name="paymentStatus"
                          render={({ field }) => (
                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue>{field.value ? PAYMENT_LABELS[field.value as PaymentStatus] : "—"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(["PENDING", "PARTIAL", "PAID", "REFUNDED"] as PaymentStatus[]).map((p) => (
                                  <SelectItem key={p} value={p}>{PAYMENT_LABELS[p]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Método de pago</Label>
                        <Input {...register("paymentMethod")} placeholder="Efectivo, tarjeta…" />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Garantía</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Tipo de garantía</Label>
                        <Controller
                          control={control}
                          name="warrantyType"
                          render={({ field }) => (
                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue>{field.value ? WARRANTY_LABELS[field.value as WarrantyType] : "—"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(WARRANTY_LABELS) as WarrantyType[]).map((w) => (
                                  <SelectItem key={w} value={w}>{WARRANTY_LABELS[w]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Días de garantía</Label>
                        <Input type="number" min="0" {...register("warrantyDays")} />
                      </div>
                    </div>
                  </section>
                </TabsContent>

                {/* ── NOTAS ──────────────────────────────────────────── */}
                <TabsContent value="notas" className="space-y-4 mt-0">
                  <div className="space-y-1.5">
                    <Label>Notas internas <span className="text-muted-foreground font-normal">(solo taller)</span></Label>
                    <Textarea {...register("internalNotes")} rows={5} placeholder="Información interna, códigos, recordatorios…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notas para el cliente</Label>
                    <Textarea {...register("customerNotes")} rows={5} placeholder="Mensaje visible para el cliente…" />
                  </div>
                </TabsContent>

              </div>

              {/* ── Sticky footer ──────────────────────────────────────── */}
              <div className="shrink-0 flex items-center justify-between gap-3 border-t bg-background px-6 py-4">
                {isDirty ? (
                  <p className="text-xs text-amber-600 font-medium">Hay cambios sin guardar</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin cambios pendientes</p>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!isDirty || mutation.isPending}>
                    {mutation.isPending ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            </form>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Consent document card ────────────────────────────────────────────────────

function ConsentDocCard({ doc }: { doc: ConsentDocument }) {
  const url = fileUrl(doc);
  const imageExtRe = /\.(png|jpe?g|webp)$/i;
  const isImage =
    !!doc.signatureData ||
    imageExtRe.test(doc.filePath ?? "") ||
    imageExtRe.test(doc.fileUrl ?? "");
  const imgSrc = doc.signatureData ?? url;
  const label = doc.type === "RECEPTION" ? "Firma de recepción" : "Firma de entrega";

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">{label}</p>
        </div>
        {url && (
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
        )}
      </div>

      {isImage && imgSrc && (
        <div className="rounded-lg border bg-white p-2">
          <div className="relative h-24 max-w-full">
            <Image src={imgSrc} alt={label} fill className="object-contain" />
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
}


// ─── Main component ───────────────────────────────────────────────────────────

interface ReportDetailProps {
  id: string;
}

export function ReportDetail({ id }: ReportDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<EditTab>("general");

  function openEdit(tab: EditTab = "general") {
    setEditTab(tab);
    setEditOpen(true);
  }
  const [deliverOpen, setDeliverOpen] = useState(false);
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const reportQuery = useQuery({
    queryKey: ["reports", id],
    queryFn: () => reportsApi.getOne(id),
  });

  if (reportQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
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
      {/* ── Header card ───────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary/60 to-primary" />
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          {/* Left: order meta */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-xl font-semibold text-foreground">
                {report.orderNumber}
              </h2>
              {report.isUrgent && <Badge variant="destructive">Urgente</Badge>}
              <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[report.currentStatus])}>
                {STATUS_LABELS[report.currentStatus] ?? report.currentStatus}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", PAYMENT_COLOR[report.paymentStatus])}>
                {PAYMENT_LABELS[report.paymentStatus] ?? report.paymentStatus}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {ORDER_TYPE_LABELS[report.reportType]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Prioridad{" "}
              <span className="font-medium text-foreground">{PRIORITY_LABELS[report.priority]}</span>
              {" · "}Recibido el{" "}
              <span className="font-medium text-foreground">
                {fmtDate(report.receptionDate || report.createdAt)}
              </span>
              {report.estimatedDeliveryDate && (
                <>
                  {" · "}Entrega estimada{" "}
                  <span className="font-medium text-foreground">
                    {fmtDate(report.estimatedDeliveryDate)}
                  </span>
                </>
              )}
            </p>
            {technician && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wrench className="h-3.5 w-3.5" />
                Técnico:{" "}
                <span className="font-medium text-foreground">
                  {technician.firstName} {technician.lastName}
                </span>
              </p>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePrint()}>
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>
            <Link
              href={`/accounting/${report.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Receipt className="h-3.5 w-3.5" />
              Factura
            </Link>
            <Button size="sm" onClick={() => openEdit("general")}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            {report.currentStatus === "READY_FOR_PICKUP" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setDeliverOpen(true)}
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Entregar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Customer + Device ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Customer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Cliente
            </CardTitle>
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
          <CardContent className="space-y-3">
            {customer ? (
              <>
                <Field
                  label="Nombre completo"
                  value={`${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`}
                  icon={<User className="h-3.5 w-3.5" />}
                />
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Documento" value={`${customer.documentType} ${customer.document}`} />
                  <Field
                    label="Teléfono"
                    value={customer.phone1}
                    icon={<Phone className="h-3.5 w-3.5" />}
                  />
                  {customer.email && (
                    <Field
                      label="Email"
                      value={
                        <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                          {customer.email}
                        </a>
                      }
                    />
                  )}
                  {(customer.city || customer.province) && (
                    <Field
                      label="Ciudad / Provincia"
                      value={[customer.city, customer.province].filter(Boolean).join(", ")}
                      icon={<MapPin className="h-3.5 w-3.5" />}
                    />
                  )}
                </div>
              </>
            ) : (
              <Field label="ID" value={String(report.customerId)} />
            )}
          </CardContent>
        </Card>

        {/* Device */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              Dispositivo
            </CardTitle>
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
          <CardContent className="space-y-3">
            {device ? (
              <>
                <Field
                  label="Marca / Modelo"
                  value={`${device.brand?.name ?? ""} ${device.model ?? ""}`.trim() || "—"}
                  icon={<Smartphone className="h-3.5 w-3.5" />}
                />
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="IMEI entrada" value={device.imeiIn} />
                  <Field label="IMEI salida" value={device.imeiOut} />
                  <Field label="Nº Serie" value={device.serialNumber} />
                  <Field label="Estado pantalla" value={device.screenCondition} />
                  <Field label="Estado carcasa" value={device.caseCondition} />
                  {device.dents && <Field label="Golpes" value={device.dents} />}
                  {device.scratches && <Field label="Arañazos" value={device.scratches} />}
                </div>
                {/* Accessories */}
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    device.hasSimCard && "SIM",
                    device.hasSdCard && "SD",
                    device.hasCharger && "Cargador",
                    device.hasBackCover && "Tapa",
                    device.hasBattery && "Batería",
                  ]
                    .filter(Boolean)
                    .map((acc) => (
                      <span
                        key={String(acc)}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {acc}
                      </span>
                    ))}
                  {device.otherAccessories && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {device.otherAccessories}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <Field label="ID" value={String(report.deviceId)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Diagnosis & repair + Dates (side-by-side on lg) ───────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Diagnosis */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Diagnóstico y reparación
            </CardTitle>
            <Button variant="ghost" size="xs" onClick={() => openEdit("diagnostico")}>
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Problema reportado" value={report.reportedIssue} />
            <Separator />
            <Field label="Diagnóstico técnico" value={report.technicalDiagnosis} />
            <Separator />
            <Field label="Reparación realizada" value={report.repairPerformed} />
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estado de entrada" value={report.entryCondition} />
              <Field
                label="Estado de salida"
                value={
                  report.exitCondition
                    ? {
                        REPAIRED: "Reparado",
                        PARTIALLY_REPAIRED: "Parcialmente reparado",
                        NOT_REPAIRED: "No reparado",
                        CLIENT_NOT_AUTHORIZED: "Cliente no autoriza",
                        IRREPARABLE: "Irreparable",
                      }[report.exitCondition] ?? report.exitCondition
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Fechas
            </CardTitle>
            <Button variant="ghost" size="xs" onClick={() => openEdit("general")}>
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Recepción" value={fmtDate(report.receptionDate)} />
            <Separator />
            <Field label="Entrega estimada" value={fmtDate(report.estimatedDeliveryDate)} />
            <Separator />
            <Field label="Reparación" value={fmtDate(report.repairDate)} />
            <Separator />
            <Field label="Entrega real" value={fmtDate(report.deliveryDate)} />
            {report.cancellationDate && (
              <>
                <Separator />
                <Field label="Cancelación" value={fmtDate(report.cancellationDate)} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Costs ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            Costes y pago
          </CardTitle>
          <Button variant="ghost" size="xs" onClick={() => openEdit("costes")}>
            <Pencil className="h-3 w-3" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Pres. inicial", value: fmt(report.initialBudget) },
              { label: "Pres. final", value: fmt(report.finalBudget) },
              { label: "Mano de obra", value: fmt(report.laborCost) },
              { label: "Piezas", value: fmt(report.partsCost) },
              { label: "Descuento", value: fmt(report.discount) },
              {
                label: "Total",
                value: (
                  <span className="text-lg font-bold text-primary">
                    {fmt(
                      report.total ||
                      report.finalBudget ||
                      ((report.laborCost ?? 0) + (report.partsCost ?? 0) - (report.discount ?? 0)) ||
                      null
                    )}
                  </span>
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-4">
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
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Repuesto</th>
                    <th className="px-3 py-2 font-medium">Cant.</th>
                    <th className="px-3 py-2 font-medium">P. unit.</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parts.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2">{p.quantity}</td>
                      <td className="px-3 py-2">{fmt(p.unitPrice)}</td>
                      <td className="px-3 py-2 font-medium">{fmt(p.quantity * p.unitPrice)}</td>
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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Garantía
            </CardTitle>
            <Button variant="ghost" size="xs" onClick={() => openEdit("costes")}>
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Tipo" value={WARRANTY_LABELS[report.warrantyType]} />
            <Field label="Días" value={report.warrantyDays != null ? String(report.warrantyDays) : undefined} />
            <Field label="Vence" value={fmtDate(report.warrantyEndDate)} />
          </CardContent>
        </Card>
      )}

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      {(report.internalNotes || report.customerNotes) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {report.internalNotes && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Notas internas (solo taller)</CardTitle>
                <Button variant="ghost" size="xs" onClick={() => openEdit("notas")}>
                  <Pencil className="h-3 w-3" />
                  Editar
                </Button>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {report.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}
          {report.customerNotes && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Notas para el cliente</CardTitle>
                <Button variant="ghost" size="xs" onClick={() => openEdit("notas")}>
                  <Pencil className="h-3 w-3" />
                  Editar
                </Button>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {report.customerNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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

      {deliverOpen && (
        <DeliveryModal
          report={report}
          onSuccess={() => {
            setDeliverOpen(false);
            queryClient.invalidateQueries({ queryKey: ["reports", id] });
          }}
          onClose={() => setDeliverOpen(false)}
        />
      )}

      {editOpen && (
        <EditOrderSheet
          reportId={report.id}
          defaultValues={editDefaults}
          open={editOpen}
          onOpenChange={setEditOpen}
          initialTab={editTab}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["reports", id] })}
        />
      )}

      {/* ── Hidden print layout ───────────────────────────────────────────── */}
      <div className="hidden">
        <ReportPrintView ref={printRef} report={report} />
      </div>
    </div>
  );
}

