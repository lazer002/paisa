import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Check, CreditCard, IndianRupee, RotateCcw, Users, GraduationCap, HardDrive, XCircle,
} from 'lucide-react'

import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import type { OrgPlan } from '@/features/organizations/types'
import {
  formatInr,
  limitLabel,
  useCancelSubscriptionMutation,
  useCreateSubscriptionCheckoutMutation,
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useResumeSubscriptionMutation,
  useVerifySubscriptionPaymentMutation,
  type BillingCycle,
  type PlanInfo,
  type SubscriptionState,
} from '@/features/subscriptions/subscriptionsApi'
import type { RazorpayResult } from '@/features/payments/paymentsApi'
import { loadCheckout, paymentErrorMessage } from '@/lib/payments/razorpayCheckout'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import Badge, { type BadgeColor } from '@/components/ui/badge'
import Button from '@/components/ui/button'
import { SectionCard, StatusBadge, Toast } from '@/components/ui/kit'

const planColor = (plan?: string): BadgeColor =>
  plan === 'enterprise' ? 'purple' : plan === 'pro' ? 'blue' : plan === 'starter' ? 'green' : 'gray'

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—')

type ToastState = { msg: string; tone: 'success' | 'critical' } | null

function UsageBar({ icon, label, used, limit, unit = '' }: {
  icon: ReactNode
  label: string
  used: number
  limit: number | null
  unit?: string
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const over = limit !== null && used > limit
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-gray-700">{icon} {label}</span>
        <span className={over ? 'font-semibold text-rose-600' : 'text-gray-500'}>
          {used.toLocaleString('en-IN')}{unit} / {limitLabel(limit, unit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-gray-900'}`}
          style={{ width: limit === null ? '4%' : `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  )
}

function PlanCards({
  catalog, cycle, state, canManage, busyPlan, onChoose,
}: {
  catalog: PlanInfo[]
  cycle: BillingCycle
  state?: SubscriptionState
  canManage: boolean
  busyPlan: string | null
  onChoose?: (plan: PlanInfo) => void
}) {
  const current = state?.subscription
  const activeStatus = current && ['active', 'trialing', 'past_due'].includes(current.status)
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {catalog.map((p) => {
        const isCurrent = current?.plan === p.key && (p.key === 'free' || activeStatus)
        const price = p.prices[cycle]
        const fits = !state || !overLimits(state, p)
        const currentRank = catalog.findIndex((c) => c.key === current?.plan)
        const rank = catalog.findIndex((c) => c.key === p.key)
        const action = isCurrent ? 'Renew' : rank > currentRank ? 'Upgrade' : 'Switch'
        return (
          <div key={p.key} className={`flex flex-col rounded-2xl bg-white p-5 shadow-sm ${p.popular ? 'ring-2 ring-black' : ''}`}>
            <div className="mb-2 flex min-h-6 items-center justify-between">
              {p.popular ? (
                <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-medium text-white">Most popular</span>
              ) : <span />}
              {isCurrent && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Current</span>}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{p.description}</p>
            <p className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{formatInr(price)}</span>
              <span className="text-sm text-gray-400">{p.key === 'free' ? '' : cycle === 'yearly' ? ' /year' : ' /month'}</span>
            </p>
            <ul className="mt-3 flex-1 space-y-1.5">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-green-500" /> {h}
                </li>
              ))}
            </ul>
            {onChoose && (
              p.key === 'free' ? (
                <p className="mt-4 text-xs text-gray-400">
                  {isCurrent ? 'You are on the free plan.' : 'Cancel the paid plan to return to Free at the end of the period.'}
                </p>
              ) : (
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={!canManage || !fits || !state?.razorpayEnabled || busyPlan !== null}
                  loading={busyPlan === p.key}
                  title={
                    !canManage ? 'Only admins and accountants can change the plan'
                      : !fits ? 'Current usage exceeds this plan’s limits'
                        : !state?.razorpayEnabled ? 'Online payments are not configured' : undefined
                  }
                  onClick={() => onChoose(p)}
                >
                  <CreditCard size={15} /> {fits ? `${action} · ${formatInr(price)}` : 'Usage exceeds limits'}
                </Button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

const overLimits = (state: SubscriptionState, plan: PlanInfo) => {
  const custom = state.subscription.customLimits ?? {}
  const limit = (key: 'maxUsers' | 'maxStudents' | 'storageGb') =>
    custom[key] !== null && custom[key] !== undefined ? custom[key]! : plan.limits[key]
  const exceeds = (used: number, max: number | null) => max !== null && used > max
  return exceeds(state.usage.users, limit('maxUsers'))
    || exceeds(state.usage.students, limit('maxStudents'))
    || exceeds(state.usage.storageGb, limit('storageGb'))
}

function OrgSubscription({ setToast }: { setToast: (t: ToastState) => void }) {
  const { can } = usePermission()
  const canManage = can('finance:manage')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [busyPlan, setBusyPlan] = useState<string | null>(null)

  const { data: state, isLoading, isError, refetch } = useGetSubscriptionQuery()
  const [checkout] = useCreateSubscriptionCheckoutMutation()
  const [verify] = useVerifySubscriptionPaymentMutation()
  const [cancel, { isLoading: cancelling }] = useCancelSubscriptionMutation()
  const [resume, { isLoading: resuming }] = useResumeSubscriptionMutation()

  if (isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-white shadow-sm" />
  if (isError || !state) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">Could not load the subscription.</p>
        <Button variant="secondary" className="mt-2" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const sub = state.subscription
  const paid = sub.plan !== 'free' && !!sub.currentPeriodEnd
  const running = ['active', 'trialing', 'past_due'].includes(sub.status)

  const choose = async (plan: PlanInfo) => {
    setBusyPlan(plan.key)
    try {
      await loadCheckout()
      const order = await checkout({ plan: plan.key as OrgPlan, billingCycle: cycle }).unwrap()
      if (!window.Razorpay) throw new Error('Payment window unavailable')
      const rz = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'PAISA',
        description: `${order.plan.name} plan (${order.billingCycle})`,
        prefill: order.prefill,
        handler: async (result: RazorpayResult) => {
          try {
            await verify(result).unwrap()
            setToast({ msg: `${order.plan.name} plan activated`, tone: 'success' })
          } catch (e) {
            setToast({ msg: paymentErrorMessage(e), tone: 'critical' })
          } finally {
            setBusyPlan(null)
          }
        },
        modal: { ondismiss: () => setBusyPlan(null) },
      })
      rz.on('payment.failed', (response) => {
        setToast({ msg: response.error?.description ?? 'Payment failed', tone: 'critical' })
        setBusyPlan(null)
      })
      rz.open()
    } catch (e) {
      setToast({ msg: paymentErrorMessage(e), tone: 'critical' })
      setBusyPlan(null)
    }
  }

  const doCancel = async () => {
    if (!window.confirm(`Cancel at the end of the period (${fmtDate(sub.currentPeriodEnd)})? The plan stays active until then.`)) return
    try {
      await cancel({}).unwrap()
      setToast({ msg: 'Subscription will end at the period end', tone: 'success' })
    } catch (e) {
      setToast({ msg: paymentErrorMessage(e), tone: 'critical' })
    }
  }

  const doResume = async () => {
    try {
      await resume().unwrap()
      setToast({ msg: 'Subscription resumed', tone: 'success' })
    } catch (e) {
      setToast({ msg: paymentErrorMessage(e), tone: 'critical' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{state.organization.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{state.plan.name} plan</h2>
              <Badge color={planColor(sub.plan)}>{sub.billingCycle ?? 'no cycle'}</Badge>
              <StatusBadge status={sub.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {paid
                ? sub.cancelAtPeriodEnd
                  ? `Ends on ${fmtDate(sub.currentPeriodEnd)}, then moves to Free`
                  : sub.status === 'past_due'
                    ? `Payment overdue since ${fmtDate(sub.currentPeriodEnd)} — renew to keep the plan`
                    : `Current period ${fmtDate(sub.currentPeriodStart)} – ${fmtDate(sub.currentPeriodEnd)}`
                : 'Free forever. Upgrade any time.'}
            </p>
          </div>
          {canManage && paid && running && (
            sub.cancelAtPeriodEnd ? (
              <Button variant="secondary" onClick={doResume} loading={resuming}>
                <RotateCcw size={15} /> Resume subscription
              </Button>
            ) : (
              <Button variant="danger" onClick={doCancel} loading={cancelling}>
                <XCircle size={15} /> Cancel at period end
              </Button>
            )
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <UsageBar icon={<Users size={14} />} label="Active users" used={state.usage.users} limit={state.limits.maxUsers} />
          <UsageBar icon={<GraduationCap size={14} />} label="Students" used={state.usage.students} limit={state.limits.maxStudents} />
          <UsageBar icon={<HardDrive size={14} />} label="Storage" used={state.usage.storageGb} limit={state.limits.storageGb} unit=" GB" />
        </div>

        {state.violations.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              Over the plan limits: {state.violations.map((v) => v.message).join('; ')}. New users can’t be added until you upgrade or deactivate some.
            </div>
          </div>
        )}
      </div>

      {/* Plans */}
      <SectionCard
        title="Plans"
        subtitle={state.razorpayEnabled ? 'Pay securely with Razorpay' : 'Online payments are not configured yet — contact the platform team to change plans'}
        actions={
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
            {(['monthly', 'yearly'] as BillingCycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`rounded-md px-3 py-1 font-medium capitalize ${cycle === c ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {c}{c === 'yearly' ? ' (2 months free)' : ''}
              </button>
            ))}
          </div>
        }
      >
        <PlanCards catalog={state.catalog} cycle={cycle} state={state} canManage={canManage} busyPlan={busyPlan} onChoose={choose} />
      </SectionCard>

      {/* Payment history */}
      <SectionCard title="Subscription payments" padded={false}>
        {sub.payments.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-gray-400">No subscription payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2 font-medium">Paid on</th>
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {sub.payments.map((p) => (
                  <tr key={p.providerPaymentId ?? p.publicId} className="border-b border-gray-50">
                    <td className="px-4 py-2">{fmtDate(p.paidAt)}</td>
                    <td className="px-4 py-2 capitalize">{p.plan} · {p.billingCycle}</td>
                    <td className="px-4 py-2 text-gray-500">{fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}</td>
                    <td className="px-4 py-2 font-medium">{formatInr(p.amount)}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{p.providerPaymentId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {sub.history.length > 0 && (
        <SectionCard title="Plan changes">
          <ul className="space-y-1.5 text-sm">
            {sub.history.slice(0, 10).map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex flex-wrap gap-x-2 text-gray-600">
                <span className="text-gray-400">{new Date(h.at).toLocaleString()}</span>
                <span className="font-medium capitalize text-gray-800">{h.action.replace(/_/g, ' ')}</span>
                {h.fromPlan !== h.toPlan && h.toPlan && <span>{h.fromPlan ?? '—'} → {h.toPlan}</span>}
                {h.note && <span className="text-gray-500">“{h.note}”</span>}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}

function PlatformBilling() {
  const { data: orgData, isLoading } = useGetOrganizationsQuery({ limit: 100 })
  const { data: catalog } = useGetPlansQuery()
  const orgs = orgData?.data ?? []
  const counts = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.plan] = (acc[o.plan] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(catalog ?? []).map((p) => (
          <div key={p.key} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{p.name}</span>
              <Badge color={planColor(p.key)}>{counts[p.key] ?? 0} orgs</Badge>
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatInr(p.prices.monthly)}<span className="text-sm font-normal text-gray-400"> /month</span>
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Renews / ends</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{o.name}</td>
                  <td className="px-4 py-3"><Badge color={planColor(o.plan)}>{o.plan}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(o.planExpiresAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/dashboard/organizations/${o.publicId ?? o._id}`} className="text-xs font-medium text-gray-900 underline">
                      Manage subscription
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  const { can, role } = usePermission()
  const isSuperAdmin = role === 'super_admin'
  const canReadSubscription = can('finance:read')
  const [toast, setToast] = useState<ToastState>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle={
          isSuperAdmin
            ? 'Subscription plans across all organizations'
            : canReadSubscription
              ? 'Your organization’s plan, usage and subscription payments'
              : 'Plans and invoice-based billing'
        }
      />

      {isSuperAdmin ? (
        <PlatformBilling />
      ) : canReadSubscription ? (
        <OrgSubscription setToast={setToast} />
      ) : (
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Invoice-based billing</p>
              <p className="text-sm text-gray-500">The organization plan is managed by your admin. Track dues and receipts from invoices.</p>
            </div>
          </div>
          <Link to="/dashboard/invoices">
            <Button>
              <CreditCard size={15} /> Open invoices
            </Button>
          </Link>
        </div>
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
