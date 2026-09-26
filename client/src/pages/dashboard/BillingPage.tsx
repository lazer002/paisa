import { CreditCard, Check } from 'lucide-react'
import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/month',
    color: 'bg-gray-100 text-gray-600',
    features: ['1 organization', 'Up to 50 members', 'Basic attendance', 'Announcements'],
  },
  {
    name: 'Pro',
    price: '₹2,499',
    period: '/month',
    color: 'bg-blue-50 text-blue-600',
    highlight: true,
    features: ['Unlimited organizations', 'Up to 500 members', 'Payroll + HR tools', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: 'bg-purple-50 text-purple-600',
    features: ['Everything in Pro', 'Unlimited members', 'Dedicated manager', 'SLA + SSO'],
  },
]

export default function BillingPage() {
  const { data: orgData } = useGetOrganizationsQuery({ limit: 100 })
  const orgs = orgData?.data ?? []

  const planCount = orgs.reduce((acc, o) => {
    acc[o.plan] = (acc[o.plan] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" subtitle="Subscription plans and organization usage" />

      {/* Current distribution */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{p.name} plan</span>
              <Badge color={p.name === 'Pro' ? 'blue' : p.name === 'Enterprise' ? 'purple' : 'gray'}>
                {planCount[p.name.toLowerCase()] ?? 0} orgs
              </Badge>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{p.price}<span className="text-sm font-normal text-gray-400">{p.period}</span></p>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl bg-white p-6 shadow-sm ${p.highlight ? 'ring-2 ring-black' : ''}`}
          >
            {p.highlight && (
              <span className="mb-3 inline-block rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
            <p className="mt-1">
              <span className="text-3xl font-bold">{p.price}</span>
              <span className="text-sm text-gray-400">{p.period}</span>
            </p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-green-500" /> {f}
                </li>
              ))}
            </ul>
            <Button variant={p.highlight ? 'primary' : 'secondary'} className="mt-5 w-full">
              <CreditCard size={15} /> {p.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
            </Button>
          </div>
        ))}
      </div>

      {/* Per-org table */}
      {orgs.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Plan</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
