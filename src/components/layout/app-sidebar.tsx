"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, LayoutDashboard, Package, ShieldUser, Smartphone, Users, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Órdenes", icon: ClipboardList },
  { href: "/customers", label: "Clientes", icon: Building2 },
  { href: "/devices", label: "Dispositivos", icon: Smartphone },
  { href: "/parts", label: "Inventario", icon: Package },
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/profile", label: "Perfil", icon: ShieldUser },
];

interface AppSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r bg-white", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">PhoneTec</p>
          <p className="text-xs text-slate-500">Gestión de taller</p>
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
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-5 py-3 text-xs text-slate-400">API · localhost:3001</div>
    </aside>
  );
}
