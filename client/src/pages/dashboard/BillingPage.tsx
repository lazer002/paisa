import { useState } from 'react'
import { CreditCard, Check, Building2, IndianRupee } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  useGetOrganizationsQuery,
  useUpdateOrganizationMutation,
} from '@/features/organizations/organizationsApi'
import type { OrgPlan } from '@/features/organizations/types'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'

const PLANS: {
  name: string
  key: OrgPlan
  price: string
  period: string
  highlight?: boolean
  features: string[]
}[] = [
  {
    name: 'Free',
    key: 'free',
    price: '₹0',
    period: '/month',
    features: ['1 organization', 'Up to 50 members', 'Basic attendance', 'Announcements'],
  },
  {
    name: 'Pro',
    key: 'pro',
    price: '₹2,499',
    period: '/month',
    highlight: true,
    features: ['Unlimited organizations', 'Up to 500 members', 'Payroll + HR tools', 'Priority support'],
  },
  {
    name: 'Enterprise',
    key: 'enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'Unlimited members', 'Dedicated manager', 'SLA + SSO'],
  },
]

export default function BillingPage() {
  const { can, role } = usePermission()
  const isSuperAdmin = role === 'super_admin'
  const canReadOrgs = can('organization:read')

  const { data: orgData, isLoading } = useGetOrganizationsQuery(
    { limit: 100 },
    { skip: !canReadOrgs },
  )
  const [updateOrg, { isLoading: saving }] = useUpdateOrganizationMutation()
  const [savingId, setSavingId] = useState<string | null>(null)

  const orgs = orgData?.data ?? []

  // For org members the server scopes this list to their own organization.
  const myOrg = !isSuperAdmin ? orgs[0] : undefined
  const currentPlan = (myOrg?.plan ?? 'free') as OrgPlan

  const planCount = orgs.reduce(
    (acc, o) => {
      acc[o.plan] = (acc[o.plan] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const changePlan = async (id: string, plan: OrgPlan) => {
    setSavingId(id)
    try {
      await updateOrg({ id, payload: { plan } }).unwrap()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle={
          isSuperAdmin
            ? 'Subscription plans across all organizations'
            : canReadOrgs
              ? 'Your organization plan and available upgrades'
              : 'Plans and invoice-based billing'
        }
      />

      {/* Current organization plan (org members) */}
      {canReadOrgs && !isSuperAdmin && myOrg && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 text-white">
                <Building2 size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{myOrg.name}</p>
                <p className="text-xs text-gray-400">
                  {myOrg.orgCode} ·{' '}
                  {myOrg.planExpiresAt
                    ? `Renews ${new Date(myOrg.planExpiresAt).toLocaleDateString()}`
                    : 'No expiry set'}
                </p>
              </div>
            </div>
            <Badge color={myOrg.plan === 'pro' ? 'blue' : myOrg.plan === 'enterprise' ? 'purple' : 'gray'}>
              {myOrg.plan} plan
            </Badge>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Plan changes are managed by the platform team —{' '}
            <Link to="/dashboard/invoices" className="font-medium text-gray-900 underline">
              view invoices
            </Link>{' '}
            for billing history.
          </p>
        </div>
      )}

      {/* Plan distribution (super admin) */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{p.name} plan</span>
                <Badge color={p.key === 'pro' ? 'blue' : p.key === 'enterprise' ? 'purple' : 'gray'}>
                  {planCount[p.key] ?? 0} orgs
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {p.price}
                <span className="text-sm font-normal text-gray-400">{p.period}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = canReadOrgs && !isSuperAdmin && currentPlan === p.key
          return (
            <div
              key={p.name}
              className={`rounded-2xl bg-white p-6 shadow-sm ${
                p.highlight ? 'ring-2 ring-black' : ''
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                {p.highlight ? (
                  <span className="inline-block rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                ) : (
                  <span />
                )}
                {isCurrent && (
                  <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Current plan
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
              <p className="mt-1">
                <span className="text-3xl font-bold text-gray-900">{p.price}</span>
                <span className="text-sm text-gray-400">{p.period}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>

              {isSuperAdmin ? (
                <p className="mt-5 text-xs text-gray-400">
                  Set this plan per organization in the table below.
                </p>
              ) : isCurrent ? (
                <Button variant="secondary" className="mt-5 w-full" disabled>
                  <Check size={15} /> Current plan
                </Button>
              ) : canReadOrgs ? (
                <Button
                  variant="secondary"
                  className="mt-5 w-full"
                  title="Contact the platform team to change your plan"
                >
                  <CreditCard size={15} /> Contact to upgrade
                </Button>
              ) : (
                <Button variant="secondary" className="mt-5 w-full" disabled title="Plan changes are managed by your organization admin">
                  <CreditCard size={15} /> Managed by admin
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Per-org table with plan control */}
      {canReadOrgs && orgs.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                {isSuperAdmin && <th className="px-4 py-3 font-medium">Change</th>}
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{o.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{o.orgCode}</td>
                  <td className="px-4 py-3">
                    <Badge color={o.plan === 'pro' ? 'blue' : o.plan === 'enterprise' ? 'purple' : 'gray'}>
                      {o.plan}
                    </Badge>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-black"
                        value={o.plan}
                        disabled={savingId === o._id || saving}
                        onChange={(e) => changePlan(o._id, e.target.value as OrgPlan)}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading state for org-scoped viewers */}
      {canReadOrgs && isLoading && (
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
      )}

      {/* Accountant shortcut */}
      {!canReadOrgs && (
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Invoice-based billing</p>
              <p className="text-sm text-gray-500">Track dues, payments and receipts from invoices.</p>
            </div>
          </div>
          <Link to="/dashboard/invoices">
            <Button>
              <CreditCard size={15} /> Open invoices
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
