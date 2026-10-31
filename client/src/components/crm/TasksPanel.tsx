import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, CheckCircle2, Circle } from 'lucide-react'

import {
  useGetCrmTasksQuery,
  useCompleteCrmTaskMutation,
  useDeleteCrmTaskMutation,
  type CrmTask,
  type CrmTaskFilter,
} from '@/features/crm/crmApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import { DataTable, Toolbar, SelectFilter, StatusBadge, Toast, type Column } from '@/components/ui/kit'
import TaskFormModal from './TaskFormModal'
import { parentLabel } from './crmLabels'

const OPEN = ['pending', 'in_progress', 'deferred', 'overdue']

// `isOverdue` is a CRMTask virtual computed by the server.
const isOverdue = (t: CrmTask) => !!t.isOverdue && OPEN.includes(t.status)

const fmtDue = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** CRM tasks: my tasks / all, overdue filter, complete toggle, create / edit. */
export default function TasksPanel() {
  const { can } = usePermission()
  const me = useAppSelector((s) => s.auth.user)
  const myId = me?.publicId ?? me?._id

  const canCreate = can('crm_task:create')
  const canUpdate = can('crm_task:update')
  const canDeleteAny = can('crm_task:delete')

  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [statusFilter, setStatusFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<CrmTask | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const filter: CrmTaskFilter = {
    mine: scope === 'mine',
    overdue: statusFilter === 'overdue',
    status: statusFilter === 'open' ? OPEN.join(',') : statusFilter === 'overdue' ? undefined : statusFilter || undefined,
  }

  const { data: tasks, isLoading, isError, refetch } = useGetCrmTasksQuery(filter)
  const [completeTask] = useCompleteCrmTaskMutation()
  const [deleteTask] = useDeleteCrmTaskMutation()

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = (tasks ?? []).filter((t) => !q || `${t.title} ${t.description ?? ''}`.toLowerCase().includes(q))
    // Server sorts by dueAt ascending, which puts undated tasks first; move them last.
    return [...filtered.filter((t) => t.dueAt), ...filtered.filter((t) => !t.dueAt)]
  }, [tasks, search])

  const overdueCount = (tasks ?? []).filter(isOverdue).length

  const notify = (msg: string, tone: 'success' | 'critical' = 'success') => setToast({ msg, tone })

  const toggle = async (t: CrmTask) => {
    try {
      const done = t.status !== 'completed'
      await completeTask({ id: t.publicId ?? t._id, completed: done }).unwrap()
      notify(done ? 'Task completed' : 'Task reopened')
    } catch {
      notify('Failed to update task', 'critical')
    }
  }

  const remove = async (t: CrmTask) => {
    if (!window.confirm(`Delete task "${t.title}"?`)) return
    try {
      await deleteTask(t.publicId ?? t._id).unwrap()
      notify('Task deleted')
    } catch (e: unknown) {
      notify((e as { data?: { message?: string } })?.data?.message ?? 'Failed to delete task', 'critical')
    }
  }

  const canDelete = (t: CrmTask) =>
    canDeleteAny || (canCreate && !!myId && (t.createdBy?.publicId ?? t.createdBy?._id) === myId)

  const columns: Column<CrmTask>[] = [
    {
      key: 'done',
      header: '',
      className: 'w-8',
      render: (t) => (
        <button
          onClick={() => toggle(t)}
          disabled={!canUpdate}
          title={t.status === 'completed' ? 'Reopen' : 'Mark complete'}
          className="text-gray-400 transition hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} />}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Task',
      render: (t) => (
        <div>
          <p className={`font-medium ${t.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</p>
          <p className="text-xs capitalize text-gray-400">{(t.type ?? '').replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    { key: 'linked', header: 'Linked to', render: (t) => <span className="text-gray-500">{parentLabel(t) || '—'}</span> },
    {
      key: 'due',
      header: 'Due',
      render: (t) => (
        <span className={isOverdue(t) ? 'font-medium text-rose-600' : 'text-gray-600'}>
          {fmtDue(t.dueAt)}
          {isOverdue(t) && <span className="ml-1.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase">Overdue</span>}
        </span>
      ),
    },
    { key: 'assignee', header: 'Assignee', render: (t) => <span className="text-gray-500">{t.ownerId?.name ?? '—'}</span> },
    { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-1">
          {canUpdate && (
            <button onClick={() => setEditing(t)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" title="Edit">
              <Pencil size={14} />
            </button>
          )}
          {canDelete(t) && (
            <button onClick={() => remove(t)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search tasks..."
        filters={
          <>
            <SelectFilter
              label="Scope"
              value={scope}
              onChange={(v) => setScope(v as 'mine' | 'all')}
              options={[
                { value: 'mine', label: 'My tasks' },
                { value: 'all', label: 'All tasks' },
              ]}
            />
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: '', label: 'Any status' },
              ]}
            />
            {overdueCount > 0 && statusFilter !== 'overdue' && (
              <button
                onClick={() => setStatusFilter('overdue')}
                className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
              >
                {overdueCount} overdue
              </button>
            )}
          </>
        }
        actions={canCreate ? <Button onClick={() => setCreating(true)}><Plus size={15} /> New Task</Button> : undefined}
      />

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(t) => t.publicId ?? t._id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle={statusFilter === 'overdue' ? 'Nothing overdue' : 'No tasks'}
        emptyHint="Follow-ups for leads and deals show up here"
      />

      {(creating || editing) && (
        <TaskFormModal
          key={editing?.publicId ?? 'new'}
          open
          task={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={(msg) => notify(msg)}
          onError={(msg) => notify(msg, 'critical')}
        />
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
