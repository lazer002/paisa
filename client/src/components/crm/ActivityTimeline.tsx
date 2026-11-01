import { useMemo, useState } from 'react'
import { Phone, Mail, Users, StickyNote, Trash2, Plus, CheckCircle2, Circle, Activity, Pencil } from 'lucide-react'

import {
  useGetCrmActivitiesQuery,
  useCreateCrmActivityMutation,
  useDeleteCrmActivityMutation,
  useGetCrmNotesQuery,
  useCreateCrmNoteMutation,
  useDeleteCrmNoteMutation,
  useUpdateCrmActivityMutation,
  useUpdateCrmNoteMutation,
  useGetCrmTasksQuery,
  useCompleteCrmTaskMutation,
  type CrmActivity,
  type CrmParentFilter,
} from '@/features/crm/crmApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import { Field, inputCls, Toast } from '@/components/ui/kit'
import TaskFormModal from './TaskFormModal'

type LogKind = 'call' | 'email' | 'meeting'

const LOG_META: Record<LogKind, { label: string; channel: string; icon: typeof Phone }> = {
  call: { label: 'Log call', channel: 'phone', icon: Phone },
  email: { label: 'Log email', channel: 'email', icon: Mail },
  meeting: { label: 'Log meeting', channel: 'in_person', icon: Users },
}

// Subset of CRMActivity.js OUTCOMES.
const OUTCOMES = ['connected', 'not_connected', 'interested', 'not_interested', 'callback_requested', 'meeting_booked', 'follow_up_required', 'other']

const ICON: Record<string, typeof Phone> = { call: Phone, email: Mail, meeting: Users, note: StickyNote }

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''

const OPEN = ['pending', 'in_progress', 'deferred', 'overdue']

