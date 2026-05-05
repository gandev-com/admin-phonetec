"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_COLOR, TERMINAL_STATUSES } from "@/lib/order-status";
import { OrderStatusSelector } from "./order-status-selector";
import type { Report } from "@/types/report";

interface OrderCardProps {
  report: Report;
  onDeliverClick?: (report: Report) => void;
  onUpdated?: (updated: Report) => void;
}

export function OrderCard({ report, onDeliverClick, onUpdated }: OrderCardProps) {
  const [localReport, setLocalReport] = useState<Report>(report);
  const isTerminal = TERMINAL_STATUSES.includes(localReport.currentStatus);

  function handleUpdated(updated: Report) {
    setLocalReport(updated);
    onUpdated?.(updated);
  }

  return (
    <div
      draggable={!isTerminal}
      onDragStart={(e) => {
        e.dataTransfer.setData("reportId", String(localReport.id));
        e.dataTransfer.setData("reportStatus", localReport.currentStatus);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-xl border bg-card p-3 shadow-sm space-y-2 transition-opacity",
        !isTerminal && "cursor-grab active:cursor-grabbing",
        localReport.isUrgent && "border-orange-300",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono font-medium text-muted-foreground">
            {localReport.orderNumber}
          </p>
          <p className="truncate text-sm font-medium text-foreground">
            {localReport.customer
              ? `${localReport.customer.firstName} ${localReport.customer.lastName}`
              : "—"}
          </p>
        </div>
        {localReport.isUrgent && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
            <AlertCircle className="h-3 w-3" /> URGENTE
          </span>
        )}
      </div>

      {/* Device */}
      {localReport.device && (
        <p className="text-xs text-muted-foreground truncate">
          {localReport.device.brand?.name} {localReport.device.model}
        </p>
      )}

      {/* Status badge */}
      <span
        className={cn(
          "inline-block rounded-md px-2 py-0.5 text-[11px] font-medium",
          STATUS_COLOR[localReport.currentStatus],
        )}
      >
        {STATUS_LABEL[localReport.currentStatus]}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/reports/${localReport.id}`}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Ver detalle
        </Link>

        {!isTerminal && (
          <div className="ml-auto flex items-center gap-2">
            {localReport.currentStatus === "READY_FOR_PICKUP" && onDeliverClick && (
              <button
                type="button"
                onClick={() => onDeliverClick(localReport)}
                className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
              >
                Entregar
              </button>
            )}
            <OrderStatusSelector report={localReport} onUpdated={handleUpdated} />
          </div>
        )}
      </div>
    </div>
  );
}
