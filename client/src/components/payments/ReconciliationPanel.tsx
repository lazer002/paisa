import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, Wrench } from 'lucide-react'

import api from '@/lib/api/axios'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'

interface Issue {
  type: string
  invoiceId?: string
  invoiceNumber?: string | null
  paymentId?: string
  receiptNumber?: string | null
  message: string
  fixable: boolean
}

interface Reconciliation {
  summary: {
    invoiced: number
    collected: number
    refunded: number
    outstanding: number
    byMethod: Record<string, number>
    invoicesChecked: number
    paymentsChecked: number
  }
  issues: Issue[]
}

const ISSUE_LABEL: Record<string, string> = {
  amount_mismatch: 'Amounts don’t match payments',
  payment_not_applied: 'Payment not applied',
  status_mismatch: 'Wrong status',
  overpaid: 'Overpaid',
  payment_on_closed: 'Paid on a closed invoice',
  orphan_payment: 'Payment without invoice',
  stale_online_order: 'Unfinished online payment',
}

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`
const monthStart = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const errText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

/**
 * Finance check: totals for a period and every invoice whose numbers don't
 * match its payments; fixable ones are recalculated from the payments.
 */
export default function ReconciliationPanel() {
  const { can } = usePermission()
  const canFix = can('finance:manage')
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<Reconciliation | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(
    () =>
      api
        .get('/payments/reconciliation', { params: { from, to } })
        .then((res) => setData(res.data.data))
        .catch((e) => setMessage({ text: errText(e, 'Could not run the reconciliation'), ok: false })),
    [from, to],
  )

  useEffect(() => {
    load()
  }, [load])

  const fix = async (issue: Issue) => {
    if (!issue.invoiceId) return
    setBusy(issue.invoiceId)
    try {
      const res = await api.post(`/payments/reconciliation/invoices/${issue.invoiceId}/fix`)
      setMessage({ text: res.data.message, ok: true })
      await load()
    } catch (e) {
      setMessage({ text: errText(e, 'Could not fix the invoice'), ok: false })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Reconciliation</h2>
          <p className="text-xs text-gray-400">Invoices checked against the payments recorded for them</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input type="date" aria-label="From" className="rounded-lg border border-gray-200 px-2 py-1" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          <span className="text-gray-400">to</span>
          <input type="date" aria-label="To" className="rounded-lg border border-gray-200 px-2 py-1" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={() => load()}><RefreshCw size={13} /> Re-check</Button>
        </div>
      </div>

      {message && <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{message.text}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Invoiced in period', inr(data.summary.invoiced)],
              ['Collected in period', inr(data.summary.collected)],
              ['Refunded in period', inr(data.summary.refunded)],
              ['Outstanding now', inr(data.summary.outstanding)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-gray-50 px-3 py-2.5">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
          {Object.keys(data.summary.byMethod).length > 0 && (
            <p className="text-xs text-gray-500">
              By method: {Object.entries(data.summary.byMethod).map(([m, v]) => `${m.replace(/_/g, ' ')} ${inr(v)}`).join(' · ')}
            </p>
          )}

          {data.issues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} /> Everything matches — {data.summary.invoicesChecked} invoices and {data.summary.paymentsChecked} payments checked.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50 rounded-xl border border-amber-100">
              {data.issues.map((issue, i) => (
                <li key={`${issue.type}-${issue.invoiceId ?? issue.paymentId}-${i}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                  <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">{ISSUE_LABEL[issue.type] ?? issue.type}</span>
                    {issue.invoiceNumber && <span className="ml-2 text-xs text-gray-400">{issue.invoiceNumber}</span>}
                    <span className="block text-xs text-gray-600">{issue.message}</span>
                  </span>
                  {issue.fixable && canFix && issue.invoiceId && (
                    <Button size="sm" variant="secondary" loading={busy === issue.invoiceId} onClick={() => fix(issue)}>
                      <Wrench size={13} /> Recalculate
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
