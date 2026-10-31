import { useEffect, useRef, useState } from 'react'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'

import { usePermission } from '@/lib/auth/usePermission'
import {
  downloadCsv,
  printTables,
  type ExportColumn,
  type ExportSection,
} from '@/lib/export'

type ExportMenuProps<T> = {
  /** Used for the file name and the print title. */
  title: string
  /** Optional line under the print title (e.g. applied filters). */
  subtitle?: string
  /** Shown inside the menu, e.g. "Exports the current page only (50 rows)". */
  note?: string
  disabled?: boolean
} & (
  | { columns: ExportColumn<T>[]; rows: readonly T[]; sections?: never }
  | { sections: ExportSection<unknown>[]; columns?: never; rows?: never }
)

/**
 * "Export" button with CSV download and print-to-PDF. Renders nothing for
 * roles without `report:export`. Exports exactly the rows it is given, so
 * pass the filtered list the user is looking at.
 */
export default function ExportMenu<T>(props: ExportMenuProps<T>) {
  const { can } = usePermission()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!can('report:export')) return null

  const sections: ExportSection<unknown>[] = props.sections
    ? props.sections
    : [{ columns: props.columns as ExportColumn<unknown>[], rows: props.rows as readonly unknown[] }]

  const rowCount = sections.reduce((sum, s) => sum + s.rows.length, 0)
  const empty = rowCount === 0

  const onCsv = () => {
    downloadCsv(props.title, sections)
    setOpen(false)
  }

  const onPrint = () => {
    const ok = printTables(props.title, sections, props.subtitle)
    setMessage(ok ? '' : 'Pop-up blocked: allow pop-ups to print.')
    if (ok) setOpen(false)
  }

  const itemCls =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={props.disabled}
        className="p-btn p-btn-secondary min-h-8 px-3 py-1.5 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={15} /> Export
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          <button type="button" role="menuitem" className={itemCls} onClick={onCsv} disabled={empty}>
            <FileSpreadsheet size={15} /> Download CSV (Excel)
          </button>
          <button type="button" role="menuitem" className={itemCls} onClick={onPrint} disabled={empty}>
            <Printer size={15} /> Print / save as PDF
          </button>
          <p className="px-3 pb-1 pt-2 text-xs text-gray-400">
            {empty
              ? 'Nothing to export with the current filters.'
              : `${rowCount} row${rowCount === 1 ? '' : 's'} as currently shown.`}
            {props.note ? ` ${props.note}` : ''}
          </p>
          {message && <p className="px-3 pb-1 text-xs text-red-600">{message}</p>}
        </div>
      )}
    </div>
  )
}
