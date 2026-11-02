import { Monitor, LogOut } from 'lucide-react'

import { describeDevice, timeAgo, type SessionInfo } from './device'

/** Rows of signed-in devices; `onRevoke` adds a sign-out button per row. */
export default function SessionList({
  sessions,
  onRevoke,
  busyId,
}: {
  sessions: SessionInfo[]
  onRevoke?: (session: SessionInfo) => void
  busyId?: string | null
}) {
  if (sessions.length === 0) {
    return <p className="py-4 text-sm text-gray-400">No active sessions.</p>
  }

  return (
    <ul className="divide-y divide-gray-100">
      {sessions.map((s) => (
        <li key={s.id} className="flex items-center gap-3 py-3">
          <Monitor size={18} className="shrink-0 text-gray-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {describeDevice(s.userAgent)}
              {s.current && <span className="ml-2 text-xs font-normal text-emerald-700">This device</span>}
            </p>
            <p className="truncate text-xs text-gray-500">
              {s.ip ?? 'Unknown IP'} · active {timeAgo(s.lastUsedAt)} · signed in {new Date(s.createdAt).toLocaleDateString()}
            </p>
          </div>
          {onRevoke && (
            <button
              type="button"
              disabled={busyId === s.id}
              onClick={() => onRevoke(s)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <LogOut size={12} /> {s.current ? 'Sign out' : 'Sign out device'}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
