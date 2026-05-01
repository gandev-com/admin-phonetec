"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { AUTH_DISABLED } from "@/lib/config";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (AUTH_DISABLED) {
      router.replace("/dashboard");
      return;
    }

    if (hydrated && accessToken) {
      router.replace("/dashboard");
    }
  }, [hydrated, accessToken, router]);

  if (AUTH_DISABLED) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(51,65,85,0.12),_transparent_40%)]" />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
