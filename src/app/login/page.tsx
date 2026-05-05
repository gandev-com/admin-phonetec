"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

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

  if (AUTH_DISABLED) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Left panel – branding ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-10 py-12 lg:flex lg:w-[46%]">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.20),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(96,165,250,0.12),_transparent_50%)]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">PhoneTec</span>
        </div>

        {/* Center copy */}
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-sidebar-foreground">
            Gestión de taller<br />en un solo lugar
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-sidebar-foreground/60">
            Controla órdenes de reparación, clientes, inventario y equipo desde un panel centralizado diseñado para talleres de telefonía.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 pt-2">
            {[
              { label: "Órdenes", value: "∞" },
              { label: "Clientes", value: "∞" },
              { label: "Técnicos", value: "∞" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-sidebar-foreground/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-sidebar-foreground/30">
          © {new Date().getFullYear()} PhoneTec · Panel de administración
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground">PhoneTec</span>
        </div>

        <div className="w-full max-w-[400px]">
          <LoginForm />
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} PhoneTec · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
