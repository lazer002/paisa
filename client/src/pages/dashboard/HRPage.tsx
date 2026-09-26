import { UserCog } from 'lucide-react'
import { useGetHRsQuery, type Person } from '@/features/people/peopleApi'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'

export default function HRPage() {
  const { data: hrs, isLoading, isError, refetch } = useGetHRsQuery()
  const list: Person[] = hrs ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="HR Panel" subtitle="HR managers in your organization" />

      {isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !list.length ? (
        <EmptyState
          icon={<UserCog size={48} />}
          title="No HR managers yet"
          hint="Create HR accounts from the Users page (role: hr)"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u) => (
            <div key={u._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-base font-bold text-white">
                  {u.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{u.name}</h3>
                  <p className="truncate text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{u.userCode ?? '—'}</span>
                <Badge color={u.status === 'inactive' ? 'red' : 'green'}>{u.status ?? 'active'}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
