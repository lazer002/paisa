import type { LeaveBalance } from '@/features/leaves/leavesApi'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** One card per tracked leave type: remaining of total, with used/pending. */
export default function LeaveBalanceCards({ balances, year }: { balances: LeaveBalance[]; year: number }) {
  if (!balances.length) {
    return (
      <p className="rounded-2xl bg-white p-4 text-sm text-gray-500 shadow-sm">
        No leave policy applies to you for {year}, so leave is not limited by a balance.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {balances.map((b) => {
        const pct = b.total > 0 ? Math.max(0, Math.min(100, ((b.used + b.pending) / b.total) * 100)) : 100
        return (
          <div key={b.leaveType} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium capitalize text-gray-500">{b.name.replace(/_/g, ' ')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {fmt(b.remaining)}<span className="text-sm font-normal text-gray-400"> / {fmt(b.total)}</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-gray-800" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Used {fmt(b.used)} · Pending {fmt(b.pending)}
              {b.carriedForward > 0 && ` · Carried ${fmt(b.carriedForward)}`}
              {b.adjustment !== 0 && ` · Adj ${b.adjustment > 0 ? '+' : ''}${fmt(b.adjustment)}`}
            </p>
          </div>
        )
      })}
    </div>
  )
}
