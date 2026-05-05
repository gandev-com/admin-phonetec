'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/types/report'

const OPEN_STATUSES: ReportStatus[] = [
  'RECEIVED', 'IN_DIAGNOSIS', 'BUDGET_SENT', 'BUDGET_ACCEPTED',
  'WAITING_PARTS', 'IN_REPAIR', 'TESTING', 'READY_FOR_PICKUP',
]

interface KPI {
  label:   string
  getValue: (stats: Awaited<ReturnType<typeof reportsApi.getStats>>) => string | number
  sub:     string
  color:   string
  href:    string
  urgent?: boolean
}

const kpis: KPI[] = [
  {
    label:    'Órdenes abiertas',
    getValue: (s) => OPEN_STATUSES.reduce((acc, status) => acc + (s.byStatus[status] ?? 0), 0),
    sub:      'Recibidas · diagnóstico · reparación',
    color:    'text-surface-900',
    href:     '/reports',
  },
  {
    label:    'Listas para entregar',
    getValue: (s) => s.byStatus['READY_FOR_PICKUP'] ?? 0,
    sub:      'Pendientes de recogida',
    color:    'text-green-700',
    href:     '/reports?currentStatus=READY_FOR_PICKUP',
  },
  {
    label:    'Urgentes abiertas',
    getValue: (s) => s.urgentOpen,
    sub:      'Requieren atención inmediata',
    color:    'text-red-600',
    href:     '/reports?isUrgent=true',
    urgent:   true,
  },
  {
    label:    'Ingresos pendientes',
    getValue: (s) =>
      s.pendingRevenue != null
        ? Number(s.pendingRevenue).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
        : '—',
    sub:      'Por cobrar en órdenes activas',
    color:    'text-brand-700',
    href:     '/accounting',
  },
]

export function KPIStrip() {
  const { data: stats, isPending } = useQuery({
    queryKey: ['reports', 'stats'],
    queryFn:  reportsApi.getStats,
    staleTime: 60_000,
  })

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const value = stats ? kpi.getValue(stats) : '—'
        return (
          <Link key={kpi.label} href={kpi.href}>
            <div
              className={cn(
                'cursor-pointer rounded-xl border bg-white p-4 transition-all group',
                kpi.urgent
                  ? 'border-red-200 hover:border-red-300 hover:shadow-md hover:shadow-red-50'
                  : 'border-surface-200 hover:border-surface-300 hover:shadow-md',
              )}
            >
              <p className="mb-1.5 text-xs font-medium text-surface-400">{kpi.label}</p>
              {isPending ? (
                <div className="mb-1 h-8 w-16 animate-pulse rounded bg-surface-100" />
              ) : (
                <p className={cn('font-mono text-3xl font-bold tracking-tight', kpi.color)}>
                  {value}
                </p>
              )}
              <p className="mt-1.5 text-xs leading-tight text-surface-400">{kpi.sub}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
