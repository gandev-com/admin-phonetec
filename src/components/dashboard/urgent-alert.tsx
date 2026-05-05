'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { reportsApi } from '@/lib/api/reports'

export function UrgentAlert() {
  const { data } = useQuery({
    queryKey: ['reports', 'urgent-list'],
    queryFn:  () => reportsApi.list({ isUrgent: true, limit: 3, include: 'customer,device', sortBy: 'createdAt', order: 'asc' }),
    staleTime: 30_000,
  })

  const orders = data?.data ?? []

  if (orders.length === 0) return null

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
        <AlertTriangle className="h-4 w-4 text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-red-900">
          {orders.length === 1
            ? '1 orden urgente requiere atención'
            : `${orders.length} órdenes urgentes requieren atención`}
        </p>
        <div className="mt-1.5 space-y-1">
          {orders.map((o) => {
            const cliente = o.customer
              ? `${o.customer.firstName} ${o.customer.lastName}`
              : `Cliente #${o.customerId}`
            const dispositivo = o.device
              ? `${o.device.brand?.name ?? ''} ${o.device.model ?? ''}`.trim()
              : `Dispositivo #${o.deviceId}`
            const horasDesde = Math.floor(
              (Date.now() - new Date(o.createdAt).getTime()) / 3_600_000,
            )
            return (
              <Link key={o.id} href={`/reports/${o.id}`}>
                <div className="flex items-center gap-2 text-xs text-red-700 transition-colors hover:text-red-900">
                  <span className="font-mono font-medium">{o.orderNumber}</span>
                  <span className="text-red-400">·</span>
                  <span>{cliente}</span>
                  <span className="text-red-400">·</span>
                  <span>{dispositivo}</span>
                  <span className="ml-auto font-semibold">{horasDesde}h</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
