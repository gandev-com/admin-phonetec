"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportsApi } from "@/lib/api/reports";
import type { PaymentStatus } from "@/types/report";

const PAGE_SIZE = 20;

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
  REPAIR_ORDER: "Reparación",
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
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function InvoicesTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["invoices", { search, paymentFilter, dateFrom, dateTo, page }],
    queryFn: () =>
      reportsApi.list({
        search: search || undefined,
        paymentStatus: paymentFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: "receptionDate",
        order: "desc",
        include: "customer",
        page,
        limit: PAGE_SIZE,
      }),
  });

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const totalPages = query.data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Facturas
          {total > 0 && (
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {total}
            </span>
          )}
        </CardTitle>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nº orden, cliente…"
            className="h-8 w-44"
          />
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value as PaymentStatus | ""); setPage(1); }}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
          >
            <option value="">Todos los pagos</option>
            {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
            title="Desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
            title="Hasta"
          />
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {query.isPending ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : query.isError ? (
          <p className="px-6 pb-6 text-sm text-destructive">No fue posible cargar las facturas.</p>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No hay facturas que coincidan con los filtros.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Nº Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Mano de obra</TableHead>
                  <TableHead className="text-right">Piezas</TableHead>
                  <TableHead className="text-right">Descuento</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const customerName = r.customer
                    ? `${r.customer.firstName} ${r.customer.lastName}`
                    : `ID ${r.customerId}`;

                  return (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-medium text-foreground">
                        {r.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{customerName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(r.receptionDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {TYPE_LABELS[r.reportType] ?? r.reportType}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(r.laborCost)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(r.partsCost)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {r.discount ? `- ${fmt(r.discount)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-foreground">
                        {fmt(r.total ?? r.finalBudget)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${PAYMENT_CLASSES[r.paymentStatus]}`}
                        >
                          {PAYMENT_LABELS[r.paymentStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/accounting/${r.id}`}>
                          <Button variant="ghost" size="icon-sm" title="Ver factura">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
