/**
 * Shared token refresh logic used by both the axios client (client.ts)
 * and the openapi-fetch client (openapi-client.ts).
 *
 * `doTokenRefresh` is concurrency-safe: multiple simultaneous callers
 * all receive the same in-flight promise, so the backend is hit exactly once.
 */

import { useAuthStore } from "@/store/auth-store";
import { extractAuthSession } from "@/lib/api/helpers";
import type { AuthResponse } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

let _refreshingPromise: Promise<string> | null = null;

async function _performRefresh(): Promise<string> {
  const store = useAuthStore.getState();
  const body = store.refreshToken ? { refreshToken: store.refreshToken } : {};

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Token refresh failed");

  const payload: AuthResponse = await res.json();
  const session = extractAuthSession(payload);
  store.setSession(session);
  return session.accessToken;
}

/**
 * Concurrency-safe token refresh.
 * Subsequent calls while a refresh is in-flight share the same promise.
 */
export async function doTokenRefresh(): Promise<string> {
  if (!_refreshingPromise) {
    _refreshingPromise = _performRefresh().finally(() => {
      _refreshingPromise = null;
    });
  }
  return _refreshingPromise;
}

export async function handleRefreshFailure(): Promise<void> {
  _refreshingPromise = null;
  const store = useAuthStore.getState();
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(store.refreshToken ? { refreshToken: store.refreshToken } : {}),
  }).catch(() => undefined);
  store.clearSession();
}
