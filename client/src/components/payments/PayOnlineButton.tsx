import { useState } from 'react'
import { CreditCard } from 'lucide-react'

import {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  type RazorpayResult,
} from '@/features/payments/paymentsApi'

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

const loadCheckout = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment window'))
    document.body.appendChild(script)
  })

const errorMessage = (e: unknown) =>
  (e as { data?: { message?: string } })?.data?.message ?? (e as Error)?.message ?? 'Payment failed'

/** Opens Razorpay Checkout for an invoice; the server verifies and records the payment. */
export default function PayOnlineButton({
  invoiceId,
  onDone,
}: {
  invoiceId: string
  onDone: (message: string, tone: 'success' | 'critical') => void
}) {
  const [busy, setBusy] = useState(false)
  const [createOrder] = useCreateRazorpayOrderMutation()
  const [verifyPayment] = useVerifyRazorpayPaymentMutation()

  const pay = async () => {
    setBusy(true)
    try {
      await loadCheckout()
      const order = await createOrder({ invoiceId }).unwrap()
      if (!window.Razorpay) throw new Error('Payment window unavailable')

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'PAISA',
        description: order.invoice.invoiceNumber ?? order.invoice.title ?? 'Invoice payment',
        prefill: order.prefill,
        handler: async (result: RazorpayResult) => {
          try {
            await verifyPayment({ ...result, invoiceId }).unwrap()
            onDone('Payment successful', 'success')
          } catch (e) {
            onDone(errorMessage(e), 'critical')
          } finally {
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      checkout.on('payment.failed', (response) => {
        onDone(response.error?.description ?? 'Payment failed', 'critical')
        setBusy(false)
      })
      checkout.open()
    } catch (e) {
      onDone(errorMessage(e), 'critical')
      setBusy(false)
    }
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); pay() }}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-lg bg-[var(--p-color-bg-fill-brand,#303030)] px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
    >
      <CreditCard size={12} /> {busy ? 'Opening…' : 'Pay online'}
    </button>
  )
}
