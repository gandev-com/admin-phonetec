'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Columns3, Package, PackageCheck, Plus, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const actions = [
  {
    href:  '/reception',
    label: 'Nueva orden',
    icon:  ClipboardList,
    color: 'bg-brand-600 hover:bg-brand-700',
  },
  {
    href:  '/delivery',
    label: 'Entregas',
    icon:  PackageCheck,
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    href:  '/orders',
    label: 'Kanban',
    icon:  Columns3,
    color: 'bg-violet-600 hover:bg-violet-700',
  },
  {
    href:  '/customers',
    label: 'Clientes',
    icon:  Users,
    color: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    href:  '/parts',
    label: 'Inventario',
    icon:  Package,
    color: 'bg-amber-600 hover:bg-amber-700',
  },
]

export function QuickActions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {/* Sub-actions */}
      <div
        className={cn(
          'flex flex-col items-end gap-2 transition-all duration-200',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        )}
      >
        {actions.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-surface-900 shadow-md">
                {label}
              </span>
              <button
                aria-label={label}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all',
                  color,
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full bg-surface-900 text-white',
          'shadow-xl transition-all duration-200 hover:bg-surface-800',
          open && 'rotate-45',
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  )
}
