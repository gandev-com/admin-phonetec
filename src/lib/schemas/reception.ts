import { z } from "zod";

export const orderSchema = z.object({
  reportType: z.enum(["REPAIR_ORDER", "BUDGET", "REVISION", "WARRANTY"] as const),
  reportedIssue: z.string().min(1, "Describe el problema"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"] as const),
  isUrgent: z.boolean(),
  estimatedDeliveryDate: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const deviceSchema = z.object({
  brandId: z.string().min(1, "Selecciona una marca"),
  model: z.string().min(1, "El modelo es obligatorio"),
  imeiIn: z.string().optional(),
});

export type DeviceFormValues = z.infer<typeof deviceSchema>;

export const ORDER_TYPE_LABELS: Record<string, string> = {
  REPAIR_ORDER: "Reparación",
  BUDGET: "Presupuesto",
  REVISION: "Revisión",
  WARRANTY: "Garantía",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};
