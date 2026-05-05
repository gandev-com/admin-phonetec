"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { OrderCard } from "./order-card";
import type { Report, ReportStatus } from "@/types/report";

interface KanbanColumnProps {
  label: string;
  reports: Report[];
  /** Status assigned when a card is dropped here. null = not a valid drop target. */
  dropStatus: ReportStatus | null;
  onDropReport?: (reportId: string, fromStatus: ReportStatus) => void;
  onDeliverClick?: (report: Report) => void;
  onUpdated?: (updated: Report) => void;
}

export function KanbanColumn({
  label,
  reports,
  dropStatus,
  onDropReport,
  onDeliverClick,
  onUpdated,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-xl transition-colors",
        isDragOver && dropStatus && "bg-primary/5 ring-2 ring-primary/30",
      )}
      onDragOver={(e) => {
        if (!dropStatus) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        // Only clear when leaving the column itself, not a child
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!dropStatus) return;
        const reportId = e.dataTransfer.getData("reportId");
        const fromStatus = e.dataTransfer.getData("reportStatus") as ReportStatus;
        if (reportId && fromStatus !== dropStatus) {
          onDropReport?.(reportId, fromStatus);
        }
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground border">
          {reports.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 min-h-[4rem] p-1">
        {reports.length === 0 && (
          <div
            className={cn(
              "rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors",
              isDragOver && dropStatus && "border-primary/50 bg-primary/5 text-primary",
            )}
          >
            {isDragOver && dropStatus ? "Soltar aquí" : "Sin órdenes"}
          </div>
        )}
        {reports.map((report) => (
          <OrderCard
            key={report.id}
            report={report}
            onDeliverClick={onDeliverClick}
            onUpdated={onUpdated}
          />
        ))}
      </div>
    </div>
  );
}
