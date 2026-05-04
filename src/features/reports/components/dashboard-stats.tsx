"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, CreditCard, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/reports/status-badge";
import { reportsApi } from "@/lib/api/reports";
import type { ReportStatus } from "@/types/report";

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
  accentClass = "bg-muted text-muted-foreground",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
  accentClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
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
      ? `${Number(stats.pendingRevenue).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
      : "—";

  const totalRevenue =
    stats?.totalRevenue != null
      ? `${Number(stats.totalRevenue).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
      : "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Órdenes abiertas"
        value={loading ? "—" : openCount}
        sub="Recibidas, diagnóstico, reparación"
        icon={ClipboardList}
        loading={loading}
        accentClass="bg-blue-50 text-blue-600"
      />
      <StatCard
        title="Urgentes abiertas"
        value={loading ? "—" : (stats?.urgentOpen ?? 0)}
        sub="Requieren atención inmediata"
        icon={AlertTriangle}
        loading={loading}
        accentClass="bg-red-50 text-red-600"
      />
      <StatCard
        title="Ingresos cobrados"
        value={loading ? "—" : totalRevenue}
        sub="Total acumulado"
        icon={TrendingUp}
        loading={loading}
        accentClass="bg-green-50 text-green-600"
      />
      <StatCard
        title="Pendiente de cobro"
        value={loading ? "—" : pendingRevenue}
        sub="Parcial o sin pagar"
        icon={CreditCard}
        loading={loading}
        accentClass="bg-amber-50 text-amber-600"
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
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
        >
          <StatusBadge status={status} />
          <span className="text-lg font-semibold text-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}
