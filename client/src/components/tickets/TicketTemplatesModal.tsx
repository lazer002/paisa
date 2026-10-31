import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'

import {
  useGetTicketTemplatesQuery,
  useCreateTicketTemplateMutation,
  useUpdateTicketTemplateMutation,
  useDeleteTicketTemplateMutation,
  type TicketTemplate,
} from '@/features/platform/platformApi'
import { rid } from '@/features/users/usersApi'
import { ModalShell, Field, inputCls } from '@/components/ui/kit'
import Button from '@/components/ui/button'

const errMsg = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

/** Manage the organization's reply templates (admin/support). */
export default function TicketTemplatesModal({
  open,
  onClose,
  onToast,
}: {
  open: boolean
  onClose: () => void
  onToast: (message: string, tone: 'success' | 'critical') => void
}) {
  const { data: templates, isLoading } = useGetTicketTemplatesQuery(undefined, { skip: !open })
  const [createTemplate, { isLoading: creating }] = useCreateTicketTemplateMutation()
  const [updateTemplate, { isLoading: updating }] = useUpdateTicketTemplateMutation()
  const [deleteTemplate] = useDeleteTicketTemplateMutation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')

  const reset = () => {
    setEditingId(null)
    setName('')
    setBody('')
  }

  const startEdit = (t: TicketTemplate) => {
    setEditingId(rid(t))
    setName(t.name)
    setBody(t.body)
  }

  const save = async () => {
    if (!name.trim() || !body.trim()) return
    try {
      if (editingId) {
        await updateTemplate({ id: editingId, name: name.trim(), body: body.trim() }).unwrap()
        onToast('Template updated', 'success')
      } else {
        await createTemplate({ name: name.trim(), body: body.trim() }).unwrap()
        onToast('Template created', 'success')
      }
      reset()
    } catch (e) {
      onToast(errMsg(e, 'Failed to save template'), 'critical')
    }
  }

  const remove = async (t: TicketTemplate) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return
    try {
      await deleteTemplate(rid(t)).unwrap()
      if (editingId === rid(t)) reset()
      onToast('Template deleted', 'success')
    } catch (e) {
      onToast(errMsg(e, 'Failed to delete template'), 'critical')
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Reply templates"
      size="lg"
      footer={<Button variant="secondary" onClick={() => { reset(); onClose() }}>Done</Button>}
    >
      <div className="space-y-5">
        <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          {isLoading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
          {!isLoading && (templates ?? []).length === 0 && (
            <p className="p-4 text-sm text-gray-400">No templates yet. Add common answers below.</p>
          )}
          {(templates ?? []).map((t) => (
            <div key={rid(t)} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                <p className="line-clamp-2 whitespace-pre-wrap text-xs text-gray-500">{t.body}</p>
              </div>
              <button
                onClick={() => startEdit(t)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label={`Edit template ${t.name}`}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => remove(t)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Delete template ${t.name}`}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold uppercase text-gray-500">{editingId ? 'Edit template' : 'New template'}</p>
          <Field label="Name" required>
            <input className={inputCls} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. Password reset steps" />
          </Field>
          <Field label="Reply text" required>
            <textarea className={inputCls} rows={4} value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} placeholder="The text inserted into the reply box" />
          </Field>
          <div className="flex justify-end gap-2">
            {editingId && <Button variant="secondary" onClick={reset}>Cancel edit</Button>}
            <Button onClick={save} disabled={!name.trim() || !body.trim() || creating || updating}>
              {editingId ? 'Save' : <><Plus size={14} /> Add template</>}
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
