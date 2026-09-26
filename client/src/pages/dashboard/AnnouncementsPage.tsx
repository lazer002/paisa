import { useState } from 'react'
import {
  Megaphone, Plus, Pencil, Trash2, AlertTriangle, Pin,
} from 'lucide-react'

import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  type Announcement,
} from '@/features/announcements/announcementsApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

const PRIORITY_COLOR: Record<string, 'red' | 'orange' | 'gray'> = {
  high: 'red', medium: 'orange', low: 'gray',
}

const TARGET_OPTIONS = ['all', 'admin', 'teacher', 'student', 'hr', 'employee']

function AnnouncementModal({
  open, onClose, onSubmit, loading, error, initial,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (d: { title: string; content: string; targetRoles: string[]; priority: 'low' | 'medium' | 'high' }) => void
  loading: boolean
  error: string
  initial: Announcement | null
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initial?.priority ?? 'medium')
  const [targets, setTargets] = useState<string[]>(initial?.targetRoles?.length ? initial.targetRoles : ['all'])

  const toggleTarget = (role: string) => {
    if (role === 'all') { setTargets(['all']); return }
    setTargets((prev) => {
      const without = prev.filter((r) => r !== 'all')
      return without.includes(role) ? without.filter((r) => r !== role) : [...without, role]
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Announcement' : 'New Announcement'} size="md">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit({ title, content, targetRoles: targets, priority }) }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Holiday on Friday"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            placeholder="Write the announcement..."
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
                  priority === p ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Visible to</label>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleTarget(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                  targets.includes(r) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {r === 'all' ? 'Everyone' : r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Publish'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AnnouncementsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'admin'

  const { data: announcements, isLoading, isError, refetch } = useGetAnnouncementsQuery()

  const [createAnnouncement, { isLoading: createPending }] = useCreateAnnouncementMutation()
  const [updateAnnouncement, { isLoading: updatePending }] = useUpdateAnnouncementMutation()
  const [deleteAnnouncement, { isLoading: deletePending }] = useDeleteAnnouncementMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [deleteItem, setDeleteItem] = useState<Announcement | null>(null)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (d: { title: string; content: string; targetRoles: string[]; priority: 'low' | 'medium' | 'high' }) => {
    setFormError('')
    try {
      if (editItem) await updateAnnouncement({ id: editItem._id, payload: d }).unwrap()
      else await createAnnouncement(d).unwrap()
      setShowCreate(false)
      setEditItem(null)
    } catch (e: any) {
      setFormError(e?.data?.message ?? 'Failed to save announcement')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteAnnouncement(deleteItem._id).unwrap()
      setDeleteItem(null)
    } catch { /* list refreshes */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle={canManage ? 'Post notices to your organization' : 'Notices from your organization'}
        actions={canManage ? (
          <Button onClick={() => { setShowCreate(true); setFormError('') }}>
            <Plus size={16} /> New Announcement
          </Button>
        ) : undefined}
      />

      {isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !announcements?.length ? (
        <EmptyState
          icon={<Megaphone size={48} />}
          title="No announcements"
          hint={canManage ? 'Publish your first announcement' : 'Check back later for updates'}
          action={canManage ? (
            <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Announcement</Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const author = typeof a.createdBy === 'object' ? a.createdBy?.name : '—'
            const canTouch = canManage && (user?.role === 'super_admin' || a.instituteId !== null)
            return (
              <div key={a._id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      a.priority === 'high' ? 'bg-red-50 text-red-500' : a.priority === 'medium' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {a.priority === 'high' ? <AlertTriangle size={18} /> : <Megaphone size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <p className="mt-0.5 text-sm text-gray-600">{a.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge color={PRIORITY_COLOR[a.priority]}>{a.priority}</Badge>
                        <span className="text-xs text-gray-400">
                          {author} · {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                        {a.targetRoles?.length > 0 && !a.targetRoles.includes('all') && (
                          <span className="text-xs text-gray-400">→ {a.targetRoles.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {canTouch && (
                    <div className="flex flex-shrink-0 gap-1">
                      <button onClick={() => setEditItem(a)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-black" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteItem(a)} className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(showCreate || editItem) && (
        <AnnouncementModal
          open={showCreate || !!editItem}
          onClose={() => { setShowCreate(false); setEditItem(null) }}
          onSubmit={handleSubmit}
          loading={createPending || updatePending}
          error={formError}
          initial={editItem}
        />
      )}

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Announcement" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              Delete <strong>{deleteItem?.title}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteItem(null)} disabled={deletePending}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deletePending}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
