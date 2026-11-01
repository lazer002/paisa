import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

import type { OrgPlan } from '@/features/organizations/types'
import {
  formatInr,
  limitLabel,
  useGetSubscriptionQuery,
  useOverrideSubscriptionMutation,
  type BillingCycle,
  type PlanLimits,
  type SubscriptionStatus,
} from '@/features/subscriptions/subscriptionsApi'
import { paymentErrorMessage } from '@/lib/payments/razorpayCheckout'
import Button from '@/components/ui/button'
import { Field, SectionCard, StatusBadge, Toast, inputCls } from '@/components/ui/kit'

type LimitDraft = Record<keyof PlanLimits, string>

const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

/** super_admin: set an organization's plan/period manually (comp, override), with a reason. */
export default function SubscriptionOverridePanel({ organizationId }: { organizationId: string }) {
  const { data: state, isLoading, isError } = useGetSubscriptionQuery({ organizationId })
  const [override, { isLoading: saving }] = useOverrideSubscriptionMutation()
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const [editing, setEditing] = useState(false)
  const [plan, setPlan] = useState<OrgPlan>('free')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [periodEnd, setPeriodEnd] = useState('')
  const [status, setStatus] = useState<SubscriptionStatus | ''>('')
  const [limits, setLimits] = useState<LimitDraft>({ maxUsers: '', maxStudents: '', storageGb: '' })
  const [note, setNote] = useState('')
  const [force, setForce] = useState(false)

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
  if (isError || !state) return null

  const sub = state.subscription

  const startEdit = () => {
    setPlan(sub.plan)
    setCycle(sub.billingCycle ?? 'monthly')
    setPeriodEnd(toDateInput(sub.currentPeriodEnd))
    setStatus('')
    setLimits({
      maxUsers: sub.customLimits?.maxUsers != null ? String(sub.customLimits.maxUsers) : '',
      maxStudents: sub.customLimits?.maxStudents != null ? String(sub.customLimits.maxStudents) : '',
      storageGb: sub.customLimits?.storageGb != null ? String(sub.customLimits.storageGb) : '',
    })
    setNote('')
    setForce(false)
    setEditing(true)
  }

  const save = async () => {
    try {
      const num = (v: string) => (v.trim() === '' ? '' : Number(v))
      await override({
        organizationId,
        plan,
        billingCycle: plan === 'free' ? '' : cycle,
        periodEnd: plan === 'free' || !periodEnd ? undefined : new Date(`${periodEnd}T23:59:59`).toISOString(),
        status,
        customLimits: { maxUsers: num(limits.maxUsers), maxStudents: num(limits.maxStudents), storageGb: num(limits.storageGb) },
        note: note.trim(),
        force,
      }).unwrap()
      setEditing(false)
      setToast({ msg: 'Subscription updated', tone: 'success' })
    } catch (e) {
      setToast({ msg: paymentErrorMessage(e), tone: 'critical' })
    }
  }

  return (
    <SectionCard
      title="Subscription"
      subtitle="Manual plan changes are recorded in the subscription history and the audit log"
      actions={!editing && <Button size="sm" variant="secondary" onClick={startEdit}>Override plan</Button>}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold capitalize text-gray-900">{state.plan.name}</span>
        <StatusBadge status={sub.status} />
        {sub.billingCycle && <span className="text-gray-500">· {sub.billingCycle}</span>}
        <span className="text-gray-500">
          · {sub.currentPeriodEnd ? `${sub.cancelAtPeriodEnd ? 'ends' : 'renews'} ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : 'no period'}
        </span>
        {sub.amount > 0 && <span className="text-gray-500">· last paid {formatInr(sub.amount)}</span>}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Usage: {state.usage.users} / {limitLabel(state.limits.maxUsers)} users · {state.usage.students} / {limitLabel(state.limits.maxStudents)} students · {state.usage.storageGb} / {limitLabel(state.limits.storageGb, ' GB')}
      </p>

      {editing && (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Plan" required>
              <select className={inputCls} value={plan} onChange={(e) => setPlan(e.target.value as OrgPlan)}>
                {state.catalog.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Billing cycle">
              <select className={inputCls} value={cycle} disabled={plan === 'free'} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </Field>
            <Field label="Period ends">
              <input type="date" className={inputCls} value={periodEnd} disabled={plan === 'free'} onChange={(e) => setPeriodEnd(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus | '')}>
                <option value="">Active (default)</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            {(['maxUsers', 'maxStudents', 'storageGb'] as const).map((k) => (
              <Field key={k} label={k === 'maxUsers' ? 'Max users' : k === 'maxStudents' ? 'Max students' : 'Storage GB'}>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder={`Plan: ${limitLabel(state.catalog.find((p) => p.key === plan)?.limits[k])}`}
                  value={limits[k]}
                  onChange={(e) => setLimits((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          <Field label="Reason (audit trail)" required>
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Comp for pilot, invoice #123 paid offline" />
          </Field>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            <ShieldAlert size={13} className="text-amber-600" /> Apply even if current usage exceeds the new limits
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} disabled={note.trim().length < 3}>Save override</Button>
          </div>
        </div>
      )}

      {sub.history.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
          {sub.history.slice(0, 6).map((h, i) => (
            <li key={`${h.at}-${i}`}>
              {new Date(h.at).toLocaleString()} · <span className="font-medium capitalize text-gray-700">{h.action.replace(/_/g, ' ')}</span>
              {h.toPlan && h.fromPlan !== h.toPlan ? ` · ${h.fromPlan ?? '—'} → ${h.toPlan}` : ''}
              {h.actorRole ? ` · by ${h.actorRole}` : ''}
              {h.note ? ` · “${h.note}”` : ''}
            </li>
          ))}
        </ul>
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </SectionCard>
  )
}
