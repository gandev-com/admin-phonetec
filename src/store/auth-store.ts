"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthSession } from "@/types/auth";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setSession: (session: AuthSession) => void;
  updateAccessToken: (accessToken: string, refreshToken?: string) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken: refreshToken ?? null }),
      updateAccessToken: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "phonetec-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
