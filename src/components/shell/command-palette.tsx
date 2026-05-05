'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, ClipboardList, Users, Plus, ArrowRight,
  LayoutDashboard, Wrench, Package, Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = query.length === 0
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()),
      )

  const handleSelect = (href: string) => {
    router.push(href)
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); return }
      if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected].href)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtered, selected])

  if (!open) return null

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
          <Search className="h-4 w-4 shrink-0 text-surface-400" />
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
        <div className="max-h-80 overflow-y-auto py-1.5">
          {query === '' && (
            <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-surface-400">
              Acciones rápidas
            </p>
          )}
          {filtered.map((action, idx) => (
            <button
              key={action.id}
              onClick={() => handleSelect(action.href)}
              onMouseEnter={() => setSelected(idx)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                idx === selected
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-700 hover:bg-surface-50',
              )}
            >
              <action.icon className="h-4 w-4 shrink-0 opacity-60" />
              <span className="flex-1">{action.label}</span>
              {action.shortcut && (
                <kbd className="rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 font-mono text-xs opacity-60">
                  {action.shortcut}
                </kbd>
              )}
              <ArrowRight
                className={cn(
                  'h-3.5 w-3.5 transition-opacity',
                  idx === selected ? 'opacity-60' : 'opacity-0',
                )}
              />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-surface-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
