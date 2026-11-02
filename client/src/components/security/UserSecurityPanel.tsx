import { useCallback, useEffect, useState } from 'react'
import { LogOut, ShieldOff } from 'lucide-react'

import api from '@/lib/api/axios'
import { usePermission } from '@/lib/auth/usePermission'
import SessionList from './SessionList'
import type { SessionInfo } from './device'

const errorText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

/**
 * A manager's view of another user's sign-in security: their devices, sign
 * them out everywhere, reset two-factor sign-in (lost phone). The server
 * limits this to the same organization and lower roles.
 */
export default function UserSecurityPanel({ publicId, name }: { publicId: string; name: string }) {
  const { canAny } = usePermission()
  const allowed = canAny('user:update', 'user:manage')

  const [data, setData] = useState<{ twoFactorEnabled: boolean; sessions: SessionInfo[] } | null>(null)
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () =>
      api
        .get(`/users/${publicId}/sessions`)
        .then((res) => setData(res.data.data))
        .catch((e) => setMessage({ text: errorText(e, 'Could not load sign-in details'), tone: 'error' })),
    [publicId],
  )

  useEffect(() => {
    if (allowed) load()
  }, [allowed, load])

  if (!allowed) return null

  const act = async (path: string, confirmText: string) => {
    if (!window.confirm(confirmText)) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await api.post(`/users/${publicId}/${path}`)
      setMessage({ text: res.data.message, tone: 'ok' })
      await load()
    } catch (e) {
      setMessage({ text: errorText(e, 'That did not work'), tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Sign-in management</h3>
        <p className="text-xs text-slate-500">Devices signed in as {name}, and recovery actions</p>
      </div>
      <div className="space-y-4 px-6 py-4">
        {data && <SessionList sessions={data.sessions.slice(0, 5)} />}
        {data && data.sessions.length > 5 && (
          <p className="text-xs text-slate-500">and {data.sessions.length - 5} more active sessions</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !data?.sessions.length}
            onClick={() => act('sessions/revoke', `Sign ${name} out of every device?`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <LogOut size={14} /> Sign out everywhere
          </button>
          {data?.twoFactorEnabled && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                act('2fa/reset', `Reset two-factor sign-in for ${name}? They will sign in with just their password and should set it up again.`)
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <ShieldOff size={14} /> Reset two-factor sign-in
            </button>
          )}
        </div>
        {message && (
          <p className={`text-sm ${message.tone === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>{message.text}</p>
        )}
      </div>
    </section>
  )
}
