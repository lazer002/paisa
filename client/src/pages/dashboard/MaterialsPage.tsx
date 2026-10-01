import { useState } from 'react'
import { BookMarked, Plus, Trash2, ExternalLink, FileVideo, FileText, Link2 } from 'lucide-react'
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
} from '@/features/assignments/assignmentsApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

const TYPE_ICON: Record<string, any> = {
  pdf: FileText, video: FileVideo, link: Link2, other: BookMarked,
}

export default function MaterialsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canUpload = ['super_admin', 'admin', 'teacher'].includes(user?.role ?? '')

  const { data: materials, isLoading, isError, refetch } = useGetMaterialsQuery()
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canUpload })

  const [createMaterial, { isLoading: createPending }] = useCreateMaterialMutation()
  const [deleteMaterial] = useDeleteMaterialMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [subject, setSubject] = useState('')
  const [type, setType] = useState('link')
  const [classId, setClassId] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createMaterial({
        title, url, subject: subject || undefined, type,
        classId: classId || undefined,
      }).unwrap()
      setShowCreate(false)
      setTitle(''); setUrl(''); setSubject('')
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to upload material')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials"
        subtitle={canUpload ? 'Share resources with your classes' : 'Resources shared by your teachers'}
        actions={canUpload ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Add Material</Button> : undefined}
      />

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !materials?.length ? (
        <EmptyState
          icon={<BookMarked size={48} />}
          title="No materials yet"
          hint={canUpload ? 'Share the first resource' : 'Materials will appear here'}
          action={canUpload ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Add Material</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => {
            const Icon = TYPE_ICON[m.type ?? 'other'] ?? BookMarked
            const clsName = typeof m.classId === 'object' ? m.classId?.name : null
            return (
              <div key={m.publicId ?? m._id} className="group rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon size={18} /></div>
                  {canUpload && (
                    <button onClick={() => deleteMaterial(m.publicId ?? m._id)}
                      className="rounded-lg p-1.5 text-red-400 opacity-0 transition hover:bg-red-50 group-hover:opacity-100" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{m.title}</h3>
                {m.description && <p className="mt-1 line-clamp-2 text-xs text-gray-400">{m.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge color="blue">{m.type ?? 'link'}</Badge>
                    {clsName && <Badge color="gray">{clsName}</Badge>}
                  </div>
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-black hover:underline">
                    Open <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Study Material" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Algebra Worksheet 1"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">URL *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required type="url" placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
                <option value="">— General —</option>
                {(classes ?? []).map((c) => (
                  <option key={rid(c)} value={rid(c)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createPending}>Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
