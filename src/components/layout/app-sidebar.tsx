"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, LayoutDashboard, Package, Receipt, Settings, ShieldUser, Smartphone, Users, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Órdenes", icon: ClipboardList },
  { href: "/customers", label: "Clientes", icon: Building2 },
  { href: "/devices", label: "Dispositivos", icon: Smartphone },
  { href: "/parts", label: "Inventario", icon: Package },
  { href: "/accounting", label: "Contabilidad", icon: Receipt },
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/profile", label: "Perfil", icon: ShieldUser },
  { href: "/settings", label: "Configuración", icon: Settings },
];

interface AppSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r bg-sidebar", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Wrench className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">PhoneTec</p>
          <p className="text-xs text-sidebar-foreground/50">Gestión de taller</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/40">API · localhost:3001</div>
    </aside>
  );
}
