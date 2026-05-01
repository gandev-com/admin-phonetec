"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, ShieldUser, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/profile", label: "Profile", icon: ShieldUser },
];

interface AppSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-72 flex-col border-r bg-white", className)}>
      <div className="border-b px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">PhoneTec</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Admin Panel</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-6 py-4 text-xs text-slate-500">NestJS API on :3001</div>
    </aside>
  );
}
