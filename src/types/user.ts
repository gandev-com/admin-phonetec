export type Role = "ADMIN" | "TECNICO" | "RECEPCIONISTA" | "VIEWER";

export interface User {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
}
