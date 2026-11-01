// Organization subscription billing (F4). Injected into paymentsApi so no new
// slice has to be registered in the store.
import { paymentsApi, type RazorpayResult } from '@/features/payments/paymentsApi'
import type { OrgPlan } from '@/features/organizations/types'

export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired'

export interface PlanLimits {
  maxUsers: number | null
  maxStudents: number | null
  storageGb: number | null
}

export interface PlanInfo {
  key: OrgPlan
  name: string
  description: string
  prices: { monthly: number; yearly: number }
  limits: PlanLimits
  features: Record<string, boolean>
  highlights: string[]
  popular?: boolean
}

export interface SubscriptionPayment {
  publicId?: string
  providerOrderId?: string | null
  providerPaymentId?: string | null
  amount: number
  currency?: string
  method?: string | null
  status: string
  plan: OrgPlan
  billingCycle: BillingCycle
  periodStart?: string | null
  periodEnd?: string | null
  source?: string
  paidAt?: string
}

export interface SubscriptionHistoryEntry {
  action: string
  fromPlan?: string | null
  toPlan?: string | null
  billingCycle?: string | null
  status?: string | null
  periodEnd?: string | null
  actorRole?: string | null
  note?: string | null
  at: string
}

export interface Usage {
  users: number
  students: number
  storageBytes: number
  storageGb: number
}

export interface LimitViolation {
  limit: keyof PlanLimits
  used: number
  allowed: number
  message: string
}

export interface SubscriptionState {
  organization: { publicId: string; name: string; type?: string }
  subscription: {
    publicId: string
    plan: OrgPlan
    billingCycle: BillingCycle | null
    status: SubscriptionStatus
    currentPeriodStart?: string | null
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd: boolean
    cancelledAt?: string | null
    amount: number
    currency: string
    customLimits?: Partial<PlanLimits> | null
    hasPendingOrder: boolean
    payments: SubscriptionPayment[]
    history: SubscriptionHistoryEntry[]
  }
  plan: PlanInfo
  limits: PlanLimits
  usage: Usage
  violations: LimitViolation[]
  catalog: PlanInfo[]
  razorpayEnabled: boolean
  keyId: string | null
}

export interface SubscriptionCheckout {
  orderId: string
  amount: number
  currency: string
  keyId: string
  plan: { key: OrgPlan; name: string }
  billingCycle: BillingCycle
  organization: { publicId: string; name: string }
  prefill: { name?: string; email?: string }
}

export interface OverridePayload {
  organizationId: string
  plan: OrgPlan
  billingCycle?: BillingCycle | ''
  periodEnd?: string
  status?: SubscriptionStatus | ''
  customLimits?: Partial<Record<keyof PlanLimits, number | ''>> | null
  note: string
  force?: boolean
}

const unwrap = <T>(res: { data?: unknown }) => (res?.data ?? res) as T

const api = paymentsApi.enhanceEndpoints({ addTagTypes: ['Subscription'] })

export const subscriptionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<PlanInfo[], void>({
      query: () => '/subscriptions/plans',
      transformResponse: unwrap<PlanInfo[]>,
    }),
    getSubscription: builder.query<SubscriptionState, { organizationId?: string } | void>({
      query: (params) => ({ url: '/subscriptions/current', params: params || undefined }),
      transformResponse: unwrap<SubscriptionState>,
      providesTags: (_r, _e, arg) => [{ type: 'Subscription', id: (arg && arg.organizationId) || 'MINE' }],
    }),
    createSubscriptionCheckout: builder.mutation<SubscriptionCheckout, { plan: OrgPlan; billingCycle: BillingCycle }>({
      query: (body) => ({ url: '/subscriptions/checkout', method: 'POST', body }),
      transformResponse: unwrap<SubscriptionCheckout>,
      invalidatesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),
    verifySubscriptionPayment: builder.mutation<SubscriptionState, RazorpayResult>({
      query: (body) => ({ url: '/subscriptions/verify', method: 'POST', body }),
      transformResponse: unwrap<SubscriptionState>,
      invalidatesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),
    cancelSubscription: builder.mutation<SubscriptionState, { reason?: string }>({
      query: (body) => ({ url: '/subscriptions/cancel', method: 'POST', body }),
      transformResponse: unwrap<SubscriptionState>,
      invalidatesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),
    resumeSubscription: builder.mutation<SubscriptionState, void>({
      query: () => ({ url: '/subscriptions/resume', method: 'POST', body: {} }),
      transformResponse: unwrap<SubscriptionState>,
      invalidatesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),
    overrideSubscription: builder.mutation<SubscriptionState, OverridePayload>({
      query: (body) => ({ url: '/subscriptions/override', method: 'POST', body }),
      transformResponse: unwrap<SubscriptionState>,
      invalidatesTags: (_r, _e, arg) => [{ type: 'Subscription', id: arg.organizationId }],
    }),
  }),
})

export const {
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useCreateSubscriptionCheckoutMutation,
  useVerifySubscriptionPaymentMutation,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
  useOverrideSubscriptionMutation,
} = subscriptionsApi

export const formatInr = (amount: number) =>
  amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const limitLabel = (value: number | null | undefined, unit = '') =>
  value === null || value === undefined ? 'Unlimited' : `${value.toLocaleString('en-IN')}${unit}`
