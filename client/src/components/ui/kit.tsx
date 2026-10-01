import { ReactNode } from 'react'

// ─── Polaris-inspired design tokens ──────────────────────────────────────────
// Shopify-grade neutral surfaces, single accent, restrained color use.

export const TONE_CLASSES: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  critical: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  neutral: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  attention: 'bg-violet-50 text-violet-700 ring-violet-600/20',
}

/** Map any domain status string to a Polaris tone. */
export function toneFor(status?: string): string {
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
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
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
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
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-gray-900"
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
      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900"
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse border-b border-gray-50 last:border-0 bg-gray-50" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white py-14 text-center">
        <p className="text-sm font-medium text-gray-600">Something went wrong</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
        <p className="text-sm font-medium text-gray-600">{emptyTitle ?? 'Nothing here yet'}</p>
        {emptyHint && <p className="mt-1 max-w-sm text-xs text-gray-400">{emptyHint}</p>}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-2.5 ${c.className ?? ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyOf(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-gray-50 transition last:border-0 hover:bg-gray-50/70 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 text-sm text-gray-700 ${c.className ?? ''}`}>
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
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            active === t.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
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
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

// ─── Toast (lightweight, per-page mount) ─────────────────────────────────────

export function Toast({ message, tone = 'success', onDone }: { message: string; tone?: 'success' | 'critical'; onDone: () => void }) {
  if (!message) return null
  const styles =
    tone === 'critical'
      ? 'bg-rose-600 text-white'
      : 'bg-gray-900 text-white'
  setTimeout(() => onDone(), 2600)
  return (
    <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${styles}`}>
      {message}
    </div>
  )
}

// ─── Form field primitives ───────────────────────────────────────────────────

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-900'

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4" onClick={onClose}>
      <div
        className={`w-full ${width} overflow-hidden rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
