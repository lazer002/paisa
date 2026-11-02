import type { ReportFormat } from '@/features/stats/statsApi'

/**
 * First slots of the validated categorical palette, assigned in fixed order
 * (series 1 = blue, series 2 = orange); text stays in ink tones.
 */
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a']

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
export const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function formatValue(value: number, format: ReportFormat): string {
  if (format === 'currency') return `₹${inr.format(value)}`
  if (format === 'percent') return `${num.format(value)}%`
  if (format === 'hours') return `${num.format(value)} h`
  return num.format(value)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-10-04" → "4 Oct", "2026-10" → "Oct 2026". */
export function bucketLabel(bucket: string): string {
  const [y, m, d] = bucket.split('-')
  const month = MONTHS[Number(m) - 1] ?? m
  return d ? `${Number(d)} ${month}` : `${month} ${y}`
}
