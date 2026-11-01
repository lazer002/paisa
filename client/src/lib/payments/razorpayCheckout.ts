// Razorpay Checkout loader shared by invoice payments and plan upgrades.

export interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export const loadCheckout = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment window'))
    document.body.appendChild(script)
  })

export const paymentErrorMessage = (e: unknown) =>
  (e as { data?: { message?: string } })?.data?.message ?? (e as Error)?.message ?? 'Payment failed'
