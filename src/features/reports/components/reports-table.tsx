"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportsApi } from "@/lib/api/reports";
import type { PaymentStatus, ReportStatus } from "@/types/report";

const PAGE_SIZE = 20;

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

const REPORT_TYPE_LABELS: Record<string, string> = {
  REPAIR_ORDER: "Reparación",
  BUDGET: "Presupuesto",
  REVISION: "Revisión",
  WARRANTY: "Garantía",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as ReportStatus[];

export function ReportsTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const reportsQuery = useQuery({
    queryKey: ["reports", { search, status: statusFilter, page }],
    queryFn: () =>
      reportsApi.list({
        search: search || undefined,
        currentStatus: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const reports = reportsQuery.data?.data ?? [];
  const total = reportsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Órdenes de reparación</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ReportStatus | ""); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nº orden, cliente..."
            className="sm:max-w-xs"
          />
        </div>
      </CardHeader>

      <CardContent>
        {reportsQuery.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : null}

        {reportsQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar las órdenes.
          </div>
        ) : null}

        {!reportsQuery.isPending && !reportsQuery.isError && reports.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            No hay órdenes para mostrar.
          </div>
        ) : null}

        {!reportsQuery.isPending && !reportsQuery.isError && reports.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {report.isUrgent ? (
                          <span className="mr-1 text-red-500">⚑</span>
                        ) : null}
                        {report.orderNumber}
                      </TableCell>
                      <TableCell>
                        {report.customer
                          ? `${report.customer.firstName} ${report.customer.lastName}`
                          : report.customerId}
                      </TableCell>
                      <TableCell>
                        {report.device
                          ? `${report.device.brand?.name ?? ""} ${report.device.model ?? ""}`.trim() || `#${report.deviceId}`
                          : `#${report.deviceId}`}
                      </TableCell>
                      <TableCell className="text-xs">{REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[report.currentStatus] ?? "outline"}>
                          {STATUS_LABELS[report.currentStatus] ?? report.currentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {PAYMENT_LABELS[report.paymentStatus] ?? report.paymentStatus}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/reports/${report.id}`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Ver
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {total} orden{total !== 1 ? "es" : ""} &mdash; página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
