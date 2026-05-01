import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresa un email valido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
