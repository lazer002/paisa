import { useState } from 'react'
import { Printer, Undo2 } from 'lucide-react'

import { usePermission } from '@/lib/auth/usePermission'
import { rid } from '@/features/users/usersApi'
import {
  useGetPaymentsQuery,
  useRefundPaymentMutation,
  useLazyGetReceiptQuery,
  type PaymentRecord,
  type ReceiptData,
} from '@/features/payments/paymentsApi'
import { ModalShell, StatusBadge, Field, inputCls } from '@/components/ui/kit'
import Button from '@/components/ui/button'

const money = (n?: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(n ?? 0)

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Prints a receipt in a new window from the server's receipt payload. */
const printReceipt = ({ payment, organization }: ReceiptData) => {
  const invoice = typeof payment.invoiceId === 'object' ? payment.invoiceId : undefined
  const payer = typeof payment.payerId === 'object' ? payment.payerId : undefined
  const win = window.open('', '_blank', 'width=720,height=900')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>Receipt ${esc(payment.receiptNumber)}</title>
<style>body{font-family:Inter,system-ui,sans-serif;color:#111;margin:40px}h1{font-size:20px;margin:0}
.muted{color:#666;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:24px}
td{padding:8px 0;border-bottom:1px solid #eee;font-size:14px}td:last-child{text-align:right}
.total{font-size:18px;font-weight:600}</style></head><body>
<h1>${esc(organization?.name ?? 'PAISA')}</h1>
<p class="muted">${esc(organization?.contact?.email ?? '')} ${esc(organization?.contact?.phone ?? '')}</p>
<h2 style="font-size:16px;margin-top:32px">Payment receipt ${esc(payment.receiptNumber)}</h2>
<table>
<tr><td>Date</td><td>${esc(new Date(payment.paidAt ?? payment.createdAt).toLocaleString('en-IN'))}</td></tr>
<tr><td>Received from</td><td>${esc(payer?.name ?? '—')}</td></tr>
<tr><td>Invoice</td><td>${esc(invoice?.invoiceNumber ?? invoice?.publicId ?? '')}</td></tr>
<tr><td>Method</td><td>${esc(payment.method)}${payment.reference ? ` (${esc(payment.reference)})` : ''}</td></tr>
${payment.amountRefunded ? `<tr><td>Refunded</td><td>${esc(money(payment.amountRefunded, payment.currency))}</td></tr>` : ''}
<tr><td class="total">Amount paid</td><td class="total">${esc(money(payment.amount, payment.currency))}</td></tr>
</table>
<p class="muted" style="margin-top:32px">Invoice balance after this payment: ${esc(money(invoice?.amountDue, payment.currency))}</p>
<script>window.onload=()=>window.print()</script></body></html>`)
  win.document.close()
}

export default function InvoicePaymentsModal({
  invoiceId,
  invoiceNumber,
  onClose,
  onToast,
}: {
  invoiceId: string
  invoiceNumber?: string
  onClose: () => void
  onToast: (message: string, tone: 'success' | 'critical') => void
}) {
  const { can } = usePermission()
  const { data: payments, isLoading } = useGetPaymentsQuery({ invoiceId })
  const [refundPayment] = useRefundPaymentMutation()
  const [loadReceipt] = useLazyGetReceiptQuery()
  const [refundFor, setRefundFor] = useState<PaymentRecord | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const openReceipt = async (p: PaymentRecord) => {
    try {
      printReceipt(await loadReceipt(rid(p)).unwrap())
    } catch {
      onToast('Could not load the receipt', 'critical')
    }
  }

  const refund = async () => {
    if (!refundFor) return
    try {
      await refundPayment({ id: rid(refundFor), amount: Number(refundAmount), reason: refundReason || undefined }).unwrap()
      onToast('Refund recorded', 'success')
      setRefundFor(null); setRefundAmount(''); setRefundReason('')
    } catch (e) {
      onToast((e as { data?: { message?: string } })?.data?.message ?? 'Refund failed', 'critical')
    }
  }

  return (
    <ModalShell open onClose={onClose} title={`Payments · ${invoiceNumber ?? invoiceId}`} size="lg">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !payments?.length ? (
        <p className="text-sm text-gray-500">No payments yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {payments.map((p) => (
            <li key={rid(p)} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {money(p.amount, p.currency)} · {p.method}
                  {p.provider === 'razorpay' ? ' (online)' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {p.receiptNumber} · {new Date(p.paidAt ?? p.createdAt).toLocaleString('en-IN')}
                  {p.amountRefunded ? ` · refunded ${money(p.amountRefunded, p.currency)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={p.status} />
                <button
                  onClick={() => openReceipt(p)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Printer size={12} /> Receipt
                </button>
                {can('payment:refund') && p.status !== 'refunded' && (
                  <button
                    onClick={() => { setRefundFor(p); setRefundAmount(String(p.amount - (p.amountRefunded ?? 0))) }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Undo2 size={12} /> Refund
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {refundFor && (
        <div className="mt-4 space-y-3 rounded-lg border border-rose-100 bg-rose-50/40 p-3">
          <p className="text-sm font-medium text-gray-900">
            Refund {refundFor.receiptNumber}
            {refundFor.provider === 'razorpay' ? ' (refunded to the original payment method)' : ''}
          </p>
          <Field label="Amount" required>
            <input className={inputCls} type="number" min="0" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          </Field>
          <Field label="Reason">
            <input className={inputCls} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRefundFor(null)}>Cancel</Button>
            <Button onClick={refund} disabled={!Number(refundAmount)}>Refund</Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
