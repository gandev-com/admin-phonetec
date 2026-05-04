"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";
import type { PaymentStatus, ReportStatus } from "@/types/report";

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

const STATUS_VARIANT: Record<ReportStatus, "default" | "secondary" | "destructive" | "outline"> = {
  RECEIVED: "outline",
  IN_DIAGNOSIS: "secondary",
  BUDGET_SENT: "secondary",
  BUDGET_ACCEPTED: "default",
  BUDGET_REJECTED: "destructive",
  WAITING_PARTS: "secondary",
  IN_REPAIR: "default",
  REPAIRED: "default",
  TESTING: "secondary",
  READY_FOR_PICKUP: "outline",
  DELIVERED: "outline",
  CANCELLED: "destructive",
  IRREPARABLE: "destructive",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

interface ReportDetailProps {
  id: string;
}

export function ReportDetail({ id }: ReportDetailProps) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground font-mono">
              {report.orderNumber}
            </h2>
            {report.isUrgent ? (
              <Badge variant="destructive">Urgente</Badge>
            ) : null}
            <Badge variant={STATUS_VARIANT[report.currentStatus] ?? "outline"}>
              {STATUS_LABELS[report.currentStatus] ?? report.currentStatus}
            </Badge>
            <Badge variant="outline">
              {PAYMENT_LABELS[report.paymentStatus] ?? report.paymentStatus}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Creado el {new Date(report.createdAt).toLocaleDateString("es-ES")} &middot;{" "}
            Tipo: {report.reportType} &middot; Prioridad: {report.priority}
          </p>
        </div>
      </div>

      {/* Customer + Device */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {customer ? (
              <>
                <Field label="Nombre" value={`${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`} />
                <Field label="Documento" value={`${customer.documentType} ${customer.document}`} />
                <Field label="Teléfono" value={customer.phone1} />
                <Field label="Email" value={customer.email} />
                <Field label="Ciudad" value={`${customer.city}, ${customer.province}`} />
              </>
            ) : (
              <Field label="ID" value={String(report.customerId)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {device ? (
              <>
                <Field label="Marca / Modelo" value={`${device.brand?.name ?? ""} ${device.model ?? ""}`.trim() || "—"} />
                <Field label="IMEI entrada" value={device.imeiIn} />
                <Field label="IMEI salida" value={device.imeiOut} />
                <Field label="Nº Serie" value={device.serialNumber} />
                <Field label="Estado pantalla" value={device.screenCondition} />
                <Field label="Estado carcasa" value={device.caseCondition} />
              </>
            ) : (
              <Field label="ID" value={String(report.deviceId)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diagnosis + Resolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Diagnóstico y resolución</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Descripción del problema" value={report.reportedIssue} />
          <Field label="Diagnóstico" value={report.technicalDiagnosis} />
          <Field label="Reparación realizada" value={report.repairPerformed} />
          {technician ? (
            <Field label="Técnico" value={`${technician.firstName} ${technician.lastName}`} />
          ) : null}
        </CardContent>
      </Card>

      {/* Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Costes y pago</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field
            label="Presupuesto inicial"
            value={report.initialBudget != null ? `${report.initialBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}` : "—"}
          />
          <Field
            label="Presupuesto final"
            value={report.finalBudget != null ? `${report.finalBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}` : "—"}
          />
          <Field
            label="Total"
            value={report.total != null ? `${report.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}` : "—"}
          />
        </CardContent>
      </Card>

      {/* Parts */}
      {report.parts && report.parts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Repuestos utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Repuesto</th>
                  <th className="pb-2 pr-4 font-medium">Cant.</th>
                  <th className="pb-2 font-medium">Precio unit.</th>
                </tr>
              </thead>
              <tbody>
                {report.parts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4">{p.quantity}</td>
                    <td className="py-2">
                      {p.unitPrice.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {/* Internal notes */}
      {report.internalNotes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">{report.internalNotes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
