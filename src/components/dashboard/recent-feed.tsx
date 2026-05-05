'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { StatusPill } from '@/components/shared/status-pill'
import { EmptyState } from '@/components/shared/empty-state'
import { reportsApi } from '@/lib/api/reports'

export function RecentFeed() {
  const { data, isPending } = useQuery({
    queryKey: ['reports', 'recent'],
    queryFn:  () =>
      reportsApi.list({ limit: 8, sortBy: 'createdAt', order: 'desc', include: 'customer,device' }),
    staleTime: 30_000,
  })

  const reports = data?.data ?? []

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-surface-900">Actividad reciente</h3>
        <Link href="/reports" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          Ver todas →
        </Link>
      </div>

      <div className="divide-y divide-surface-50">
        {isPending &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-start gap-3 px-4 py-3">
              <div className="mt-0.5 h-4 w-4 rounded bg-surface-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-surface-100" />
                <div className="h-2.5 w-32 rounded bg-surface-100" />
              </div>
              <div className="h-5 w-14 rounded-full bg-surface-100" />
            </div>
          ))}

        {!isPending && reports.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Sin actividad reciente"
            description="Las órdenes nuevas aparecerán aquí."
          />
        )}

        {!isPending &&
          reports.map((r) => {
            const cliente = r.customer
              ? `${r.customer.firstName} ${r.customer.lastName}`
              : `Cliente #${r.customerId}`
            const dispositivo = r.device
              ? `${r.device.brand?.name ?? ''} ${r.device.model ?? ''}`.trim()
              : null
            const fecha = new Date(r.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
            })

            return (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <div className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-surface-700">
                        {r.orderNumber}
                      </span>
                      {r.isUrgent && (
                        <span className="text-[10px] font-semibold text-red-500">⚑</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-surface-400">
                      {cliente}
                      {dispositivo && ` · ${dispositivo}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={r.currentStatus} />
                    <span className="text-[10px] text-surface-400">{fecha}</span>
                  </div>
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
