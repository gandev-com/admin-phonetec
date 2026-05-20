"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { useAuthBootstrap } from "@/features/auth/hooks/use-auth-bootstrap";
import { AUTH_DISABLED } from "@/lib/config";
import { useAuthStore } from "@/store/auth-store";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { isChecking } = useAuthBootstrap();

  useEffect(() => {
    if (!AUTH_DISABLED && hydrated && !isChecking && !accessToken) {
      router.replace("/login");
    }
  }, [hydrated, isChecking, accessToken, router]);

  if (AUTH_DISABLED) {
    return <AppShell>{children}</AppShell>;
  }

  if (!hydrated || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border bg-card px-6 py-4 text-sm text-muted-foreground">Validando sesión...</div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
