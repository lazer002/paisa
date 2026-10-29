import { useState } from 'react'
import { Bell, Check, Archive } from 'lucide-react'

import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useArchiveNotificationMutation,
} from '@/features/notifications/notificationsApi'
import { rid } from '@/features/users/usersApi'
import Button from '@/components/ui/button'
import { Tabs } from '@/components/ui/kit'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'

type Filter = 'all' | 'unread' | 'read' | 'archived'

/** Full-page view of the signed-in user's notification feed (the bell shows only the latest). */
export default function NotificationsList() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(
    filter === 'all' ? undefined : { status: filter },
  )
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()
  const [archive] = useArchiveNotificationMutation()

  const items = data?.items ?? []
  const unread = data?.unreadCount ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs<Filter>
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread', count: unread },
            { id: 'read', label: 'Read' },
            { id: 'archived', label: 'Archived' },
          ]}
          active={filter}
          onChange={setFilter}
        />
        {unread > 0 && (
          <Button size="sm" variant="secondary" onClick={() => markAllRead()} loading={markingAll}>
            <Check size={14} /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="No notifications" hint="You're all caught up" />
      ) : (
        <div className="divide-y divide-gray-50 rounded-2xl bg-white shadow-sm">
          {items.map((n) => (
            <div key={rid(n)} className="flex items-start gap-3 px-5 py-4">
              <span
                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${n.status === 'unread' ? 'bg-sky-500' : 'bg-transparent'}`}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {n.actorName ? `${n.actorName} · ` : ''}
                  {new Date(n.createdAt).toLocaleString()}
                  {' · '}
                  <span className="capitalize">{n.type.replace(/_/g, ' ')}</span>
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                {n.status === 'unread' && (
                  <button
                    onClick={() => markRead(rid(n))}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-black"
                    title="Mark read"
                  >
                    <Check size={15} />
                  </button>
                )}
                {n.status !== 'archived' && (
                  <button
                    onClick={() => archive(rid(n))}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-black"
                    title="Archive"
                  >
                    <Archive size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
