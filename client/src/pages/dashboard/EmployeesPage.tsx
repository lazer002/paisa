import { Briefcase } from 'lucide-react'
import { useGetEmployeesQuery, type Person } from '@/features/people/peopleApi'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'

export default function EmployeesPage() {
  const { data: employees, isLoading, isError, refetch } = useGetEmployeesQuery()

  const list: Person[] = employees ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="People working across your organization" />

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !list.length ? (
        <EmptyState
          icon={<Briefcase size={48} />}
          title="No employees yet"
          hint="Create employee accounts from the Users page (role: employee)"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => {
                const orgName = typeof u.instituteId === 'object' ? u.instituteId?.name ?? '—' : 'Platform'
                return (
                  <tr key={u.publicId ?? u._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.userCode ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orgName}</td>
                    <td className="px-4 py-3">
                      <Badge color={u.status === 'inactive' ? 'red' : 'green'}>{u.status ?? 'active'}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
