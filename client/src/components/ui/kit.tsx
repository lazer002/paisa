import { ReactNode, useEffect, useRef } from 'react'

// ─── Polaris components (tokens + primitives live in styles/globals.css) ─────

const TONE_CLASSES: Record<string, string> = {
  success: 'bg-[#affebf] text-[#014b40]',
  info: 'bg-[#e0f0ff] text-[#00527c]',
  warning: 'bg-[#ffef9d] text-[#4f4700]',
  critical: 'bg-[#fedad9] text-[#8e0b21]',
  neutral: 'bg-[#e3e3e3] text-[#616161]',
  attention: 'bg-[#ffd6a4] text-[#5e4200]',
}

/** Map any domain status string to a Polaris tone. */
function toneFor(status?: string): string {
  const s = (status ?? '').toLowerCase()
  if (['paid', 'active', 'approved', 'present', 'won', 'issued', 'resolved', 'completed', 'earned', 'published', 'live'].includes(s)) return 'success'
  if (['pending', 'submitted', 'draft', 'scheduled', 'partial', 'in_progress', 'review', 'medium', 'normal', 'new', 'claimed'].includes(s)) return 'warning'
  if (['rejected', 'overdue', 'critical', 'absent', 'high', 'lost', 'revoked', 'cancelled', 'closed', 'expired', 'suspended', 'urgent'].includes(s)) return 'critical'
  if (['sent', 'processed', 'late', 'graded', 'open'].includes(s)) return 'info'
  return 'neutral'
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status?: string | null }) {
  const label = (status ?? '—').replace(/_/g, ' ')
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium capitalize ${
        TONE_CLASSES[toneFor(status ?? undefined)]
      }`}
    >
      {label}
    </span>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

export function SectionCard({
  title, subtitle, actions, children, padded = true,
}: {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  padded?: boolean
}) {
  return (
    <section className="p-card overflow-hidden">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? (title || actions ? 'px-4 pb-4 pt-2' : 'p-4') : ''}>{children}</div>
    </section>
  )
}

// ─── Toolbar (search + filters + actions) ────────────────────────────────────

export function Toolbar({
  search, onSearch, searchPlaceholder = 'Search', filters, actions,
}: {
  search?: string
  onSearch?: (v: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {onSearch && (
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="p-input pl-9"
          />
        </div>
      )}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>
    </div>
  )
}

export function SelectFilter({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-input w-auto pr-8"
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── DataTable ───────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export function DataTable<T extends { _id?: string; publicId?: string }>({
  columns, rows, keyOf, onRowClick, loading, error, onRetry, emptyTitle, emptyHint, emptyAction,
}: {
  columns: Column<T>[]
  rows: T[] | undefined
  keyOf: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  emptyTitle?: string
  emptyHint?: string
  emptyAction?: ReactNode
}) {
  if (loading) {
    return (
      <div className="p-card overflow-hidden p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="m-1 h-9 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-card flex flex-col items-center py-14 text-center">
        <p className="text-sm font-semibold text-gray-900">Something went wrong</p>
        {onRetry && (
          <button onClick={onRetry} className="p-btn p-btn-secondary mt-3 min-h-7 px-2.5 py-1 text-xs">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!rows?.length) {
    return (
      <div className="p-card flex flex-col items-center py-14 text-center">
        <p className="text-base font-semibold text-gray-900">{emptyTitle ?? 'Nothing here yet'}</p>
        {emptyHint && <p className="mt-1 max-w-sm text-sm text-gray-500">{emptyHint}</p>}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="p-card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium ${c.className ?? ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyOf(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-gray-100 transition last:border-0 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2.5 text-sm text-gray-900 ${c.className ?? ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          role="tab"
          aria-selected={active === t.id}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active === t.id ? 'bg-black/[0.08] text-gray-900' : 'text-gray-500 hover:bg-black/[0.05] hover:text-gray-900'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1.5 rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export function Pagination({
  page, totalPages, onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="p-btn p-btn-secondary min-h-7 px-2.5 py-1 text-xs"
      >
        Previous
      </button>
      <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="p-btn p-btn-secondary min-h-7 px-2.5 py-1 text-xs"
      >
        Next
      </button>
    </div>
  )
}

// ─── Toast (lightweight, per-page mount) ─────────────────────────────────────

export function Toast({ message, tone = 'success', onDone }: { message: string; tone?: 'success' | 'critical'; onDone: () => void }) {
  // Pages pass a fresh onDone each render; keep the latest in a ref so the
  // timer only restarts when the message changes.
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => doneRef.current(), 2600)
    return () => clearTimeout(t)
  }, [message])
  if (!message) return null
  const styles =
    tone === 'critical'
      ? 'bg-[#c70a24] text-white'
      : 'bg-[#1a1a1a] text-white'
  return (
    <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl ${styles}`}>
      {message}
    </div>
  )
}

// ─── Form field primitives ───────────────────────────────────────────────────

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-[#c70a24]">*</span>}
      </label>
      {children}
    </div>
  )
}

export const inputCls = 'p-input'

export function ModalShell({
  open, onClose, title, children, footer, size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!open) return null
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`w-full ${width} overflow-hidden rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 transition hover:bg-black/5 hover:text-gray-900" aria-label="Close">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}
