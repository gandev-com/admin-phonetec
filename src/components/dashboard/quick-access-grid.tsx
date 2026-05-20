'use client'

import Link from 'next/link'
import {
  ClipboardList,
  Columns3,
  Package,
  PackageCheck,
  Receipt,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ACTIONS = [
  {
    href:  '/reception',
    icon:  ClipboardList,
    label: 'Nueva orden',
    color: 'text-brand-600 bg-brand-50',
  },
  {
    href:  '/delivery',
    icon:  PackageCheck,
    label: 'Entregas',
    color: 'text-green-600 bg-green-50',
  },
  {
    href:  '/orders',
    icon:  Columns3,
    label: 'Kanban',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    href:  '/devices/new',
    icon:  Smartphone,
    label: 'Nuevo dispositivo',
    color: 'text-sky-600 bg-sky-50',
  },
  {
    href:  '/accounting',
    icon:  Receipt,
    label: 'Contabilidad',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    href:  '/parts',
    icon:  Package,
    label: 'Inventario',
    color: 'text-orange-600 bg-orange-50',
  },
]

export function QuickAccessGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {ACTIONS.map(({ href, icon: Icon, label, color }) => {
        const [colorText, colorBg] = color.split(' ')
        return (
          <Link key={href} href={href}>
            <div className="group flex flex-col items-center gap-2 rounded-xl border border-surface-100 bg-white px-3 py-3.5 text-center transition-all hover:border-surface-200 hover:shadow-sm">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                  colorBg,
                )}
              >
                <Icon className={cn('h-4 w-4', colorText)} />
              </div>
              <span className="text-xs font-medium leading-tight text-surface-700">
                {label}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
