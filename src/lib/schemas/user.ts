import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email("Ingresa un email valido"),
  role: z.enum(["ADMIN", "TECNICO", "RECEPCIONISTA", "VIEWER"]),
  isActive: z.boolean(),
});

export type UserSchema = z.infer<typeof userSchema>;
