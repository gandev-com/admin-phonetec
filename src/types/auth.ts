import type { User } from "@/types/user";

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  };
}
