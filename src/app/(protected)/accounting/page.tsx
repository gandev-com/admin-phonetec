"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingStats } from "@/features/accounting/components/accounting-stats";
import { InvoicesTable } from "@/features/accounting/components/invoices-table";
import { reportsApi } from "@/lib/api/reports";
import type { PaymentStatus } from "@/types/report";

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-400",
  PARTIAL: "bg-orange-400",
  PAID: "bg-emerald-500",
  REFUNDED: "bg-blue-400",
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function PaymentBreakdown() {
  const { data: stats, isPending } = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: reportsApi.getStats,
  });

  const entries = (Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((key) => ({
    key,
    label: PAYMENT_LABELS[key],
    count: stats?.byPaymentStatus?.[key] ?? 0,
  }));

  const totalCount = entries.reduce((a, e) => a + e.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Estado de pagos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
        ) : (
          entries.map(({ key, label, count }) => {
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{count} <span className="text-xs text-muted-foreground">({pct}%)</span></span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${PAYMENT_COLORS[key as PaymentStatus]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function RevenueSummary() {
  const { data: stats, isPending } = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: reportsApi.getStats,
  });

  const rows = [
    { label: "Ingresos cobrados", value: stats ? fmt(stats.totalRevenue) : "—", highlight: true },
    { label: "Por cobrar", value: stats ? fmt(stats.pendingRevenue) : "—", highlight: false },
    {
      label: "Balance neto",
      value: stats?.totalRevenue != null && stats?.pendingRevenue != null
        ? fmt(Number(stats.totalRevenue) - Number(stats.pendingRevenue))
        : "—",
      highlight: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Resumen financiero</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {isPending
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={r.highlight ? "font-bold text-primary" : "font-medium text-foreground"}>
                  {r.value}
                </span>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

export default function AccountingPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Facturación y Contabilidad</h1>
        <p className="text-sm text-muted-foreground">
          Resumen financiero y listado de facturas generadas a partir de las órdenes de reparación.
        </p>
      </div>

      <AccountingStats />

      <Tabs defaultValue="facturas">
        <TabsList>
          <TabsTrigger value="facturas">
            <FileText className="size-3.5" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="resumen">
            <BarChart3 className="size-3.5" />
            Resumen contable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facturas" className="mt-4">
          <InvoicesTable />
        </TabsContent>

        <TabsContent value="resumen" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <RevenueSummary />
            <PaymentBreakdown />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
