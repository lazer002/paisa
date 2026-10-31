import { useState } from 'react'

import {
  useCreateCrmTaskMutation,
  useUpdateCrmTaskMutation,
  type CrmParentFilter,
  type CrmTask,
  type CrmTaskPayload,
} from '@/features/crm/crmApi'
import { useGetUsersQuery } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import { ModalShell, Field, inputCls } from '@/components/ui/kit'

// Keys must match CRMTask.js enums.
const TASK_TYPES = ['follow_up', 'call', 'email', 'meeting', 'demo', 'proposal', 'document', 'review', 'internal', 'other']
const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent']
const TASK_STATUSES =['pending', 'in_progress', 'deferred', 'completed', 'cancelled']

const label = (s: string) => s.replace(/_/g, ' ')

/** `datetime-local` value from an ISO string (local time). */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  open: boolean
  onClose: () => void
  /** Task to edit; omit to create. */
  task?: CrmTask | null
  /** Lead/deal the new task is linked to. */
  parent?: CrmParentFilter
  onSaved?: (msg: string) => void
  onError?: (msg: string) => void
}

/** Create / edit a CRM task. Mount with a `key` so the form resets per task. */
export default function TaskFormModal({ open, onClose, task, parent, onSaved, onError }: Props) {
  const { can } = usePermission()
  const canPickAssignee = can('user:read')
  const { data: users } = useGetUsersQuery({ status: 'active' }, { skip: !open || !canPickAssignee })

  const [createTask, { isLoading: creating }] = useCreateCrmTaskMutation()
  const [updateTask, { isLoading: updating }] = useUpdateCrmTaskMutation()

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [type, setType] = useState(task?.type ?? 'follow_up')
  const [priority, setPriority] = useState(task?.priority ?? 'normal')
  const [status, setStatus] = useState(task?.status ?? 'pending')
  const [dueAt, setDueAt] = useState(toLocalInput(task?.dueAt))
  const [assignee, setAssignee] = useState(task?.ownerId?.publicId ?? '')

  const submit = async () => {
    if (!title.trim()) return
    const payload: CrmTaskPayload = {
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      ...(assignee ? { assignee } : {}),
    }
    try {
      if (task) {
        await updateTask({ id: task.publicId ?? task._id, changes: { ...payload, status } }).unwrap()
        onSaved?.('Task updated')
      } else {
        await createTask({ ...payload, ...parent }).unwrap()
        onSaved?.('Task created')
      }
      onClose()
    } catch (e: unknown) {
      onError?.((e as { data?: { message?: string } })?.data?.message ?? 'Failed to save task')
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={creating || updating || !title.trim()}>
            {task ? 'Save' : 'Create Task'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call back about fee structure" />
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
            </select>
          </Field>
          <Field label="Due">
            <input type="datetime-local" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
          {task && (
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </Field>
          )}
          {canPickAssignee && (
            <Field label="Assign to">
              <select className={inputCls} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">{task ? 'Unchanged' : 'Me'}</option>
                {(users ?? []).map((u) => (
                  <option key={u.publicId ?? u._id} value={u.publicId ?? u._id}>
                    {u.name} ({label(String(u.role))})
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>
    </ModalShell>
  )
}
