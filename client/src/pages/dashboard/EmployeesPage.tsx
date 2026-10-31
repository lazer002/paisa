import { useState } from 'react'
import { Briefcase, Plus, Pencil, Trash2, Search, ListChecks } from 'lucide-react'

import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  LIFECYCLE_STAGES,
  type Person,
} from '@/features/people/peopleApi'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/Modal'
import ExportMenu from '@/components/ui/ExportMenu'
import EmployeeLifecyclePanel from '@/components/employees/EmployeeLifecyclePanel'
import { StageBadge } from '@/components/employees/stage'
import { stageLabel } from '@/components/employees/stageMeta'
import { fmtDate, humanize, type ExportColumn } from '@/lib/export'

const orgNameOf = (p: Person) =>
  typeof p.instituteId === 'object' ? p.instituteId?.name ?? '—' : 'Platform'

const EXPORT_COLUMNS: ExportColumn<Person>[] = [
  { header: 'Name', value: (p) => p.name },
  { header: 'Email', value: (p) => p.email },
  { header: 'Code', value: (p) => p.userCode ?? '' },
  { header: 'Organization', value: (p) => orgNameOf(p) },
  { header: 'Stage', value: (p) => stageLabel(p.lifecycleStage) },
  {
    header: 'Exit type',
    value: (p) => (p.lifecycleStage === 'exited' ? humanize(p.employmentStatus) : ''),
  },
  { header: 'Joined', value: (p) => fmtDate(p.joiningDate) },
  { header: 'Last working day', value: (p) => fmtDate(p.lastWorkingDate) },
  { header: 'Account status', value: (p) => humanize(p.status ?? 'active') },
  { header: 'Created', value: (p) => fmtDate(p.createdAt) },
]

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:bg-white'
const labelCls = 'mb-1 block text-sm font-medium text-gray-700'

function CreateEmployeeModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const submit = async () => {
    setError('')
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Name, email and a password of at least 8 characters are required.')
      return
    }
    try {
      await createEmployee({ name: name.trim(), email: email.trim(), password }).unwrap()
      setName('')
      setEmail('')
      setPassword('')
      onClose()
    } catch (e) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? 'Could not create employee.',
      )
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add employee" size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Full name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Nair" />
        </div>
        <div>
          <label className={labelCls}>Work email *</label>
          <input
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@company.com"
          />
        </div>
        <div>
          <label className={labelCls}>Password *</label>
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            <Plus size={15} /> Create employee
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditEmployeeModal({
  person,
  onClose,
  onOpenLifecycle,
}: {
  person: Person
  onClose: () => void
  onOpenLifecycle: () => void
}) {
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation()
  const [name, setName] = useState(person.name ?? '')
  const [status, setStatus] = useState(person.status ?? 'active')
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    try {
      await updateEmployee({
        publicId: person.publicId ?? person._id,
        changes: { name: name.trim(), status },
      }).unwrap()
      onClose()
    } catch (e) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? 'Could not update employee.',
      )
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit employee" size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Full name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Login account status</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            Employment stage <StageBadge stage={person.lifecycleStage ?? 'none'} />
          </span>
          <Button variant="ghost" size="sm" onClick={onOpenLifecycle}>
            <ListChecks size={14} /> Stage &amp; checklist
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function EmployeesPage() {
  const { can } = usePermission()
  const { data: employees, isLoading, isError, refetch } = useGetEmployeesQuery()
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null)
  const [lifecycleOf, setLifecycleOf] = useState<Person | null>(null)
  const [stageFilter, setStageFilter] = useState('')

  const canCreate = can('employee:create')
  const canUpdate = can('employee:update')
  const canDelete = can('employee:delete')
  // Server requires both for stage/checklist writes (employee role has update only).
  const canManageLifecycle = canUpdate && can('employee:manage')

  const list: Person[] = (employees ?? []).filter((p) => {
    if (stageFilter && (p.lifecycleStage ?? 'none') !== stageFilter) return false
    if (!search.trim()) return true
    const hay = [p.name, p.email, p.userCode].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(search.toLowerCase().trim())
  })

  const exportSubtitle = [
    stageFilter ? `Stage: ${stageLabel(stageFilter)}` : '',
    search.trim() ? `Search: "${search.trim()}"` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteEmployee(confirmDelete.publicId ?? confirmDelete._id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="People working across your organization"
        actions={
          <div className="flex gap-2">
            <ExportMenu
              title="Employees"
              subtitle={exportSubtitle || undefined}
              columns={EXPORT_COLUMNS}
              rows={list}
            />
            {canCreate && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Add employee
              </Button>
            )}
          </div>
        }
      />

      {(employees?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or code…"
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-black focus:bg-white"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition focus:border-black focus:bg-white"
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {LIFECYCLE_STAGES.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
            <option value="inactive">{stageLabel('inactive')}</option>
            <option value="none">{stageLabel('none')}</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !employees?.length ? (
        <EmptyState
          icon={<Briefcase size={48} />}
          title="No employees yet"
          hint={canCreate ? 'Create your first employee account here.' : 'Ask an admin to add employees.'}
        />
      ) : !list.length ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No matching employees"
          hint="Try a different search term or stage."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => {
                const orgName = orgNameOf(u)
                return (
                  <tr key={u.publicId ?? u._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.userCode ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orgName}</td>
                    <td className="px-4 py-3">
                      <StageBadge stage={u.lifecycleStage ?? 'none'} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.status === 'inactive' ? 'red' : 'green'}>
                        {u.status ?? 'active'}
                      </Badge>
                    </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setLifecycleOf(u)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-black hover:text-black"
                            title="Lifecycle stage and checklist"
                          >
                            <ListChecks size={14} />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => setEditing(u)}
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-black hover:text-black"
                              title="Edit employee"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(u)}
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-300 hover:text-red-600"
                              title="Delete employee"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateEmployeeModal open={showCreate} onClose={() => setShowCreate(false)} />}
      {editing && (
        <EditEmployeeModal
          person={editing}
          onClose={() => setEditing(null)}
          onOpenLifecycle={() => {
            setLifecycleOf(editing)
            setEditing(null)
          }}
        />
      )}
      {lifecycleOf && (
        <Modal
          open
          onClose={() => setLifecycleOf(null)}
          title={`Lifecycle · ${lifecycleOf.name}`}
          size="lg"
        >
          <EmployeeLifecyclePanel
            publicId={lifecycleOf.publicId ?? lifecycleOf._id}
            canManage={canManageLifecycle}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} title="Delete employee?" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This permanently removes <strong>{confirmDelete.name}</strong> (
              {confirmDelete.email}). Their account will no longer be able to sign in.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button onClick={handleDelete} loading={deleting}>
                <Trash2 size={15} /> Delete employee
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
