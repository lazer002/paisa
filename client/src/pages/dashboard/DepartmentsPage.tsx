import { useState } from 'react'
import { Layers, Plus, Trash2, AlertTriangle } from 'lucide-react'
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '@/features/departments/departmentsApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingGrid, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

export default function DepartmentsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = ['super_admin', 'admin', 'hr'].includes(user?.role ?? '')

  const { data: departments, isLoading, isError, refetch } = useGetDepartmentsQuery()
  const [createDepartment, { isLoading: createPending }] = useCreateDepartmentMutation()
  const [deleteDepartment] = useDeleteDepartmentMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [head, setHead] = useState('')

  const { data: staff } = useGetUsersQuery()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createDepartment({ name, code: code || undefined, description: description || undefined, head: head || undefined }).unwrap()
      setShowCreate(false)
      setName(''); setCode(''); setDescription(''); setHead('')
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to create department')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Organizational structure for your teams"
        actions={canManage ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Department</Button> : undefined}
      />

      {isLoading ? (
        <LoadingGrid />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !departments?.length ? (
        <EmptyState
          icon={<Layers size={48} />}
          title="No departments yet"
          hint={canManage ? 'Create your first department to structure teams' : 'Departments will appear here'}
          action={canManage ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Department</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.publicId ?? d._id} className="group rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{d.name}</h3>
                  {d.code && <p className="text-xs text-gray-400">{d.code}</p>}
                </div>
                {canManage && (
                  <button
                    onClick={() => deleteDepartment(d.publicId ?? d._id)}
                    className="rounded-lg p-1.5 text-red-400 opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">{d.description || 'No description'}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge color={d.status === 'active' ? 'green' : 'gray'}>{d.status}</Badge>
                <span className="text-xs text-gray-400">
                  Head: {typeof d.head === 'object' ? d.head?.name ?? '—' : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Department" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Engineering"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ENG"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Head</label>
            <select value={head} onChange={(e) => setHead(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
              <option value="">— Assign later —</option>
              {(staff ?? []).map((u) => (
                <option key={rid(u)} value={rid(u)}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