/** Timeline of activities + notes (and open tasks) for one lead / deal. */
export default function ActivityTimeline({ parent }: { parent: CrmParentFilter }) {
  const { can } = usePermission()
  const me = useAppSelector((s) => s.auth.user)
  const myId = me?.publicId ?? me?._id

  const canReadAct = can('crm_activity:read')
  const canLog = can('crm_activity:create')
  const canReadNotes = can('crm_note:read')
  const canNote = can('crm_note:create')
  const canReadTasks = can('crm_task:read')
  const canTask = can('crm_task:create')
  const canUpdateTask = can('crm_task:update')

  const { data: activities, isLoading: loadingAct } = useGetCrmActivitiesQuery(parent, { skip: !canReadAct })
  const { data: notes, isLoading: loadingNotes } = useGetCrmNotesQuery(parent, { skip: !canReadNotes })
  const { data: tasks } = useGetCrmTasksQuery({ ...parent, status: OPEN.join(',') }, { skip: !canReadTasks })

  const [createActivity, { isLoading: logging }] = useCreateCrmActivityMutation()
  const [deleteActivity] = useDeleteCrmActivityMutation()
  const [createNote, { isLoading: noting }] = useCreateCrmNoteMutation()
  const [deleteNote] = useDeleteCrmNoteMutation()
  const [updateActivity] = useUpdateCrmActivityMutation()
  const [updateNote] = useUpdateCrmNoteMutation()
  const [completeTask] = useCompleteCrmTaskMutation()

  const [logKind, setLogKind] = useState<LogKind | null>(null)
  const [subject, setSubject] = useState('')
  const [outcome, setOutcome] = useState('')
  const [details, setDetails] = useState('')
  const [noteText, setNoteText] = useState('')
  const [taskOpen, setTaskOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const notify = (msg: string, tone: 'success' | 'critical' = 'success') => setToast({ msg, tone })
  const errMsg = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message ?? fallback

  const timeline = useMemo(
    () =>
      [...(activities ?? []), ...(notes ?? [])].sort(
        (a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime(),
      ),
    [activities, notes],
  )

  const startLog = (kind: LogKind) => {
    setLogKind(kind)
    setSubject('')
    setOutcome('')
    setDetails('')
  }

  const submitLog = async () => {
    if (!logKind) return
    try {
      await createActivity({
        ...parent,
        type: logKind,
        channel: LOG_META[logKind].channel,
        status: 'completed',
        subject: subject.trim() || LOG_META[logKind].label.replace('Log ', '').replace(/^./, (c) => c.toUpperCase()),
        outcome: outcome || undefined,
        description: details.trim() || undefined,
      }).unwrap()
      setLogKind(null)
      notify('Activity logged')
    } catch (e) {
      notify(errMsg(e, 'Failed to log activity'), 'critical')
    }
  }

  const submitNote = async () => {
    if (!noteText.trim()) return
    try {
      await createNote({ ...parent, body: noteText.trim() }).unwrap()
      setNoteText('')
      notify('Note added')
    } catch (e) {
      notify(errMsg(e, 'Failed to add note'), 'critical')
    }
  }

  const isMine = (item: CrmActivity) => !!myId && (item.createdBy?.publicId ?? item.createdBy?._id) === myId

  const canDeleteItem = (item: CrmActivity) => {
    const isNote = item.type === 'note'
    if (can(isNote ? 'crm_note:delete' : 'crm_activity:delete')) return true
    return isMine(item) && (isNote ? canNote : canLog)
  }

  // Same rule as the server: managers edit anything, others their own entries.
  const canEditItem = (item: CrmActivity) => {
    const isNote = item.type === 'note'
    if (can(isNote ? 'crm_note:manage' : 'crm_activity:manage')) return true
    return isMine(item) && can(isNote ? 'crm_note:update' : 'crm_activity:update')
  }

  const [editing, setEditing] = useState<CrmActivity | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editOutcome, setEditOutcome] = useState('')
  const [editText, setEditText] = useState('')

  const startEdit = (item: CrmActivity) => {
    setEditing(item)
    setEditSubject(item.subject ?? '')
    setEditOutcome(item.outcome ?? '')
    setEditText(item.description ?? (item.type === 'note' ? item.subject ?? '' : ''))
  }

  const saveEdit = async () => {
    if (!editing) return
    const id = editing.publicId ?? editing._id
    try {
      if (editing.type === 'note') {
        if (!editText.trim()) return
        await updateNote({ id, changes: { body: editText.trim() } }).unwrap()
      } else {
        await updateActivity({
          id,
          changes: {
            subject: editSubject.trim() || editing.subject,
            outcome: editOutcome || undefined,
            description: editText.trim() || undefined,
          },
        }).unwrap()
      }
      setEditing(null)
      notify('Updated')
    } catch (e) {
      notify(errMsg(e, 'Failed to update'), 'critical')
    }
  }

  const removeItem = async (item: CrmActivity) => {
    if (!window.confirm('Delete this entry?')) return
    try {
      const id = item.publicId ?? item._id
      if (item.type === 'note') await deleteNote(id).unwrap()
      else await deleteActivity(id).unwrap()
      notify('Deleted')
    } catch (e) {
      notify(errMsg(e, 'Failed to delete'), 'critical')
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      {(canLog || canTask) && (
        <div className="flex flex-wrap gap-2">
          {canLog &&
            (Object.keys(LOG_META) as LogKind[]).map((k) => {
              const Icon = LOG_META[k].icon
              return (
                <Button key={k} size="sm" variant={logKind === k ? 'primary' : 'secondary'} onClick={() => startLog(k)}>
                  <Icon size={13} /> {LOG_META[k].label}
                </Button>
              )
            })}
          {canTask && (
            <Button size="sm" variant="secondary" onClick={() => setTaskOpen(true)}>
              <Plus size={13} /> Follow-up task
            </Button>
          )}
        </div>
      )}

      {logKind && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject">
              <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={LOG_META[logKind].label.replace('Log ', '')} />
            </Field>
            <Field label="Outcome">
              <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option value="">—</option>
                {OUTCOMES.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Details">
            <textarea className={inputCls} rows={2} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setLogKind(null)}>Cancel</Button>
            <Button size="sm" onClick={submitLog} disabled={logging}>Save</Button>
          </div>
        </div>
      )}

      {canNote && (
        <div className="flex gap-2">
          <textarea
            className={`${inputCls} flex-1`}
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
          />
          <Button size="sm" onClick={submitNote} disabled={noting || !noteText.trim()}>
            <StickyNote size={13} /> Add note
          </Button>
        </div>
      )}

      {/* Open tasks */}
      {canReadTasks && (tasks?.length ?? 0) > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Open tasks</p>
          <ul className="space-y-1">
            {tasks!.map((t) => {
              const overdue = !!t.isOverdue
              return (
                <li key={t.publicId ?? t._id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm">
                  <button
                    disabled={!canUpdateTask}
                    onClick={() =>
                      completeTask({ id: t.publicId ?? t._id, completed: true })
                        .unwrap()
                        .then(() => notify('Task completed'))
                        .catch(() => notify('Failed to complete task', 'critical'))
                    }
                    className="text-gray-400 hover:text-emerald-600 disabled:opacity-50"
                    title="Mark complete"
                  >
                    {t.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <span className="flex-1 text-gray-800">{t.title}</span>
                  {t.dueAt && <span className={`text-xs ${overdue ? 'font-medium text-rose-600' : 'text-gray-400'}`}>{overdue ? 'Overdue · ' : ''}{fmt(t.dueAt)}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Timeline</p>
        {loadingAct || loadingNotes ? (
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ) : timeline.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">No activity yet</p>
        ) : (
          <ol className="relative space-y-3 border-l border-gray-200 pl-4">
            {timeline.map((item) => {
              const Icon = ICON[item.type] ?? Activity
              return (
                <li key={item.publicId ?? item._id} className="group relative">
                  <span className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                    <Icon size={10} className="text-gray-500" />
                  </span>
                  {editing && (editing.publicId ?? editing._id) === (item.publicId ?? item._id) ? (
                    <div className="space-y-2 rounded-lg border border-gray-200 p-2">
                      {item.type !== 'note' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputCls} value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Subject" />
                          <select className={inputCls} value={editOutcome} onChange={(e) => setEditOutcome(e.target.value)}>
                            <option value="">No outcome</option>
                            {OUTCOMES.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                      )}
                      <textarea
                        className={inputCls}
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder={item.type === 'note' ? 'Note' : 'Details'}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button size="sm" onClick={saveEdit}>Save</Button>
                      </div>
                    </div>
                  ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {item.type === 'note' ? (
                          <span className="whitespace-pre-wrap">{item.description ?? item.subject}</span>
                        ) : (
                          <>
                            <span className="font-medium">{item.subject}</span>
                            {item.outcome && <span className="ml-1.5 text-xs capitalize text-gray-500">· {item.outcome.replace(/_/g, ' ')}</span>}
                          </>
                        )}
                      </p>
                      {item.type !== 'note' && item.description && (
                        <p className="mt-0.5 whitespace-pre-wrap text-xs text-gray-600">{item.description}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        <span className="capitalize">{item.type.replace(/_/g, ' ')}</span>
                        {item.createdBy?.name ? ` · ${item.createdBy.name}` : ''} · {fmt(item.completedAt ?? item.createdAt)}
                      </p>
                    </div>
                    {canEditItem(item) && (
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded p-1 text-gray-300 opacity-0 transition hover:text-gray-700 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {canDeleteItem(item) && (
                      <button
                        onClick={() => removeItem(item)}
                        className="rounded p-1 text-gray-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {taskOpen && (
        <TaskFormModal
          open
          parent={parent}
          onClose={() => setTaskOpen(false)}
          onSaved={(msg) => notify(msg)}
          onError={(msg) => notify(msg, 'critical')}
        />
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
