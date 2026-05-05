"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ClipboardList, Columns3, LayoutDashboard,
  Package, PackageCheck, Receipt, Settings, ShieldUser,
  Smartphone, Users, Wrench, ChevronLeft, Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/reception",    icon: Wrench,          label: "Recepción" },
  { href: "/orders",       icon: Columns3,        label: "Tablero Kanban" },
  { href: "/reports",      icon: ClipboardList,   label: "Órdenes" },
  { href: "/delivery",     icon: PackageCheck,    label: "Entregas" },
  { href: "/customers",    icon: Building2,       label: "Clientes" },
  { href: "/devices",      icon: Smartphone,      label: "Dispositivos" },
  { href: "/parts",        icon: Package,         label: "Inventario" },
  { href: "/accounting",   icon: Receipt,         label: "Contabilidad" },
  { href: "/users",        icon: Users,           label: "Usuarios" },
  { href: "/profile",      icon: ShieldUser,      label: "Perfil" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function AppSidebar({ collapsed, onToggle, className }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-surface-900 text-white shrink-0 transition-all duration-200",
        collapsed ? "w-14" : "w-56",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-12 items-center border-b border-white/10 px-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
              PhoneTec
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="ml-auto rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Quick action — Nueva orden */}
      <div className="p-2">
        <Link
          href="/reception"
          className={cn(
            "flex items-center gap-2 rounded-lg bg-brand-600 px-2.5 py-2",
            "text-sm font-medium text-white transition-colors hover:bg-brand-500",
            collapsed && "justify-center",
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Nueva orden</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navigation.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white",
                  collapsed && "justify-center",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        <Link href="/settings">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
              "text-white/50 transition-colors hover:bg-white/10 hover:text-white",
              collapsed && "justify-center",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Ajustes</span>}
          </div>
        </Link>
      </div>
    </aside>
  );
}

