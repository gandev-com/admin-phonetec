import { z } from "zod";

import { validateImei } from "@/lib/validators/imei";

const imeiSchema = z
  .string()
  .optional()
  .refine((v) => !v || /^\d{15}$/.test(v), {
    message: "El IMEI debe tener exactamente 15 dígitos",
  })
  .refine((v) => !v || validateImei(v), {
    message: "IMEI inválido (falla verificación Luhn)",
  });

export const createDeviceSchema = z.object({
  customerId: z.string().min(1, "Selecciona un cliente válido"),
  brandId: z.string().min(1, "Selecciona una marca"),
  model: z.string().min(1, "El modelo es obligatorio").max(100),
  imeiIn: imeiSchema,
  imeiOut: imeiSchema,
  serialNumber: z.string().max(100).optional(),
  // Accesorios
  hasBackCover: z.boolean(),
  hasBattery: z.boolean(),
  hasSimCard: z.boolean(),
  hasSdCard: z.boolean(),
  hasCharger: z.boolean(),
  otherAccessories: z.string().max(300).optional(),
  // Condición visual
  screenCondition: z.string().max(200).optional(),
  caseCondition: z.string().max(200).optional(),
  dents: z.string().max(200).optional(),
  scratches: z.string().max(200).optional(),
  // Seguridad
  hasPattern: z.boolean(),
  hasPin: z.boolean(),
  hasFingerprint: z.boolean(),
  patternUnlocked: z.boolean(),
});

export type CreateDeviceFormValues = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = createDeviceSchema.partial();
export type UpdateDeviceFormValues = z.infer<typeof updateDeviceSchema>;
