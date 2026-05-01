"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";

export function useAuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: hydrated && !!accessToken,
    retry: 0,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError && accessToken) {
      clearSession();
    }
  }, [meQuery.isError, accessToken, clearSession]);

  const isChecking = !hydrated || (Boolean(accessToken) && meQuery.isPending && !user);

  return {
    isChecking,
    meQuery,
  };
}
