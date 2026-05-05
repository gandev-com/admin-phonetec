"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumn } from "./kanban-column";
import { KANBAN_COLUMNS, READY_FOR_PICKUP_VALID_FROM, TERMINAL_STATUSES, STATUS_LABEL } from "@/lib/order-status";
import { reportsApi } from "@/lib/api/reports";
import type { Report, ReportStatus } from "@/types/report";

interface OrdersKanbanProps {
  onDeliverClick?: (report: Report) => void;
}

/** First status used when a card is dropped into this column */
const COLUMN_DROP_STATUS: Record<string, ReportStatus | null> = {
  intake: "IN_DIAGNOSIS",
  budget: "BUDGET_SENT",
  repair: "IN_REPAIR",
  ready: "READY_FOR_PICKUP",
  closed: null, // dropping into closed is not allowed
};

export function OrdersKanban({ onDeliverClick }: OrdersKanbanProps) {
  const queryClient = useQueryClient();
  const [localOverrides, setLocalOverrides] = useState<Map<string | number, Report>>(new Map());

  const reportsQuery = useQuery({
    queryKey: ["reports", { kanban: true }],
    queryFn: () =>
      reportsApi.list({
        activeFirst: true,
        limit: 200,
        sortBy: "receptionDate",
        order: "desc",
        include: "customer,device",
      }),
    refetchInterval: 60_000,
  });

  const rawReports = reportsQuery.data?.data ?? [];

  // Merge server data with local optimistic overrides
  const reports: Report[] = rawReports.map((r) => localOverrides.get(r.id) ?? r);

  function applyOverride(updated: Report) {
    setLocalOverrides((prev) => new Map(prev).set(updated.id, updated));
  }

  function groupByColumn(statuses: ReportStatus[]): Report[] {
    return reports.filter((r) => statuses.includes(r.currentStatus));
  }

  // ─── Drag-and-drop mutation ────────────────────────────────────────────────

  const dragMoveMutation = useMutation({
    mutationFn: ({ reportId, targetStatus }: { reportId: string; targetStatus: ReportStatus }) => {
      if (targetStatus === "READY_FOR_PICKUP") {
        return reportsApi.readyForPickup(reportId);
      }
      return reportsApi.update(reportId, { currentStatus: targetStatus });
    },
    onMutate: ({ reportId, targetStatus }) => {
      // Optimistic update
      const existing = reports.find((r) => String(r.id) === reportId);
      if (existing) {
        applyOverride({ ...existing, currentStatus: targetStatus });
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      applyOverride(updated);
      toast.success(`Movida a "${STATUS_LABEL[updated.currentStatus]}"`);
    },
    onError: (_err, { reportId }) => {
      // Revert optimistic update
      setLocalOverrides((prev) => {
        const next = new Map(prev);
        next.delete(reportId);
        return next;
      });
      toast.error("No se pudo mover la orden");
    },
  });

  function handleDropReport(
    colKey: string,
    reportId: string,
    fromStatus: ReportStatus,
  ) {
    const targetStatus = COLUMN_DROP_STATUS[colKey];
    if (!targetStatus) return;
    if (TERMINAL_STATUSES.includes(fromStatus)) return;
    // Guard: READY_FOR_PICKUP only from valid predecessors
    if (
      targetStatus === "READY_FOR_PICKUP" &&
      !READY_FOR_PICKUP_VALID_FROM.includes(fromStatus)
    ) {
      toast.error("Este estado no puede pasar a \"Lista para recoger\" directamente");
      return;
    }
    dragMoveMutation.mutate({ reportId, targetStatus });
  }

  if (reportsQuery.isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-8 w-full rounded-lg" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (reportsQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        No fue posible cargar las órdenes.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => (
        <KanbanColumn
          key={col.key}
          label={col.label}
          reports={groupByColumn(col.statuses)}
          dropStatus={COLUMN_DROP_STATUS[col.key] ?? null}
          onDropReport={(reportId, fromStatus) =>
            handleDropReport(col.key, reportId, fromStatus)
          }
          onDeliverClick={onDeliverClick}
          onUpdated={applyOverride}
        />
      ))}
    </div>
  );
}
