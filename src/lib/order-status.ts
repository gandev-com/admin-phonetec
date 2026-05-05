import type { ReportStatus } from "@/types/report";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  RECEIVED: "Recibida",
  IN_DIAGNOSIS: "En diagnóstico",
  BUDGET_SENT: "Presupuesto enviado",
  BUDGET_ACCEPTED: "Presupuesto aceptado",
  BUDGET_REJECTED: "Presupuesto rechazado",
  WAITING_PARTS: "Esperando piezas",
  IN_REPAIR: "En reparación",
  REPAIRED: "Reparada",
  TESTING: "En pruebas",
  READY_FOR_PICKUP: "Lista para recoger",
  DELIVERED: "Entregada",
  CANCELLED: "Cancelada",
  IRREPARABLE: "Irreparable",
};

export const STATUS_COLOR: Record<ReportStatus, string> = {
  RECEIVED: "bg-muted text-muted-foreground",
  IN_DIAGNOSIS: "bg-yellow-100 text-yellow-800",
  BUDGET_SENT: "bg-blue-100 text-blue-800",
  BUDGET_ACCEPTED: "bg-teal-100 text-teal-800",
  BUDGET_REJECTED: "bg-red-100 text-red-700",
  WAITING_PARTS: "bg-orange-100 text-orange-800",
  IN_REPAIR: "bg-purple-100 text-purple-800",
  REPAIRED: "bg-indigo-100 text-indigo-800",
  TESTING: "bg-cyan-100 text-cyan-800",
  READY_FOR_PICKUP: "bg-green-100 text-green-800 font-semibold",
  DELIVERED: "bg-green-200 text-green-900",
  CANCELLED: "bg-red-200 text-red-900",
  IRREPARABLE: "bg-zinc-100 text-zinc-600",
};

/** States from which no further transitions are allowed in the UI */
export const TERMINAL_STATUSES: ReportStatus[] = ["DELIVERED", "CANCELLED", "IRREPARABLE"];

/** States from which READY_FOR_PICKUP is reachable (uses dedicated endpoint) */
export const READY_FOR_PICKUP_VALID_FROM: ReportStatus[] = [
  "BUDGET_ACCEPTED",
  "IN_REPAIR",
  "REPAIRED",
  "TESTING",
];

/** All non-terminal statuses the user can select in the generic status selector */
export const SELECTABLE_STATUSES: ReportStatus[] = [
  "RECEIVED",
  "IN_DIAGNOSIS",
  "BUDGET_SENT",
  "BUDGET_ACCEPTED",
  "BUDGET_REJECTED",
  "WAITING_PARTS",
  "IN_REPAIR",
  "REPAIRED",
  "TESTING",
  "READY_FOR_PICKUP",
  "CANCELLED",
  "IRREPARABLE",
];

export const KANBAN_COLUMNS: {
  key: string;
  label: string;
  statuses: ReportStatus[];
}[] = [
  { key: "intake", label: "Entrada", statuses: ["RECEIVED", "IN_DIAGNOSIS"] },
  {
    key: "budget",
    label: "Presupuesto",
    statuses: ["BUDGET_SENT", "BUDGET_ACCEPTED", "BUDGET_REJECTED", "WAITING_PARTS"],
  },
  { key: "repair", label: "Taller", statuses: ["IN_REPAIR", "REPAIRED", "TESTING"] },
  { key: "ready", label: "Listo", statuses: ["READY_FOR_PICKUP"] },
  { key: "closed", label: "Cerrado", statuses: ["DELIVERED", "CANCELLED", "IRREPARABLE"] },
];
