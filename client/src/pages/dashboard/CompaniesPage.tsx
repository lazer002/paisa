import { Building, Building2 } from 'lucide-react'
import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingGrid, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'
import type { Organization } from '@/features/organizations/types'

const STATUS_COLOR = { active: 'green', inactive: 'yellow', suspended: 'red' } as const

export default function CompaniesPage() {
  const { data, isLoading, isError, refetch } = useGetOrganizationsQuery({ limit: 100 })
  const companies = (data?.data ?? []).filter((o: Organization) =>
    ['company', 'startup'].includes(o.type),
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" subtitle="Company and startup organizations on the platform" />

      {isLoading ? (
        <LoadingGrid />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !companies.length ? (
        <EmptyState
          icon={<Building size={48} />}
          title="No companies yet"
          hint="Create an organization with type 'company' or 'startup'"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((o) => (
            <div key={o._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-base font-bold text-white">
                  {o.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{o.name}</h3>
                  <p className="text-xs text-gray-400">{o.orgCode} · {o.type}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <Badge color="blue">{o.type}</Badge>
                  <Badge color={STATUS_COLOR[o.status]}>{o.status}</Badge>
                </div>
                <span className="text-xs text-gray-400">{o.membersCount ?? 1} members</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
