import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface PaymentRecord {
  _id: string
  publicId?: string
  receiptNumber?: string | null
  amount: number
  amountRefunded?: number
  currency?: string
  method: string
  provider: 'manual' | 'razorpay'
  status: 'created' | 'succeeded' | 'failed' | 'partially_refunded' | 'refunded'
  reference?: string | null
  providerPaymentId?: string | null
  paidAt?: string | null
  createdAt: string
  invoiceId?: {
    publicId?: string
    invoiceNumber?: string
    title?: string
    grandTotal?: number
    amountDue?: number
    status?: string
    currency?: string
  } | string
  payerId?: { publicId?: string; name?: string; email?: string } | string | null
  receivedBy?: { publicId?: string; name?: string } | string | null
  refunds?: { amount: number; reason?: string | null; refundedAt: string }[]
}

export interface ReceiptData {
  payment: PaymentRecord
  organization?: { name?: string; contact?: { email?: string; phone?: string; address?: Record<string, string> } }
}

export interface RazorpayOrder {
  orderId: string
  amount: number
  currency: string
  keyId: string
  invoice: { publicId: string; invoiceNumber?: string; title?: string }
  prefill: { name?: string; email?: string }
}

export interface RazorpayResult {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

const unwrap = <T>(res: { data?: unknown }) => (res?.data ?? res) as T

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    getPaymentConfig: builder.query<{ razorpayEnabled: boolean; keyId: string | null }, void>({
      query: () => '/payments/config',
      transformResponse: unwrap<{ razorpayEnabled: boolean; keyId: string | null }>,
    }),
    getPayments: builder.query<PaymentRecord[], { invoiceId?: string } | void>({
      query: (params) => ({ url: '/payments', params: params || undefined }),
      transformResponse: unwrap<PaymentRecord[]>,
      providesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
    getReceipt: builder.query<ReceiptData, string>({
      query: (id) => `/payments/${id}`,
      transformResponse: unwrap<ReceiptData>,
      providesTags: (_r, _e, id) => [{ type: 'Payment', id }],
    }),
    createRazorpayOrder: builder.mutation<RazorpayOrder, { invoiceId: string; amount?: number }>({
      query: (body) => ({ url: '/payments/razorpay/order', method: 'POST', body }),
      transformResponse: unwrap<RazorpayOrder>,
    }),
    verifyRazorpayPayment: builder.mutation<{ payment: PaymentRecord }, RazorpayResult & { invoiceId: string }>({
      query: (body) => ({ url: '/payments/razorpay/verify', method: 'POST', body }),
      transformResponse: unwrap<{ payment: PaymentRecord }>,
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
    refundPayment: builder.mutation<unknown, { id: string; amount: number; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/refund`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetPaymentConfigQuery,
  useGetPaymentsQuery,
  useGetReceiptQuery,
  useLazyGetReceiptQuery,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useRefundPaymentMutation,
} = paymentsApi
