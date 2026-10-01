import { useMemo, useState } from 'react'
import { Plus, CalendarDays, MapPin, Clock, Trash2 } from 'lucide-react'

import {
  useGetEventsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
  type CalendarEvent,
} from '@/features/platform/platformApi'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import { SectionCard, ModalShell, Field, inputCls, Toast, StatusBadge } from '@/components/ui/kit'

export default function EventsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canCreate = ['super_admin', 'admin', 'hr'].includes(user?.role ?? '')

  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: events, isLoading, isError, refetch } = useGetEventsQuery()

  const [createEvent] = useCreateEventMutation()
  const [deleteEvent] = useDeleteEventMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [location, setLocation] = useState('')
  const [eventType, setEventType] = useState('meeting')

  // "Now" is snapshotted when the events data changes, keeping the
  // upcoming/past split stable across re-renders.
  const now = useMemo(() => Date.now(), [events])

  const { upcoming, past } = useMemo(() => {
    const sorted = [...(events ?? [])].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    return {
      upcoming: sorted.filter((e) => new Date(e.startsAt).getTime() >= now),
      past: sorted.filter((e) => new Date(e.startsAt).getTime() < now).reverse(),
    }
  }, [events, now])

  const submit = async () => {
    if (!title || !startsAt) return
    try {
      await createEvent({
        title,
        description: description || undefined,
        startsAt,
        endsAt: endsAt || undefined,
        location: location || undefined,
        type: eventType,
      }).unwrap()
      setShowCreate(false)
      setTitle(''); setDescription(''); setStartsAt(''); setEndsAt(''); setLocation('')
      setToast({ msg: 'Event scheduled', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create event', tone: 'critical' })
    }
  }

  const remove = async (e: CalendarEvent) => {
    try {
      await deleteEvent(rid(e)).unwrap()
      setToast({ msg: 'Event deleted', tone: 'success' })
    } catch {
      setToast({ msg: 'Delete failed', tone: 'critical' })
    }
  }

  const EventRow = ({ e, dim }: { e: CalendarEvent; dim?: boolean }) => (
    <div className={`flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-gray-200 ${dim ? 'opacity-55' : ''}`}>
      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 text-white">
        <span className="text-base font-bold leading-none">{new Date(e.startsAt).getDate()}</span>
        <span className="text-[10px] uppercase opacity-70">
          {new Date(e.startsAt).toLocaleString(undefined, { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{e.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {new Date(e.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
          {e.location && (
            <span className="flex items-center gap-1"><MapPin size={11} /> {e.location}</span>
          )}
          <span className="capitalize">{e.type}</span>
        </div>
      </div>
      <StatusBadge status={e.status} />
      {canCreate && (
        <button
          onClick={() => remove(e)}
          className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Events"
        subtitle="Your organization calendar"
        actions={canCreate ? <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Event</Button> : undefined}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <SectionCard>
          <div className="py-8 text-center">
            <CalendarDays size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-500">Failed to load events</p>
            <Button variant="secondary" className="mt-3" onClick={() => refetch()}>Retry</Button>
          </div>
        </SectionCard>
      ) : (
        <>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Upcoming ({upcoming.length})
            </h2>
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
                  <CalendarDays size={32} className="mb-2 text-gray-200" />
                  <p className="text-sm text-gray-500">No upcoming events</p>
                  {canCreate && (
                    <Button className="mt-3" onClick={() => setShowCreate(true)}><Plus size={15} /> Schedule one</Button>
                  )}
                </div>
              ) : (
                upcoming.map((e) => <EventRow key={rid(e)} e={e} />)
              )}
            </div>
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Past ({past.length})
              </h2>
              <div className="space-y-2">
                {past.slice(0, 8).map((e) => <EventRow key={rid(e)} e={e} dim />)}
              </div>
            </div>
          )}
        </>
      )}

      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit}>Schedule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Parent–Teacher Meeting" />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at" required>
              <input type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </Field>
            <Field label="Ends at">
              <input type="datetime-local" className={inputCls} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main hall / Online" />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={eventType} onChange={(e) => setEventType(e.target.value)}>
                {['meeting', 'exam', 'holiday', 'workshop', 'ceremony', 'deadline', 'other'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
