import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

import { AUTH_DISABLED } from "@/lib/config";
import { useAuthStore } from "@/store/auth-store";
import { extractAuthSession } from "@/lib/api/helpers";
import type { AuthResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const authlessClient = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

let refreshingPromise: Promise<string> | null = null;

function attachAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (AUTH_DISABLED) {
    return config;
  }

  const token = useAuthStore.getState().accessToken;

  if (!token) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;

  return config;
}

async function refreshTokenRequest(): Promise<string> {
  const store = useAuthStore.getState();
  const refreshPayload = store.refreshToken ? { refreshToken: store.refreshToken } : {};
  const response = await authlessClient.post<AuthResponse>("/auth/refresh", refreshPayload);
  const session = extractAuthSession(response.data);

  store.setSession(session);
  return session.accessToken;
}

apiClient.interceptors.request.use(attachAuthHeader);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (AUTH_DISABLED) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshingPromise) {
        refreshingPromise = refreshTokenRequest();
      }

      const newAccessToken = await refreshingPromise;
      refreshingPromise = null;

      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch (refreshError) {
      const refreshToken = useAuthStore.getState().refreshToken;
      await authlessClient
        .post("/auth/logout", refreshToken ? { refreshToken } : {})
        .catch(() => undefined);
      refreshingPromise = null;
      useAuthStore.getState().clearSession();
      return Promise.reject(refreshError);
    }
  },
);

export { API_URL, apiClient, authlessClient };
