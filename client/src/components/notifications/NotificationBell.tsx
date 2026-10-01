import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Archive } from 'lucide-react'

import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useArchiveNotificationMutation,
  type NotificationItem,
} from '@/features/notifications/notificationsApi'
import { useAppSelector } from '@/app/store'

const DOT_BY_TYPE: Record<string, string> = {
  announcement: 'bg-sky-500',
  assignment: 'bg-indigo-500',
  test: 'bg-violet-500',
  attendance: 'bg-emerald-500',
  leave: 'bg-amber-500',
  payroll: 'bg-emerald-600',
  message: 'bg-rose-500',
  ticket: 'bg-orange-500',
  achievement: 'bg-yellow-500',
  system: 'bg-gray-400',
}

export default function NotificationBell() {
  const user = useAppSelector((s) => s.auth.user)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const { data } = useGetNotificationsQuery()
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()
  const [archive] = useArchiveNotificationMutation()

  const unread = data?.unreadCount ?? 0
  const items = (data?.items ?? []).slice(0, 8)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-700">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                You're all caught up 🎉
              </p>
            )}
            {items.map((n: NotificationItem) => {
              const isUnread = n.status === 'unread'
              return (
                <div
                  key={n.publicId ?? n._id}
                  className={`flex items-start gap-2.5 border-b border-gray-50 px-4 py-3 ${
                    isUnread ? 'bg-sky-50/40' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      isUnread ? DOT_BY_TYPE[n.type] ?? 'bg-sky-500' : 'bg-gray-200'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isUnread && (
                        <button
                          onClick={() => markRead(n.publicId ?? n._id)}
                          className="text-[10px] font-medium text-sky-600 hover:text-sky-700"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => archive(n.publicId ?? n._id)}
                        className="ml-auto text-gray-300 hover:text-gray-500"
                        title="Archive"
                      >
                        <Archive size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
