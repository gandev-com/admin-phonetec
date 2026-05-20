'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Search, ClipboardList, Users, Plus,
  LayoutDashboard, Wrench, Package, Receipt, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { customersApi } from '@/lib/api/customers'
import { reportsApi } from '@/lib/api/reports'
import type { Customer } from '@/types/customer'
import type { Report } from '@/types/report'

const QUICK_ACTIONS = [
  { id: 'new-order',    label: 'Nueva orden de reparación', icon: Plus,           href: '/reception',  shortcut: 'N' },
  { id: 'orders',       label: 'Ver todas las órdenes',     icon: ClipboardList,  href: '/reports' },
  { id: 'kanban',       label: 'Tablero Kanban',            icon: LayoutDashboard,href: '/orders' },
  { id: 'reception',    label: 'Recepción',                 icon: Wrench,         href: '/reception' },
  { id: 'new-client',   label: 'Nuevo cliente',             icon: Plus,           href: '/customers/new' },
  { id: 'clients',      label: 'Ver clientes',              icon: Users,          href: '/customers' },
  { id: 'inventory',    label: 'Inventario de repuestos',   icon: Package,        href: '/parts' },
  { id: 'accounting',   label: 'Contabilidad',              icon: Receipt,        href: '/accounting' },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()
  const debouncedQuery = useDebounce(query, 300)

  const { data, isFetching } = useQuery({
    queryKey: ['command-search', debouncedQuery],
    queryFn: () => Promise.all([
      customersApi.list({ search: debouncedQuery, limit: 5 }),
      reportsApi.list({ search: debouncedQuery, limit: 5, include: 'customer,device' }),
    ]),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 10_000,
  })

  const customers: Customer[] = data?.[0].data ?? []
  const orders: Report[]      = data?.[1].data ?? []
  const searching = isFetching

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const hasResults = query.trim().length > 0
  const filteredActions = query.length === 0
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))

  // Flat list for keyboard navigation
  type NavItem = { type: 'action'; href: string } | { type: 'customer'; id: string | number } | { type: 'order'; id: string | number }
  const navItems: NavItem[] = hasResults
    ? [
        ...customers.map(c => ({ type: 'customer' as const, id: c.id })),
        ...orders.map(r => ({ type: 'order' as const, id: r.id })),
        ...filteredActions.map(a => ({ type: 'action' as const, href: a.href })),
      ]
    : filteredActions.map(a => ({ type: 'action' as const, href: a.href }))

  const handleSelect = (href: string) => {
    router.push(href)
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, navItems.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); return }
      if (e.key === 'Enter') {
        const item = navItems[selected]
        if (!item) return
        if (item.type === 'action')   handleSelect(item.href)
        if (item.type === 'customer') handleSelect(`/customers/${item.id}`)
        if (item.type === 'order')    handleSelect(`/reports/${item.id}`)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, navItems, selected])

  if (!open) return null

  // Offset index helpers for keyboard nav
  const customerOffset = 0
  const orderOffset = customers.length
  const actionOffset = customers.length + orders.length

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border
                   border-surface-200 bg-white shadow-2xl animate-[fadeIn_0.15s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-surface-100 px-4 py-3.5">
          {searching
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-surface-400" />
            : <Search className="h-4 w-4 shrink-0 text-surface-400" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Buscar orden, cliente, acción..."
            className="flex-1 bg-transparent text-sm text-surface-900 outline-none placeholder:text-surface-400"
          />
          <kbd className="rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 font-mono text-xs text-surface-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-1.5">

          {/* ── Customers ── */}
          {hasResults && customers.length > 0 && (
            <>
              <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-surface-400">
                Clientes
              </p>
              {customers.map((c, i) => {
                const idx = customerOffset + i
                return (
                  <button
                    key={`c-${c.id}`}
                    onClick={() => handleSelect(`/customers/${c.id}`)}
                    onMouseEnter={() => setSelected(idx)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      idx === selected ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-50',
                    )}
                  >
                    <Users className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="flex-1">
                      {c.firstName} {c.lastName}
                      {c.secondLastName ? ` ${c.secondLastName}` : ''}
                    </span>
                    {c.phone1 && (
                      <span className="text-xs text-surface-400">{c.phone1}</span>
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* ── Orders ── */}
          {hasResults && orders.length > 0 && (
            <>
              <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-surface-400">
                Órdenes
              </p>
              {orders.map((r, i) => {
                const idx = orderOffset + i
                const cliente = r.customer
                  ? `${r.customer.firstName} ${r.customer.lastName}`
                  : `#${r.customerId}`
                const device = r.device
                  ? `${r.device.brand?.name ?? ''} ${r.device.model ?? ''}`.trim()
                  : ''
                return (
                  <button
                    key={`r-${r.id}`}
                    onClick={() => handleSelect(`/reports/${r.id}`)}
                    onMouseEnter={() => setSelected(idx)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      idx === selected ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-50',
                    )}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="flex-1 truncate">
                      <span className="font-mono text-xs text-surface-400">{r.orderNumber} </span>
                      {cliente}
                    </span>
                    {device && <span className="text-xs text-surface-400 truncate max-w-[100px]">{device}</span>}
                  </button>
                )
              })}
            </>
          )}

          {/* ── Quick actions ── */}
          {(filteredActions.length > 0 || !hasResults) && (
            <>
              <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-surface-400">
                {hasResults ? 'Acciones' : 'Acciones rápidas'}
              </p>
              {filteredActions.map((action, i) => {
                const idx = actionOffset + i
                return (
                  <button
                    key={action.id}
                    onClick={() => handleSelect(action.href)}
                    onMouseEnter={() => setSelected(idx)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      idx === selected ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-50',
                    )}
                  >
                    <action.icon className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="flex-1">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 font-mono text-xs opacity-60">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* No results */}
          {hasResults && !searching && customers.length === 0 && orders.length === 0 && filteredActions.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-surface-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
