import { useEffect, useRef, useState } from 'react'

import type { ReportBreakdown, ReportFormat, ReportSeries } from '@/features/stats/statsApi'
import { SERIES_COLORS, bucketLabel, formatValue, num } from './format'

/* Small dependency-free SVG charts for the Reports page. */

/** Compact axis label: 12.5k, ₹1.2L, 80%. */
function axisValue(value: number, format: ReportFormat): string {
  if (format === 'percent') return `${Math.round(value)}%`
  const prefix = format === 'currency' ? '₹' : ''
  if (format === 'currency' && value >= 100000) return `${prefix}${num.format(value / 100000)}L`
  if (value >= 1000) return `${prefix}${num.format(value / 1000)}k`
  return `${prefix}${num.format(value)}`
}

/** A round upper bound for the y axis (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(value: number, format: ReportFormat): number {
  if (format === 'percent') return 100
  // Counts get whole-number ticks (the axis has 4 steps).
  if (format === 'count' && value <= 4) return 4
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * power) return step * power
  }
  return 10 * power
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** Index runs of consecutive non-null values; nulls break the line. */
function segments(data: (number | null)[]): number[][] {
  const runs: number[][] = []
  data.forEach((v, i) => {
    if (v === null) return
    const last = runs[runs.length - 1]
    if (last && last[last.length - 1] === i - 1) last.push(i)
    else runs.push([i])
  })
  return runs
}

const HEIGHT = 220
const PAD = { top: 12, right: 12, bottom: 26, left: 48 }

/** Line chart over time with a crosshair tooltip. One y axis only. */
export function TrendChart({ series, buckets }: { series: ReportSeries; buckets: string[] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const all = series.datasets.flatMap((d) => d.data).filter((v): v is number => v !== null)
  const empty = all.every((v) => v === 0)
  const yMax = niceMax(Math.max(0, ...all), series.format)

  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const n = buckets.length
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 70))))

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - box.left) / Math.max(1, box.width)
    setHover(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))))
  }

  return (
    <div>
      {series.datasets.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-gray-600">
          {series.datasets.map((d, i) => (
            <span key={d.label} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES_COLORS[i] }} /> {d.label}
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        {empty && (
          <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-gray-400">
            No data in this range
          </p>
        )}
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={`${series.title} chart`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#eef0f2" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-400 text-[10px]">
                  {axisValue(t, series.format)}
                </text>
              </g>
            ))}
            {buckets.map((b, i) =>
              i % labelEvery === 0 ? (
                <text key={b} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-gray-400 text-[10px]">
                  {bucketLabel(b)}
                </text>
              ) : null,
            )}
            {!empty &&
              series.datasets.map((d, si) =>
                segments(d.data).map((seg) =>
                  seg.length === 1 ? (
                    <circle key={`${d.label}-${seg[0]}`} cx={x(seg[0])} cy={y(d.data[seg[0]]!)} r={3} fill={SERIES_COLORS[si]} />
                  ) : (
                    <polyline
                      key={`${d.label}-${seg[0]}`}
                      fill="none"
                      stroke={SERIES_COLORS[si]}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={seg.map((i) => `${x(i)},${y(d.data[i]!)}`).join(' ')}
                    />
                  ),
                ),
              )}
            {hover !== null && !empty && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="#9ca3af" strokeDasharray="3 3" />
                {series.datasets.map((d, si) => {
                  const v = d.data[hover]
                  return v === null ? null : (
                    <circle key={d.label} cx={x(hover)} cy={y(v)} r={4.5} fill={SERIES_COLORS[si]} stroke="#fff" strokeWidth={2} />
                  )
                })}
              </g>
            )}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hover !== null && !empty && (
          <div
            className="pointer-events-none absolute top-2 z-20 min-w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={
              x(hover) > width / 2
                ? { right: width - x(hover) + 10 }
                : { left: x(hover) + 10 }
            }
          >
            <p className="mb-1 font-medium text-gray-900">{bucketLabel(buckets[hover])}</p>
            {series.datasets.map((d, si) => (
              <p key={d.label} className="flex items-center justify-between gap-4 text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[si] }} /> {d.label}
                </span>
                <span className="font-medium text-gray-900">
                  {d.data[hover] === null ? 'No data' : formatValue(d.data[hover]!, series.format)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const MAX_BARS = 8

/** Ranked horizontal bars; anything past the 8th folds into "Other". */
export function BreakdownBars({ breakdown }: { breakdown: ReportBreakdown }) {
  const items =
    breakdown.items.length > MAX_BARS
      ? [
          ...breakdown.items.slice(0, MAX_BARS - 1),
          {
            label: 'Other',
            value: breakdown.items.slice(MAX_BARS - 1).reduce((sum, item) => sum + item.value, 0),
          },
        ]
      : breakdown.items

  const max = Math.max(0, ...items.map((i) => i.value))

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No data in this range</p>
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-gray-600" title={item.label}>{item.label}</span>
          <span className="h-2 rounded-full bg-gray-100">
            <span
              className="block h-2 rounded-full"
              style={{ width: `${max ? Math.max(2, (item.value / max) * 100) : 0}%`, background: SERIES_COLORS[0] }}
            />
          </span>
          <span className="text-right font-medium tabular-nums text-gray-900">{formatValue(item.value, breakdown.format)}</span>
        </li>
      ))}
    </ul>
  )
}
