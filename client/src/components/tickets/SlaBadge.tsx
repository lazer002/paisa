import { useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

import type { TicketSlaState } from '@/features/platform/platformApi'

/** "3h 20m" / "2d 4h" / "15m" for a duration in ms. */
const humanizeDuration = (ms: number) => {
  const mins = Math.max(0, Math.round(Math.abs(ms) / 60000))
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const rest = mins % 60
  if (days) return `${days}d${hours ? ` ${hours}h` : ''}`
  if (hours) return `${hours}h${rest ? ` ${rest}m` : ''}`
  return `${rest}m`
}

/** SLA status chip: overdue / due in / met. Server sends `slaState` on every ticket. */
export default function SlaBadge({ sla, compact = false }: { sla?: TicketSlaState; compact?: boolean }) {
  // Snapshot of "now" taken on mount; the list refetches often enough.
  const [now] = useState(() => Date.now())

  if (!sla) return <span className="text-xs text-gray-300">—</span>

  const due = new Date(sla.dueAt).getTime()
  const left = due - now

  if (sla.stopped) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <CheckCircle2 size={12} /> {compact ? 'Done' : 'SLA stopped'}
      </span>
    )
  }

  if (sla.overdue || left < 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
        title={`Was due ${new Date(sla.dueAt).toLocaleString()}`}
      >
        <AlertTriangle size={12} /> Overdue {humanizeDuration(left)}
      </span>
    )
  }

  // Under a quarter of the window left → warn.
  const warn = left < (sla.hours * 3600000) / 4
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        warn ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
      }`}
      title={`Due ${new Date(sla.dueAt).toLocaleString()}`}
    >
      <Clock size={12} /> Due in {humanizeDuration(left)}
    </span>
  )
}
