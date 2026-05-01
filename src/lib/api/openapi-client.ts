/**
 * Typed API client built on openapi-fetch.
 *
 * Types are generated from the backend's OpenAPI spec.
 * Run `pnpm api:types` to regenerate after schema changes.
 *
 * Usage example:
 *
 *   import { typedApiClient } from "@/lib/api/openapi-client";
 *
 *   // Full type-safety: params, body, and response are inferred from the schema.
 *   const { data, error } = await typedApiClient.GET("/customers", {
 *     params: { query: { page: 1, limit: 20, search: "john" } },
 *   });
 *
 *   // data is typed as the 200 response body — no manual type casting needed.
 */

import createClient, { type Middleware } from "openapi-fetch";

import { AUTH_DISABLED } from "@/lib/config";
import { useAuthStore } from "@/store/auth-store";
import { extractAuthSession } from "@/lib/api/helpers";
import type { AuthResponse } from "@/types/auth";
import type { paths } from "@/types/api-schema";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ---------------------------------------------------------------------------
// Token refresh — mirrors the logic in the axios client so both clients share
// the same Zustand session state.
// ---------------------------------------------------------------------------

let refreshingPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
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

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

const authMiddleware: Middleware = {
  /**
   * Attach the Bearer token before every request.
   */
  async onRequest({ request }) {
    if (AUTH_DISABLED) return undefined;

    const token = useAuthStore.getState().accessToken;
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },

  /**
   * On 401: silently refresh the token and update the store.
   * The caller (TanStack Query) will retry the query with the new token.
   * If refresh fails, clear the session so the auth guard redirects to login.
   */
  async onResponse({ response }) {
    if (AUTH_DISABLED || response.status !== 401) return undefined;

    try {
      if (!refreshingPromise) {
        refreshingPromise = doRefresh();
      }
      await refreshingPromise;
      refreshingPromise = null;
    } catch {
      refreshingPromise = null;

      const store = useAuthStore.getState();
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store.refreshToken ? { refreshToken: store.refreshToken } : {}),
      }).catch(() => undefined);

      store.clearSession();
    }

    // Return undefined — propagate the 401 so TanStack Query retries.
    return undefined;
  },
};

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/** Authenticated client — attaches Bearer token and handles token refresh. */
export const typedApiClient = createClient<paths>({ baseUrl: BASE_URL });

/** Unauthenticated client — for public endpoints (login, refresh, etc.). */
export const typedAuthlessClient = createClient<paths>({ baseUrl: BASE_URL });

typedApiClient.use(authMiddleware);
