"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryModal } from "./delivery-modal";
import { reportsApi } from "@/lib/api/reports";
import type { Report } from "@/types/report";

export function DeliveryQueue() {
  const [deliveryReport, setDeliveryReport] = useState<Report | null>(null);

  const reportsQuery = useQuery({
    queryKey: ["reports", { currentStatus: "READY_FOR_PICKUP" }],
    queryFn: () =>
      reportsApi.list({
        currentStatus: "READY_FOR_PICKUP",
        sortBy: "receptionDate",
        order: "asc",
        limit: 100,
        include: "customer,device",
      }),
    refetchInterval: 30_000,
  });

  const reports = reportsQuery.data?.data ?? [];

  function handleDelivered(updated: Report) {
    setDeliveryReport(null);
    // Refresh the list
    reportsQuery.refetch();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-green-600" />
            <CardTitle>Órdenes listas para entregar</CardTitle>
            {!reportsQuery.isPending && (
              <Badge variant="outline" className="ml-auto">
                {reports.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reportsQuery.isPending && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {reportsQuery.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No fue posible cargar las órdenes.
            </div>
          )}

          {!reportsQuery.isPending && !reportsQuery.isError && reports.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No hay órdenes pendientes de entrega.
            </div>
          )}

          {!reportsQuery.isPending && reports.length > 0 && (
            <ul className="space-y-3">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {report.orderNumber}
                      </span>
                      {report.isUrgent && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
                          URGENTE
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">
                      {report.customer
                        ? `${report.customer.firstName} ${report.customer.lastName}`
                        : "—"}
                    </p>
                    {report.device && (
                      <p className="text-xs text-muted-foreground">
                        {report.device.brand?.name} {report.device.model}
                      </p>
                    )}
                    {report.receptionDate && (
                      <p className="text-xs text-muted-foreground">
                        Recibido:{" "}
                        {new Date(report.receptionDate).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setDeliveryReport(report)}
                  >
                    Entregar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {deliveryReport && (
        <DeliveryModal
          report={deliveryReport}
          onSuccess={handleDelivered}
          onClose={() => setDeliveryReport(null)}
        />
      )}
    </>
  );
}
