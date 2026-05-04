"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, STATUS_LABELS } from "@/components/reports/status-badge";
import { reportsApi } from "@/lib/api/reports";
import type { PaymentStatus, ReportStatus } from "@/types/report";

const PAGE_SIZE = 20;

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
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const reportsQuery = useQuery({
    queryKey: ["reports", { search, status: statusFilter, urgentOnly, page }],
    queryFn: () =>
      reportsApi.list({
        search: search || undefined,
        currentStatus: statusFilter || undefined,
        isUrgent: urgentOnly || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy: "receptionDate",
        order: "desc",
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
          <Button
            variant={urgentOnly ? "default" : "outline"}
            size="sm"
            onClick={() => { setUrgentOnly((v) => !v); setPage(1); }}
          >
            ⚑ Urgentes
          </Button>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nº orden, cliente..."
            className="sm:max-w-xs"
          />
          <Link
            href="/reports/nuevo"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            Nueva orden
          </Link>
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
                  <TableRow className="bg-slate-50/50">
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
                        <StatusBadge status={report.currentStatus} />
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
