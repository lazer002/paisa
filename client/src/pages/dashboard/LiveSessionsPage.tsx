import { useMemo, useState } from 'react'
import { Plus, Video, Trash2, Play, Square, ExternalLink } from 'lucide-react'

import {
  useGetLiveSessionsQuery,
  useCreateLiveSessionMutation,
  useUpdateLiveSessionMutation,
  useDeleteLiveSessionMutation,
  type LiveSession,
} from '@/features/messaging/messagingApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  Tabs, StatusBadge, ModalShell, Field, inputCls, Toast,
} from '@/components/ui/kit'

const HOST_ROLES = ['super_admin', 'admin', 'principal', 'teacher']

function fmtWhen(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Bucket = 'upcoming' | 'live' | 'past'

export default function LiveSessionsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role ?? ''

  const canHost = HOST_ROLES.includes(role)

  const [tab, setTab] = useState<Bucket>('upcoming')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: sessions, isLoading, isError, refetch } = useGetLiveSessionsQuery()
  const canPickClass = ['super_admin', 'admin', 'principal', 'teacher'].includes(role)
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canPickClass })

  const [createSession] = useCreateLiveSessionMutation()
  const [updateSession] = useUpdateLiveSessionMutation()
  const [deleteSession] = useDeleteLiveSessionMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classId, setClassId] = useState('')
  const [joinUrl, setJoinUrl] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')

  const buckets = useMemo(() => {
    const b: Record<Bucket, LiveSession[]> = { upcoming: [], live: [], past: [] }
    for (const s of sessions ?? []) {
      if (s.status === 'live') b.live.push(s)
      else if (s.status === 'completed' || s.status === 'cancelled') b.past.push(s)
      else b.upcoming.push(s)
    }
    return b
  }, [sessions])

  const submit = async () => {
    if (!title.trim() || !startAt) return
    try {
      await createSession({
        title: title.trim(),
        description: description.trim() || undefined,
        classId: classId || undefined,
        joinUrl: joinUrl.trim() || undefined,
        scheduledStartAt: new Date(startAt).toISOString(),
        scheduledEndAt: endAt ? new Date(endAt).toISOString() : undefined,
      }).unwrap()
      setShowCreate(false)
      setTitle(''); setDescription(''); setClassId(''); setJoinUrl(''); setStartAt(''); setEndAt('')
      setToast({ msg: 'Session scheduled', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to schedule', tone: 'critical' })
    }
  }

  const setStatus = async (s: LiveSession, status: string) => {
    try {
      await updateSession({ id: rid(s), payload: { status } }).unwrap()
      setToast({ msg: `Session ${status}`, tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Update failed', tone: 'critical' })
    }
  }

  const remove = async (s: LiveSession) => {
    try {
      await deleteSession(rid(s)).unwrap()
      setToast({ msg: 'Session deleted', tone: 'success' })
    } catch {
      setToast({ msg: 'Delete failed', tone: 'critical' })
    }
  }

  const isHost = (s: LiveSession) =>
    typeof s.hostUserId === 'object' && s.hostUserId?._id === user?._id

  const canModerate = (s: LiveSession) =>
    ['super_admin', 'admin', 'principal'].includes(role) || (canHost && isHost(s))

  const renderList = (items: LiveSession[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Video size={26} className="mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
      )
    }
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((s) => (
          <div
            key={s.publicId ?? s._id}
            className={`rounded-xl border p-4 transition ${
              s.status === 'live'
                ? 'border-rose-200 bg-rose-50/50'
                : 'border-gray-200 bg-white hover:shadow-sm'
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{s.title}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {typeof s.classId === 'object' && s.classId?.name ? `${s.classId.name} · ` : ''}
                  {fmtWhen(s.scheduledStartAt)}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </div>

            {s.description && (
              <p className="mb-3 line-clamp-2 text-xs text-gray-500">{s.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {s.joinUrl && s.status !== 'completed' && s.status !== 'cancelled' && (
                <a
                  href={s.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700"
                >
                  <ExternalLink size={12} /> Join
                </a>
              )}

              {canModerate(s) && s.status === 'scheduled' && (
                <button
                  onClick={() => setStatus(s, 'live')}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Play size={12} /> Start
                </button>
              )}

              {canModerate(s) && s.status === 'live' && (
                <button
                  onClick={() => setStatus(s, 'completed')}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Square size={12} /> End
                </button>
              )}

              {canModerate(s) && s.status !== 'live' && (
                <button
                  onClick={() => remove(s)}
                  className="ml-auto rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Live Sessions"
        subtitle="Scheduled live classes and meetings"
        actions={
          canHost ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Schedule
            </Button>
          ) : undefined
        }
      />

      <Tabs<Bucket>
        tabs={[
          { id: 'upcoming', label: 'Upcoming', count: buckets.upcoming.length },
          { id: 'live', label: 'Live now', count: buckets.live.length },
          { id: 'past', label: 'Past', count: buckets.past.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading sessions...</p>
      ) : isError ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">Could not load sessions</p>
          <Button variant="secondary" className="mt-2" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        renderList(
          buckets[tab],
          tab === 'live'
            ? 'Nothing is live right now'
            : tab === 'upcoming'
              ? 'No sessions scheduled yet'
              : 'No past sessions',
        )
      )}

      {/* Schedule modal */}
      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Schedule Live Session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!title.trim() || !startAt}>Schedule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 — Algebra review" />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will be covered?" />
          </Field>
          {canPickClass && (
            <Field label="Class (optional)">
              <select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">— No class —</option>
                {(classes ?? []).map((c) => (
                  <option key={rid(c)} value={rid(c)}>{c.name}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Join URL (Zoom/Meet link, optional)">
            <input className={inputCls} value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://meet.google.com/..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at" required>
              <input type="datetime-local" className={inputCls} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </Field>
            <Field label="Ends at (optional)">
              <input type="datetime-local" className={inputCls} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </Field>
          </div>
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
