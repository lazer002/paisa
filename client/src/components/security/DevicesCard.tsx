import { useEffect, useState } from 'react'
import { MonitorSmartphone } from 'lucide-react'

import api from '@/lib/api/axios'
import { useAppDispatch } from '@/app/store'
import { logout } from '@/lib/store/authSlice'
import SessionList from './SessionList'
import type { SessionInfo } from './device'

const VISIBLE = 5

/** The signed-in user's own devices, each of which can be signed out. */
export default function DevicesCard() {
  const dispatch = useAppDispatch()
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showAll, setShowAll] = useState(false)

  const load = () =>
    api
      .get('/auth/sessions')
      .then((res) => setSessions(res.data.data))
      .catch(() => setError('Could not load your devices'))

  useEffect(() => {
    load()
  }, [])

  const revokeOthers = async () => {
    setBusyId('others')
    setError('')
    try {
      const res = await api.post('/auth/sessions/revoke-others')
      setNotice(res.data.message)
      await load()
    } catch {
      setError('Could not sign the other devices out')
    } finally {
      setBusyId(null)
    }
  }

  const revoke = async (session: SessionInfo) => {
    setBusyId(session.id)
    setError('')
    try {
      await api.delete(`/auth/sessions/${session.id}`)
      if (session.current) {
        dispatch(logout())
        return
      }
      await load()
    } catch {
      setError('Could not sign that device out')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <MonitorSmartphone size={18} className="text-gray-400" />
        <h3 className="font-semibold text-gray-900">Signed-in devices</h3>
      </div>
      <p className="mb-2 text-sm text-gray-500">Signing a device out takes effect immediately.</p>
      {sessions ? (
        <>
          <SessionList sessions={showAll ? sessions : sessions.slice(0, VISIBLE)} onRevoke={revoke} busyId={busyId} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {sessions.length > VISIBLE && (
              <button type="button" onClick={() => setShowAll(!showAll)} className="text-sm text-gray-600 underline hover:text-black">
                {showAll ? 'Show fewer' : `Show all ${sessions.length}`}
              </button>
            )}
            {sessions.some((s) => !s.current) && (
              <button
                type="button"
                disabled={busyId === 'others'}
                onClick={revokeOthers}
                className="text-sm font-medium text-red-600 underline hover:text-red-700 disabled:opacity-50"
              >
                Sign out all other devices
              </button>
            )}
          </div>
        </>
      ) : (
        !error && <p className="py-4 text-sm text-gray-400">Loading…</p>
      )}
      {notice && <p className="mt-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
