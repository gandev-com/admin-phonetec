import { z } from "zod";

export const customerSchema = z.object({
  documentType: z.string().min(1),
  document: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  secondLastName: z.string().nullable().optional(),
  phone1: z.string().min(1),
  phone2: z.string().nullable().optional(),
  address: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  dataConsent: z.boolean(),
});

export type CustomerSchema = z.infer<typeof customerSchema>;
