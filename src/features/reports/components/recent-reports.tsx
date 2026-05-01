"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/reports/status-badge";
import { reportsApi } from "@/lib/api/reports";

export function RecentReports() {
  const query = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => reportsApi.list({ limit: 6, sortBy: "createdAt", order: "desc" }),
  });

  const reports = query.data?.data ?? [];

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Órdenes recientes</CardTitle>
        <Link
          href="/reports"
          className="text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          Ver todas →
        </Link>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : null}

        {!query.isPending && reports.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Sin órdenes recientes</p>
        ) : null}

        {!query.isPending && reports.length > 0 ? (
          <ul className="divide-y">
            {reports.map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reports/${report.id}`}
                      className="font-mono text-xs font-semibold text-slate-900 hover:underline"
                    >
                      {report.orderNumber}
                    </Link>
                    {report.isUrgent ? (
                      <span className="text-xs font-medium text-red-600">⚑ Urgente</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {report.customer
                      ? `${report.customer.firstName} ${report.customer.lastName}`
                      : `Cliente #${report.customerId}`}
                    {report.device
                      ? ` · ${report.device.brand?.name ?? ""} ${report.device.model ?? ""}`.trim()
                      : null}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={report.currentStatus} />
                  <span className="text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
