"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, CreditCard, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";
import type { ReportStatus } from "@/types/report";

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

const OPEN_STATUSES: ReportStatus[] = [
  "RECEIVED",
  "IN_DIAGNOSIS",
  "BUDGET_SENT",
  "BUDGET_ACCEPTED",
  "WAITING_PARTS",
  "IN_REPAIR",
  "TESTING",
  "READY_FOR_PICKUP",
];

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const statsQuery = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: reportsApi.getStats,
  });

  const stats = statsQuery.data;
  const loading = statsQuery.isPending;

  const openCount = stats
    ? OPEN_STATUSES.reduce((acc, s) => acc + (stats.byStatus[s] ?? 0), 0)
    : 0;

  const pendingRevenue =
    stats?.pendingRevenue != null
      ? `${stats.pendingRevenue.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
      : "—";

  const totalRevenue =
    stats?.totalRevenue != null
      ? `${stats.totalRevenue.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
      : "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Órdenes abiertas"
        value={loading ? "—" : openCount}
        sub="Recibidas, diagnóstico, reparación"
        icon={ClipboardList}
        loading={loading}
      />
      <StatCard
        title="Urgentes abiertas"
        value={loading ? "—" : (stats?.urgentOpen ?? 0)}
        sub="Requieren atención inmediata"
        icon={AlertTriangle}
        loading={loading}
      />
      <StatCard
        title="Ingresos cobrados"
        value={loading ? "—" : totalRevenue}
        sub="Total acumulado"
        icon={TrendingUp}
        loading={loading}
      />
      <StatCard
        title="Pendiente de cobro"
        value={loading ? "—" : pendingRevenue}
        sub="Parcial o sin pagar"
        icon={CreditCard}
        loading={loading}
      />
    </div>
  );
}

export function DashboardStatusBreakdown() {
  const statsQuery = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: reportsApi.getStats,
    staleTime: 30_000,
  });

  const stats = statsQuery.data;

  if (statsQuery.isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const entries = Object.entries(stats.byStatus) as [ReportStatus, number][];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([status, count]) => (
        <div
          key={status}
          className="rounded-xl border bg-white px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm text-slate-600">{STATUS_LABELS[status] ?? status}</span>
          <span className="text-lg font-semibold text-slate-900">{count}</span>
        </div>
      ))}
    </div>
  );
}
