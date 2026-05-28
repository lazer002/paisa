import { useQuery } from '@tanstack/react-query'
import { Building2, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { orgApi } from '@/features/organizations/api'
import { useAuthStore } from '@/lib/store/authStore'
import Badge from '@/components/ui/Badge'
import type { Organization } from '@/features/organizations/types'

const STATUS_COLOR = {
  active: 'green' as const,
  inactive: 'yellow' as const,
  suspended: 'red' as const,
}

export default function DashboardHomePage() {
  const user = useAuthStore((s) => s.user)

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations', { page: 1, limit: 6 }],
    queryFn: () => orgApi.list({ page: 1, limit: 6 }),
  })

  const stats = [
    {
      label: 'Organizations',
      value: isLoading ? '…' : String(orgsData?.total ?? 0),
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
      link: '/dashboard/organizations',
    },
    {
      label: 'Users',
      value: '—',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      link: '/dashboard/users',
    },
    {
      label: 'Revenue',
      value: '—',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      link: '/dashboard/billing',
    },
    {
      label: 'Activity',
      value: '—',
      icon: Activity,
      color: 'bg-orange-50 text-orange-600',
      link: '/dashboard/reports',
    },
  ]

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-500">Here's what's happening across your platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="group rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Organizations */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Organizations</h2>
          <Link
            to="/dashboard/organizations"
            className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-black"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : !orgsData?.data?.length ? (
          <div className="py-8 text-center">
            <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">No organizations yet</p>
            <Link
              to="/dashboard/organizations"
              className="mt-2 inline-block text-sm font-medium text-black hover:underline"
            >
              Create one →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orgsData.data.map((org: Organization) => (
              <div key={org._id} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                  {org.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{org.name}</p>
                  <p className="text-xs text-gray-400">{org.orgCode} · {org.type}</p>
                </div>
                <Badge color={STATUS_COLOR[org.status] ?? 'gray'}>{org.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Users', path: '/dashboard/users' },
          { label: 'Employees', path: '/dashboard/employees' },
          { label: 'Payroll', path: '/dashboard/payroll' },
          { label: 'Reports', path: '/dashboard/reports' },
          { label: 'Settings', path: '/dashboard/settings' },
        ].map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-black hover:shadow-md"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
