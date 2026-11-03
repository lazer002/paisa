import { useCallback, useEffect, useState } from 'react'
import { Gift, Plus, Trash2, Zap } from 'lucide-react'

import api from '@/lib/api/axios'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { inputCls } from '@/components/ui/kit'

interface Reward {
  publicId: string
  name: string
  description?: string | null
  cost: number
  stock: number | null
  status: 'active' | 'inactive'
}

interface Redemption {
  publicId: string
  rewardName: string
  cost: number
  status: 'requested' | 'fulfilled' | 'cancelled'
  userId?: { name?: string; userCode?: string } | string
  note?: string | null
  createdAt: string
}

const errText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

/** Spend points on rewards; managers keep the catalog and hand rewards over. */
export default function RewardsPanel() {
  const { canAny } = usePermission()
  const canManage = canAny('achievement:create', 'achievement:manage')

  const [rewards, setRewards] = useState<Reward[]>([])
  const [points, setPoints] = useState(0)
  const [requests, setRequests] = useState<Redemption[]>([])
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [form, setForm] = useState({ name: '', cost: '100', stock: '', description: '' })

  const load = useCallback(
    () =>
      Promise.all([api.get('/gamification/rewards'), api.get('/gamification/redemptions')])
        .then(([r, d]) => {
          setRewards(r.data.data)
          setPoints(r.data.meta?.myPoints ?? 0)
          setRequests(d.data.data)
        })
        .catch((e) => setMessage({ text: errText(e, 'Could not load rewards'), ok: false })),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn: () => Promise<{ data: { message: string } }>) => {
    setMessage(null)
    try {
      const res = await fn()
      setMessage({ text: res.data.message, ok: true })
      await load()
    } catch (e) {
      setMessage({ text: errText(e, 'That did not work'), ok: false })
    }
  }

  const create = () =>
    form.name.trim() &&
    run(async () => {
      const res = await api.post('/gamification/rewards', {
        name: form.name.trim(),
        cost: Number(form.cost) || 1,
        stock: form.stock === '' ? null : Number(form.stock),
        description: form.description.trim() || undefined,
      })
      setForm({ name: '', cost: '100', stock: '', description: '' })
      return res
    })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <Zap size={18} className="text-amber-500" />
        <span className="text-sm text-gray-700">You have <b>{points}</b> points to spend.</span>
        {message && <span className={`ml-auto text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{message.text}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.length === 0 && <p className="text-sm text-gray-400">No rewards yet.</p>}
        {rewards.map((r) => (
          <div key={r.publicId} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-medium text-gray-900"><Gift size={16} className="text-amber-500" /> {r.name}</p>
              {r.status === 'inactive' && <Badge color="gray">inactive</Badge>}
            </div>
            {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
            <p className="text-xs text-gray-500">
              <b className="text-amber-700">{r.cost} points</b> · {r.stock === null ? 'unlimited' : `${r.stock} left`}
            </p>
            <div className="mt-auto flex gap-2">
              <Button
                size="sm"
                disabled={r.status !== 'active' || points < r.cost || r.stock === 0}
                onClick={() => run(() => api.post(`/gamification/rewards/${r.publicId}/redeem`))}
              >
                Redeem
              </Button>
              {canManage && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => run(() => api.put(`/gamification/rewards/${r.publicId}`, { status: r.status === 'active' ? 'inactive' : 'active' }))}>
                    {r.status === 'active' ? 'Hide' : 'Show'}
                  </Button>
                  <button
                    onClick={() => window.confirm(`Delete "${r.name}"?`) && run(() => api.delete(`/gamification/rewards/${r.publicId}`))}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete reward"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {canManage && (
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">New reward</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <input className={inputCls} placeholder="Name, e.g. Library pass" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputCls} type="number" min={1} placeholder="Cost (points)" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <input className={inputCls} type="number" min={0} placeholder="Stock (blank = unlimited)" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <Button onClick={create} disabled={!form.name.trim()}><Plus size={14} /> Add</Button>
          </div>
          <input className={inputCls} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      )}

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">{canManage ? 'Reward requests' : 'My requests'}</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-400">No requests yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {requests.map((q) => (
              <li key={q.publicId} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900">{q.rewardName}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {typeof q.userId === 'object' && q.userId?.name ? `${q.userId.name} · ` : ''}
                    {q.cost} points · {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </span>
                <Badge color={q.status === 'fulfilled' ? 'green' : q.status === 'cancelled' ? 'gray' : 'yellow'}>{q.status}</Badge>
                {canManage && q.status === 'requested' && (
                  <>
                    <Button size="sm" onClick={() => run(() => api.post(`/gamification/redemptions/${q.publicId}/handle`, { action: 'fulfil' }))}>Hand over</Button>
                    <Button size="sm" variant="secondary" onClick={() => run(() => api.post(`/gamification/redemptions/${q.publicId}/handle`, { action: 'cancel' }))}>Cancel &amp; refund</Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
