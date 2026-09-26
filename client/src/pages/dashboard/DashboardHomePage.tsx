import { Building2, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import { useGetUsersQuery } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import Badge from '@/components/ui/badge'
import type { Organization } from '@/features/organizations/types'

const STATUS_COLOR = {
  active: 'green' as const,
  inactive: 'yellow' as const,
  suspended: 'red' as const,
}

export default function DashboardHomePage() {
  const user = useAppSelector((s) => s.auth.user)
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: orgsData, isLoading } = useGetOrganizationsQuery({ page: 1, limit: 6 })

  // Backend scopes this automatically: super_admin → all, admin → own org
  const { data: usersData } = useGetUsersQuery()

  // 🔒 Role-based stat cards — admins never see platform-level Revenue/Activity
  const stats = isSuperAdmin
    ? [
        {
          label: 'Organizations',
          value: isLoading ? '…' : String(orgsData?.total ?? 0),
          icon: Building2,
          color: 'bg-blue-50 text-blue-600',
          link: '/dashboard/organizations',
        },
        {
          label: 'Users',
          value: usersData ? String(usersData.length) : '…',
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
    : [
        {
          label: 'My Organization',
          value: isLoading ? '…' : String(orgsData?.total ?? 0),
          icon: Building2,
          color: 'bg-blue-50 text-blue-600',
          link: '/dashboard/organizations',
        },
        {
          label: 'My Users',
          value: usersData ? String(usersData.length) : '…',
          icon: Users,
          color: 'bg-purple-50 text-purple-600',
          link: '/dashboard/users',
        },
      ]

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-500">
          {isSuperAdmin
            ? "Here's what's happening across your platform"
            : "Here's what's happening in your organization"}
        </p>
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
          <h2 className="font-semibold text-gray-900">
            {isSuperAdmin ? 'Recent Organizations' : 'My Organization'}
          </h2>
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
            {isSuperAdmin && (
              <Link
                to="/dashboard/organizations"
                className="mt-2 inline-block text-sm font-medium text-black hover:underline"
              >
                Create one →
              </Link>
            )}
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

      {/* Quick Links — 🔒 role-based, mirrors the sidebar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {(isSuperAdmin
          ? [
              { label: 'Users', path: '/dashboard/users' },
              { label: 'Employees', path: '/dashboard/employees' },
              { label: 'Payroll', path: '/dashboard/payroll' },
              { label: 'Reports', path: '/dashboard/reports' },
              { label: 'Settings', path: '/dashboard/settings' },
            ]
          : [
              { label: 'Users', path: '/dashboard/users' },
              { label: 'Settings', path: '/dashboard/settings' },
            ]
        ).map((link) => (
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
