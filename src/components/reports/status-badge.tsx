import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/types/report";

export const STATUS_LABELS: Record<ReportStatus, string> = {
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

const STATUS_CLASSES: Record<ReportStatus, string> = {
  RECEIVED: "bg-muted text-muted-foreground border-border",
  IN_DIAGNOSIS: "bg-blue-100 text-blue-800 border-blue-200",
  BUDGET_SENT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  BUDGET_ACCEPTED: "bg-teal-100 text-teal-800 border-teal-200",
  BUDGET_REJECTED: "bg-red-100 text-red-700 border-red-200",
  WAITING_PARTS: "bg-amber-100 text-amber-800 border-amber-200",
  IN_REPAIR: "bg-indigo-100 text-indigo-800 border-indigo-200",
  REPAIRED: "bg-violet-100 text-violet-800 border-violet-200",
  TESTING: "bg-purple-100 text-purple-800 border-purple-200",
  READY_FOR_PICKUP: "bg-green-100 text-green-800 border-green-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  IRREPARABLE: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", STATUS_CLASSES[status], className)}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
