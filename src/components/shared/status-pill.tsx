'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/types/report'

export type { ReportStatus }

const config: Record<ReportStatus, { bg: string; text: string; dot: string }> = {
  RECEIVED:          { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  IN_DIAGNOSIS:      { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500'    },
  BUDGET_SENT:       { bg: 'bg-cyan-50',     text: 'text-cyan-700',    dot: 'bg-cyan-500'    },
  BUDGET_ACCEPTED:   { bg: 'bg-teal-50',     text: 'text-teal-700',    dot: 'bg-teal-500'    },
  BUDGET_REJECTED:   { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500'     },
  WAITING_PARTS:     { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500'   },
  IN_REPAIR:         { bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  REPAIRED:          { bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500'  },
  TESTING:           { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-500'  },
  READY_FOR_PICKUP:  { bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-500'   },
  DELIVERED:         { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED:         { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500'     },
  IRREPARABLE:       { bg: 'bg-zinc-100',    text: 'text-zinc-600',    dot: 'bg-zinc-400'    },
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  RECEIVED:         'Recibido',
  IN_DIAGNOSIS:     'Diagnóstico',
  BUDGET_SENT:      'Pres. enviado',
  BUDGET_ACCEPTED:  'Pres. aceptado',
  BUDGET_REJECTED:  'Pres. rechazado',
  WAITING_PARTS:    'Esp. repuesto',
  IN_REPAIR:        'En reparación',
  REPAIRED:         'Reparado',
  TESTING:          'En pruebas',
  READY_FOR_PICKUP: 'Listo',
  DELIVERED:        'Entregado',
  CANCELLED:        'Cancelado',
  IRREPARABLE:      'No reparable',
}

const TRANSITION_STATES: ReportStatus[] = [
  'RECEIVED', 'IN_DIAGNOSIS', 'BUDGET_SENT', 'BUDGET_ACCEPTED',
  'WAITING_PARTS', 'IN_REPAIR', 'REPAIRED', 'TESTING',
  'READY_FOR_PICKUP', 'DELIVERED',
]

interface StatusPillProps {
  status: ReportStatus
  editable?: boolean
  onChange?: (next: ReportStatus) => void
}

export function StatusPill({ status, editable = false, onChange }: StatusPillProps) {
  const [open, setOpen] = useState(false)
  const c = config[status]

  const pill = (
    <span
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onClick={editable ? (e) => { e.preventDefault(); setOpen(o => !o) } : undefined}
      onKeyDown={editable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } } : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
        c.bg, c.text,
        editable && 'cursor-pointer hover:opacity-80 transition-opacity',
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', c.dot)} />
      {STATUS_LABELS[status]}
    </span>
  )

  if (!editable) return pill

  return (
    <div className="relative">
      {pill}
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl
                     border border-surface-200 bg-white py-1 shadow-xl"
          onClick={e => e.preventDefault()}
        >
          {TRANSITION_STATES.map((s) => (
            <button
              key={s}
              onClick={() => { onChange?.(s); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs
                         transition-colors hover:bg-surface-50"
            >
              <span className={cn('h-2 w-2 shrink-0 rounded-full', config[s].dot)} />
              <span className={cn('flex-1 font-medium', config[s].text)}>
                {STATUS_LABELS[s]}
              </span>
              {s === status && <Check className="h-3 w-3 text-brand-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
