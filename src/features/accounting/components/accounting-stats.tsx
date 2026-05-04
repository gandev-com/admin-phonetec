"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeDollarSign, CircleDollarSign, Clock, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";

function fmt(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
  accent: string;
}

function StatCard({ title, value, sub, icon: Icon, loading, accent }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="mt-1 h-3 w-20" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AccountingStats() {
  const { data: stats, isPending } = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: reportsApi.getStats,
  });

  const paid = stats?.byPaymentStatus?.PAID ?? 0;
  const partial = stats?.byPaymentStatus?.PARTIAL ?? 0;
  const pending = (stats?.byPaymentStatus?.PENDING ?? 0) + partial;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Ingresos totales"
        value={stats?.totalRevenue != null ? fmt(Number(stats.totalRevenue)) : "—"}
        sub="Órdenes cobradas"
        icon={TrendingUp}
        loading={isPending}
        accent="bg-primary/15 text-primary"
      />
      <StatCard
        title="Por cobrar"
        value={stats?.pendingRevenue != null ? fmt(Number(stats.pendingRevenue)) : "—"}
        sub={`${pending} orden${pending !== 1 ? "es" : ""} pendiente${pending !== 1 ? "s" : ""}`}
        icon={Clock}
        loading={isPending}
        accent="bg-amber-100 text-amber-700"
      />
      <StatCard
        title="Facturas pagadas"
        value={isPending ? "—" : String(paid)}
        sub="Estado: PAID"
        icon={CircleDollarSign}
        loading={isPending}
        accent="bg-emerald-100 text-emerald-700"
      />
      <StatCard
        title="Pago parcial"
        value={isPending ? "—" : String(partial)}
        sub="Requieren seguimiento"
        icon={BadgeDollarSign}
        loading={isPending}
        accent="bg-orange-100 text-orange-700"
      />
    </div>
  );
}
