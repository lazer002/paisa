/**
 * Client-side export helpers: CSV download (Excel-friendly) and
 * "print as PDF" through the browser print dialog. No libraries.
 */

export type ExportCell = string | number | boolean | null | undefined

export interface ExportColumn<T> {
  header: string
  // Method syntax (bivariant) so typed sections fit ExportSection<unknown>[].
  value(row: T): ExportCell
}

export interface ExportSection<T = unknown> {
  /** Shown above the table (print) / as a title row (CSV) when there are several sections. */
  title?: string
  columns: ExportColumn<T>[]
  rows: readonly T[]
}

// Spreadsheet apps execute cells that start with these as formulas.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

function cellText(value: ExportCell): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/** Escape one CSV field (RFC 4180) and neutralise formula injection. */
export function csvEscape(value: ExportCell): string {
  let text = cellText(value)
  if (typeof value === 'string' && FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }
  if (/[",\r\n]/.test(text) || /^\s|\s$/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function sectionLines<T>(section: ExportSection<T>): string[] {
  const lines = [section.columns.map((c) => csvEscape(c.header)).join(',')]
  for (const row of section.rows) {
    lines.push(section.columns.map((c) => csvEscape(c.value(row))).join(','))
  }
  return lines
}

export function toCsv(sections: ExportSection<unknown>[]): string {
  const list = sections
  const multi = list.length > 1
  const lines: string[] = []
  list.forEach((section, index) => {
    if (multi) {
      if (index > 0) lines.push('')
      if (section.title) lines.push(csvEscape(section.title))
    }
    lines.push(...sectionLines(section))
  })
  return lines.join('\r\n')
}

export function safeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  return cleaned || 'export'
}

function todayStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Download sections as a UTF-8 CSV with BOM so Excel reads non-ASCII correctly. */
export function downloadCsv(filename: string, sections: ExportSection<unknown>[]): void {
  const csv = '﻿' + toCsv(sections)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeFilename(filename)}-${todayStamp()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Open a print window with the sections as plain tables; the user picks
 * "Save as PDF" in the browser dialog. Returns false if the popup was blocked.
 */
export function printTables(
  title: string,
  sections: ExportSection<unknown>[],
  subtitle?: string,
): boolean {
  const win = window.open('', '_blank', 'width=1024,height=768')
  if (!win) return false

  const tables = sections
    .map((section) => {
      const head = section.columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')
      const body = section.rows.length
        ? section.rows
            .map(
              (row) =>
                `<tr>${section.columns
                  .map((c) => `<td>${escapeHtml(cellText(c.value(row)))}</td>`)
                  .join('')}</tr>`,
            )
            .join('')
        : `<tr><td colspan="${section.columns.length}" class="empty">No rows</td></tr>`
      const heading = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ''
      return `${heading}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    })
    .join('')

  const generated = new Date().toLocaleString()
  win.document.open()
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 20px 0 6px; }
  p.meta { font-size: 11px; color: #555; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; }
  td.empty { text-align: center; color: #777; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${subtitle ? escapeHtml(subtitle) + ' · ' : ''}Generated ${escapeHtml(generated)}</p>
${tables}
</body></html>`)
  win.document.close()
  win.focus()
  // Give the new document a tick to lay out before opening the dialog.
  setTimeout(() => {
    win.print()
  }, 250)
  return true
}

/* ---------- formatting helpers for human-readable exports ---------- */

export function fmtDate(value?: string | number | Date | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(value?: string | number | Date | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Plain number with 2 decimals and the currency code, e.g. "1,250.00 INR". */
export function fmtAmount(value?: number | string | null, currency?: string | null): string {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const text = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${text} ${currency}` : text
}

/** Name of a populated reference, falling back to email / code; never a raw id. */
export function refName(
  value: unknown,
  ...keys: string[]
): string {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of keys.length ? keys : ['name', 'title', 'email']) {
    const v = record[key]
    if (typeof v === 'string' && v) return v
  }
  return ''
}

export function humanize(value?: string | null): string {
  if (!value) return ''
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
