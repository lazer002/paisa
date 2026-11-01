import { useState } from 'react'
import { BookMarked, Plus, Trash2, FileVideo, FileText, Link2, Pencil } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  type StudyMaterial,
} from '@/features/assignments/assignmentsApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'
import FileUpload, { FileLink } from '@/components/ui/FileUpload'
import type { StoredFile } from '@/lib/api/files'

const TYPE_ICON: Record<string, LucideIcon> = {
  pdf: FileText, video: FileVideo, link: Link2, other: BookMarked,
}

export default function MaterialsPage() {
  const { can } = usePermission()
  const canUpload = can('study_material:create')
  const canEdit = can('study_material:update')

  const { data: materials, isLoading, isError, refetch } = useGetMaterialsQuery()
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canUpload && !canEdit })

  const [createMaterial, { isLoading: createPending }] = useCreateMaterialMutation()
  const [updateMaterial, { isLoading: updatePending }] = useUpdateMaterialMutation()
  const [deleteMaterial] = useDeleteMaterialMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<StudyMaterial | null>(null)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [subject, setSubject] = useState('')
  const [type, setType] = useState('link')
  const [classId, setClassId] = useState('')
  const [description, setDescription] = useState('')
  // 'link' = paste a URL; 'file' = upload through /api/files.
  const [source, setSource] = useState<'link' | 'file'>('link')
  const [storedFile, setStoredFile] = useState<StoredFile | null>(null)
  const [uploading, setUploading] = useState(false)

  const resetForm = () => {
    setTitle(''); setUrl(''); setSubject(''); setType('link'); setClassId(''); setDescription(''); setError('')
    setSource('link'); setStoredFile(null)
  }

  const openCreate = () => {
    resetForm()
    setEditing(null)
    setShowCreate(true)
  }

  const openEdit = (m: StudyMaterial) => {
    setError('')
    setEditing(m)
    setTitle(m.title)
    // An uploaded material's url is its download path, not something to edit.
    setUrl(m.fileId ? '' : m.url)
    setSubject(m.subject ?? '')
    setType(m.type ?? 'other')
    setClassId(m.classId && typeof m.classId === 'object' ? m.classId.publicId ?? m.classId._id : m.classId ?? '')
    setDescription(m.description ?? '')
    setSource(m.fileId ? 'file' : 'link')
    setStoredFile(null)
    setShowCreate(true)
  }

  const closeForm = () => {
    setShowCreate(false)
    setEditing(null)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const keepsCurrentFile = !!editing?.fileId && source === 'file' && !storedFile
    if (source === 'file' && !storedFile && !keepsCurrentFile) {
      setError('Choose a file to upload')
      return
    }
    // With an upload and no explicit type, the server infers one from the file.
    const sentType = source === 'file' && type === 'link' ? undefined : type
    const fileOrUrl = source === 'file'
      ? (storedFile ? { fileId: storedFile.publicId } : {})
      : { url }
    try {
      if (editing) {
        await updateMaterial({
          id: editing.publicId ?? editing._id,
          // An empty class clears it; the server then makes the material institute-wide.
          payload: { title, ...fileOrUrl, subject, type: sentType, description, classId: classId || null },
        }).unwrap()
      } else {
        await createMaterial({
          title, ...fileOrUrl, subject: subject || undefined, type: sentType,
          description: description || undefined,
          classId: classId || undefined,
        }).unwrap()
      }
      // The material now owns the upload; don't let a reset delete it.
      setStoredFile(null)
      closeForm()
      resetForm()
    } catch (e) {
      setError(
        (e as { data?: { message?: string } })?.data?.message
          ?? (editing ? 'Failed to update material' : 'Failed to upload material'),
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials"
        subtitle={canUpload ? 'Share resources with your classes' : 'Resources shared by your teachers'}
        actions={canUpload ? <Button onClick={openCreate}><Plus size={16} /> Add Material</Button> : undefined}
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
          action={canUpload ? <Button onClick={openCreate}><Plus size={16} /> Add Material</Button> : undefined}
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
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    {canEdit && (
                      <button onClick={() => openEdit(m)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" title="Edit">
                        <Pencil size={14} />
                      </button>
                    )}
                    {canUpload && (
                      <button onClick={() => deleteMaterial(m.publicId ?? m._id)}
                        className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{m.title}</h3>
                {m.description && <p className="mt-1 line-clamp-2 text-xs text-gray-400">{m.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge color="blue">{m.type ?? 'link'}</Badge>
                    {clsName && <Badge color="gray">{clsName}</Badge>}
                  </div>
                  <FileLink url={m.url} fileName={m.title}
                    className="text-xs font-medium text-black hover:underline" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={closeForm} title={editing ? 'Edit Study Material' : 'Add Study Material'} size="md">
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Algebra Worksheet 1"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">{source === 'file' ? 'File *' : 'URL *'}</label>
              <div className="flex gap-1 text-xs">
                {(['link', 'file'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSource(s)}
                    className={`rounded-lg px-2 py-0.5 ${source === s ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {s === 'link' ? 'Link' : 'Upload file'}
                  </button>
                ))}
              </div>
            </div>
            {source === 'link' ? (
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                required type="url" placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
            ) : (
              <>
                {editing?.fileId && !storedFile && (
                  <p className="mb-1 text-xs text-gray-500">A file is attached. Choose another to replace it.</p>
                )}
                <FileUpload purpose="study_material" value={storedFile} onChange={setStoredFile} onBusyChange={setUploading} />
              </>
            )}
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
                {/* Keep a type set elsewhere (e.g. document) selectable when editing. */}
                {!['link', 'pdf', 'video', 'other'].includes(type) && <option value={type}>{type}</option>}
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={createPending || updatePending} disabled={uploading}>{editing ? 'Save changes' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
