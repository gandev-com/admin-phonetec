import type { AuthResponse, AuthSession } from "@/types/auth";
import type { MaybeList } from "@/types/api";

export function normalizeListResponse<T>(payload: MaybeList<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

export function extractAuthSession(payload: AuthResponse): AuthSession {
  const container = payload.data ?? payload;
  const accessToken = container.accessToken ?? payload.accessToken;
  const refreshToken = container.refreshToken ?? payload.refreshToken;
  const user = container.user ?? payload.user;

  if (!accessToken || !user) {
    throw new Error("Respuesta de autenticacion incompleta.");
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}
