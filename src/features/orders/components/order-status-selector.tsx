"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { reportsApi } from "@/lib/api/reports";
import { STATUS_LABEL, TERMINAL_STATUSES, READY_FOR_PICKUP_VALID_FROM, SELECTABLE_STATUSES } from "@/lib/order-status";
import type { Report, ReportStatus } from "@/types/report";

interface OrderStatusSelectorProps {
  report: Report;
  onUpdated?: (updated: Report) => void;
}

export function OrderStatusSelector({ report, onUpdated }: OrderStatusSelectorProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isTerminal = TERMINAL_STATUSES.includes(report.currentStatus);

  const updateMutation = useMutation({
    mutationFn: (newStatus: ReportStatus) => {
      if (newStatus === "READY_FOR_PICKUP") {
        return reportsApi.readyForPickup(report.id);
      }
      return reportsApi.update(report.id, { currentStatus: newStatus });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Estado actualizado a "${STATUS_LABEL[updated.currentStatus]}"`);
      onUpdated?.(updated);
      setOpen(false);
    },
    onError: () => {
      toast.error("No se pudo actualizar el estado");
    },
  });

  if (isTerminal) return null;

  const availableStatuses = SELECTABLE_STATUSES.filter((s) => {
    if (s === report.currentStatus) return false;
    // READY_FOR_PICKUP only from valid predecessor states
    if (s === "READY_FOR_PICKUP" && !READY_FOR_PICKUP_VALID_FROM.includes(report.currentStatus)) return false;
    return true;
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={updateMutation.isPending}
        className={cn(
          "rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors",
          updateMutation.isPending && "opacity-50 cursor-not-allowed",
        )}
      >
        {updateMutation.isPending ? "Guardando…" : "Cambiar estado"}
      </button>

      {open && (
        <ul className="absolute left-0 z-30 mt-1 w-52 rounded-xl border bg-background shadow-lg py-1">
          {availableStatuses.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => updateMutation.mutate(s)}
                className="w-full px-3 py-2 text-left text-xs hover:bg-muted/60 transition-colors"
              >
                {STATUS_LABEL[s]}
                {s === "READY_FOR_PICKUP" && (
                  <span className="ml-1 text-green-600 font-medium">✓ notificar</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
