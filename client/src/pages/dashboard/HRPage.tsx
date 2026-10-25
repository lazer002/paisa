import { useState } from 'react'
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react'

import {
  useGetHRsQuery,
  useCreateHRMutation,
  useUpdateHRMutation,
  useDeleteHRMutation,
  type Person,
} from '@/features/people/peopleApi'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/Modal'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:bg-white'
const labelCls = 'mb-1 block text-sm font-medium text-gray-700'

function CreateHRModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [createHR, { isLoading }] = useCreateHRMutation()
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
      await createHR({ name: name.trim(), email: email.trim(), password }).unwrap()
      setName('')
      setEmail('')
      setPassword('')
      onClose()
    } catch (e) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Could not create HR manager.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add HR manager" size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Full name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anita Desai" />
        </div>
        <div>
          <label className={labelCls}>Work email *</label>
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anita@school.com" />
        </div>
        <div>
          <label className={labelCls}>Password *</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading}>
            <Plus size={15} /> Create HR manager
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditHRModal({ person, onClose }: { person: Person; onClose: () => void }) {
  const [updateHR, { isLoading }] = useUpdateHRMutation()
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
      await updateHR({ publicId: person.publicId ?? person._id, changes: { name: name.trim(), status } }).unwrap()
      onClose()
    } catch (e) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Could not update HR manager.')
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit HR manager" size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Full name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading}>Save changes</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function HRPage() {
  const { can } = usePermission()
  const { data: hrs, isLoading, isError, refetch } = useGetHRsQuery()
  const [deleteHR, { isLoading: deleting }] = useDeleteHRMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null)

  const canManage = can('hr:create') || can('hr:update')
  const canCreate = can('hr:create')
  const canDelete = can('hr:delete')

  const list: Person[] = hrs ?? []

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteHR(confirmDelete.publicId ?? confirmDelete._id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Panel"
        subtitle="HR managers in your organization"
        actions={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add HR manager
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !list.length ? (
        <EmptyState
          icon={<UserCog size={48} />}
          title="No HR managers yet"
          hint={
            canCreate
              ? 'Create an HR manager account to handle leaves, payroll and performance reviews.'
              : 'Create HR accounts from the Users page (role: hr)'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u) => (
            <div key={u.publicId ?? u._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-base font-bold text-white">
                  {u.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{u.name}</h3>
                  <p className="truncate text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{u.userCode ?? '—'}</span>
                  <Badge color={u.status === 'inactive' ? 'red' : 'green'}>
                    {u.status ?? 'active'}
                  </Badge>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    {can('hr:update') && (
                      <button
                        onClick={() => setEditing(u)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-black hover:text-black"
                        title="Edit HR manager"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-300 hover:text-red-600"
                        title="Delete HR manager"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateHRModal open={showCreate} onClose={() => setShowCreate(false)} />}
      {editing && <EditHRModal person={editing} onClose={() => setEditing(null)} />}
      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} title="Delete HR manager?" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This permanently removes <strong>{confirmDelete.name}</strong> ({confirmDelete.email}).
              Their account will no longer be able to sign in.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button onClick={handleDelete} loading={deleting}>
                <Trash2 size={15} /> Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
