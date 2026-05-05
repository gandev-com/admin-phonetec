"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut, Search, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { authApi } from "@/lib/api/auth";
import { reportsApi } from "@/lib/api/reports";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface AppHeaderProps {
  onOpenCmd: () => void;
}

export function AppHeader({ onOpenCmd }: AppHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const statsQuery = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: reportsApi.getStats,
    staleTime: 60_000,
  });

  const urgentCount = statsQuery.data?.urgentOpen ?? 0;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authApi.logout(refreshToken);
    },
    onSettled: () => {
      clearSession();
      router.replace("/login");
      toast.success("Sesion cerrada");
    },
  });

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Usuario";
  const initials = initialsFromName(fullName) || "U";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-surface-200 bg-white px-4">
      {/* Command palette trigger / search */}
      <button
        onClick={onOpenCmd}
        aria-label="Abrir búsqueda (⌘K)"
        className="flex max-w-xs flex-1 items-center gap-2 rounded-lg bg-surface-100 px-3 py-1.5
                   text-left text-sm text-surface-400 transition-colors hover:bg-surface-200"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span>Buscar orden, cliente...</span>
        <kbd className="ml-auto rounded border border-surface-200 bg-white px-1.5 py-0.5 font-mono text-xs text-surface-400">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      {/* Urgent indicator */}
      {urgentCount > 0 && (
        <button
          onClick={() => router.push("/reports?isUrgent=true")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1",
            "text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 animate-pulse",
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
        </button>
      )}

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              aria-label="Menú de usuario"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white transition-opacity hover:opacity-80"
            >
              {initials}
            </button>
          }
        />

        <DropdownMenuContent align="end" className="w-48">
          <div className="px-3 py-2 text-xs text-surface-500">
            {fullName}
          </div>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

