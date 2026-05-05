'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { StatusPill } from '@/components/shared/status-pill'
import { SkeletonRow } from '@/components/shared/skeleton-card'
import { EmptyState } from '@/components/shared/empty-state'
import { reportsApi } from '@/lib/api/reports'
import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/types/report'

type FilterTab = 'Todas' | 'Recibido' | 'Diagnóstico' | 'Reparación' | 'Esperando' | 'Listo'

const TAB_STATUSES: Record<Exclude<FilterTab, 'Todas'>, ReportStatus[]> = {
  'Recibido':    ['RECEIVED'],
  'Diagnóstico': ['IN_DIAGNOSIS', 'BUDGET_SENT', 'BUDGET_ACCEPTED'],
  'Reparación':  ['IN_REPAIR', 'REPAIRED', 'TESTING'],
  'Esperando':   ['WAITING_PARTS'],
  'Listo':       ['READY_FOR_PICKUP'],
}

const TABS: FilterTab[] = ['Todas', 'Recibido', 'Diagnóstico', 'Reparación', 'Esperando', 'Listo']

const ACTIVE_STATUSES: ReportStatus[] = [
  'RECEIVED', 'IN_DIAGNOSIS', 'BUDGET_SENT', 'BUDGET_ACCEPTED',
  'WAITING_PARTS', 'IN_REPAIR', 'REPAIRED', 'TESTING', 'READY_FOR_PICKUP',
]

export function ActiveOrdersBoard() {
  const [tab, setTab] = useState<FilterTab>('Todas')

  const { data, isPending } = useQuery({
    queryKey: ['reports', 'active-board'],
    queryFn:  () =>
      reportsApi.list({
        limit: 20,
        include: 'customer,device',
        sortBy: 'createdAt',
        order: 'desc',
        activeFirst: true,
      }),
    staleTime: 30_000,
  })

  const allOrders = (data?.data ?? []).filter((r) =>
    (ACTIVE_STATUSES as string[]).includes(r.currentStatus),
  )

  const filtered =
    tab === 'Todas'
      ? allOrders
      : allOrders.filter((r) =>
          (TAB_STATUSES[tab] as string[]).includes(r.currentStatus),
        )

  const tabCount = (t: FilterTab) =>
    t === 'Todas'
      ? allOrders.length
      : allOrders.filter((r) =>
          (TAB_STATUSES[t] as string[]).includes(r.currentStatus),
        ).length

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-surface-900">Órdenes activas</h3>
        <Link
          href="/reports"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Ver todas →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-surface-100 px-3 py-2">
        {TABS.map((t) => {
          const count = tabCount(t)
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                tab === t
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-500 hover:bg-surface-50',
              )}
            >
              {t}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-mono text-[10px]',
                    tab === t ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Order rows */}
      <div className="divide-y divide-surface-50">
        {isPending &&
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

        {!isPending && filtered.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Sin órdenes activas"
            description="No hay órdenes en este estado ahora mismo."
            actionLabel="Nueva orden"
            actionHref="/reception"
          />
        )}

        {!isPending &&
          filtered.map((orden) => {
            const cliente = orden.customer
              ? `${orden.customer.firstName} ${orden.customer.lastName}`
              : `Cliente #${orden.customerId}`
            const dispositivo = orden.device
              ? `${orden.device.brand?.name ?? ''} ${orden.device.model ?? ''}`.trim()
              : `Dispositivo #${orden.deviceId}`
            const fecha = new Date(orden.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
            })

            return (
              <Link key={orden.id} href={`/reports/${orden.id}`}>
                <div
                  className={cn(
                    'flex cursor-pointer items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-50',
                    orden.isUrgent && 'border-l-2 border-red-400 pl-[18px]',
                  )}
                >
                  {/* Order number */}
                  <span className="w-28 shrink-0 truncate font-mono text-xs text-surface-400">
                    {orden.orderNumber}
                  </span>

                  {/* Customer + device */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-900">{cliente}</p>
                    <p className="truncate text-xs text-surface-400">{dispositivo}</p>
                  </div>

                  {/* Status */}
                  <StatusPill status={orden.currentStatus} />

                  {/* Date */}
                  <span className="w-14 shrink-0 text-right text-xs text-surface-400">{fecha}</span>
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
