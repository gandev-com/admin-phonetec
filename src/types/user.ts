export type Role = "ADMIN" | "TECNICO" | "RECEPCIONISTA" | "VIEWER";

export interface User {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserListParams {
  search?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
