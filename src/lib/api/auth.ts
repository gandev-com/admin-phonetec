import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import { extractAuthSession } from "@/lib/api/helpers";
import type { AuthResponse, LoginDto } from "@/types/auth";
import type { User } from "@/types/user";

export const authApi = {
  async login(payload: LoginDto) {
    const response = await authlessClient.post<AuthResponse>("/auth/login", payload);
    return extractAuthSession(response.data);
  },

  async register(payload: Record<string, unknown>) {
    const response = await authlessClient.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  async me() {
    if (AUTH_DISABLED) {
      return {
        id: "dev",
        firstName: "Modo",
        lastName: "Pruebas",
        email: "dev@localhost",
        role: "ADMIN",
        isActive: true,
      } as User;
    }

    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  async logout(refreshToken?: string | null) {
    await authlessClient.post("/auth/logout", refreshToken ? { refreshToken } : {});
  },
};
