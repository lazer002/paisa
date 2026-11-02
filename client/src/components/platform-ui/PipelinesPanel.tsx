import { useState } from 'react'
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, X, GitBranch } from 'lucide-react'

import {
  useGetPipelinesQuery,
  useCreatePipelineMutation,
  useUpdatePipelineMutation,
  useDeletePipelineMutation,
  type Pipeline,
} from '@/features/platform/platformApi'
import { rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import { SectionCard, StatusBadge, ModalShell, Field, inputCls, Toast } from '@/components/ui/kit'

// `key` is kept for existing stages so renaming doesn't orphan deals using it.
type StageDraft = { name: string; type: 'open' | 'won' | 'lost'; key?: string }

const PIPELINE_TYPES = ['sales', 'admissions', 'enrollment', 'renewal', 'support', 'custom']

const DEFAULT_STAGES: StageDraft[] = [
  { name: 'Qualification', type: 'open' },
  { name: 'Proposal', type: 'open' },
  { name: 'Negotiation', type: 'open' },
  { name: 'Closed Won', type: 'won' },
  { name: 'Closed Lost', type: 'lost' },
]

const STAGE_TONE: Record<string, string> = {
  open: 'border-gray-200 bg-white text-gray-700',
  won: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  lost: 'border-rose-200 bg-rose-50 text-rose-700',
}

const errMsg = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

/** CRM pipelines: list with ordered stages, create, edit, delete. */
export default function PipelinesPanel() {
  const { can } = usePermission()
  const canCreate = can('pipeline:create')
  const canUpdate = can('pipeline:update')
  const canDelete = can('pipeline:delete')

  const { data: pipelines, isLoading, isError, refetch } = useGetPipelinesQuery()
  const [createPipeline, { isLoading: creating }] = useCreatePipelineMutation()
  const [updatePipeline, { isLoading: updating }] = useUpdatePipelineMutation()
  const [deletePipeline] = useDeletePipelineMutation()

  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  // publicId of the pipeline being edited; null while the modal creates one
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('sales')
  const [stages, setStages] = useState<StageDraft[]>(DEFAULT_STAGES)

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setType('sales')
    setStages(DEFAULT_STAGES)
  }

  const openCreate = () => {
    resetForm()
    setShowCreate(true)
  }

  const openEdit = (p: Pipeline) => {
    setEditingId(rid(p))
    setName(p.name)
    setType(p.type ?? 'sales')
    setStages(
      [...(p.stages ?? [])]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => ({ name: s.name, key: s.key, type: (s.type as StageDraft['type']) ?? 'open' })),
    )
    setShowCreate(true)
  }

  const updateStage = (index: number, patch: Partial<StageDraft>) =>
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  const moveStage = (index: number, delta: -1 | 1) =>
    setStages((prev) => {
      const target = index + delta
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const removeStage = (index: number) => setStages((prev) => prev.filter((_, i) => i !== index))

  const cleanStages = stages.map((s) => ({ ...s, name: s.name.trim() })).filter((s) => s.name)
  const canSubmit = !!name.trim() && cleanStages.length >= 2

  const submit = async () => {
    if (!canSubmit) return
    const payload = { name: name.trim(), type, stages: cleanStages }
    try {
      if (editingId) await updatePipeline({ id: editingId, payload }).unwrap()
      else await createPipeline(payload).unwrap()
      setShowCreate(false)
      setToast({ msg: editingId ? 'Pipeline updated' : 'Pipeline created', tone: 'success' })
      resetForm()
    } catch (e) {
      setToast({ msg: errMsg(e, editingId ? 'Failed to update pipeline' : 'Failed to create pipeline'), tone: 'critical' })
    }
  }

  const remove = async (p: Pipeline) => {
    if (!window.confirm(`Delete pipeline "${p.name}"?`)) return
    try {
      await deletePipeline(rid(p)).unwrap()
      setToast({ msg: 'Pipeline deleted', tone: 'success' })
    } catch (e) {
      setToast({ msg: errMsg(e, 'Failed to delete pipeline'), tone: 'critical' })
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={openCreate}><Plus size={15} /> New Pipeline</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <SectionCard>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">Failed to load pipelines</p>
            <Button variant="secondary" className="mt-3" onClick={() => refetch()}>Retry</Button>
          </div>
        </SectionCard>
      ) : (pipelines ?? []).length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <GitBranch size={32} className="mb-2 text-gray-200" />
          <p className="text-sm text-gray-500">No pipelines yet</p>
          <p className="mt-0.5 text-xs text-gray-400">Define the stages your deals move through</p>
          {canCreate && (
            <Button className="mt-3" onClick={openCreate}><Plus size={15} /> New Pipeline</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(pipelines ?? []).map((p) => {
            const ordered = [...(p.stages ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            return (
              <SectionCard key={rid(p)}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-0.5 text-xs capitalize text-gray-400">
                      {p.type ?? 'sales'} · {ordered.length} stage{ordered.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {canUpdate && (
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      title="Edit pipeline"
                      aria-label={`Edit pipeline ${p.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => remove(p)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Delete pipeline"
                      aria-label={`Delete pipeline ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {ordered.map((s, i) => (
                    <span key={s._id ?? s.key ?? i} className="flex items-center gap-1.5">
                      <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${STAGE_TONE[s.type ?? 'open'] ?? STAGE_TONE.open}`}>
                        {i + 1}. {s.name}
                      </span>
                      {i < ordered.length - 1 && <span className="text-gray-300">→</span>}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )
          })}
        </div>
      )}

      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={editingId ? 'Edit Pipeline' : 'New Pipeline'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit || creating || updating}>{editingId ? 'Save' : 'Create Pipeline'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Admissions 2026" />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {PIPELINE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Stages (in order, at least two)" required>
            <div className="space-y-2">
              {stages.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-gray-400">{i + 1}.</span>
                  <input
                    className={inputCls}
                    value={s.name}
                    onChange={(e) => updateStage(i, { name: e.target.value })}
                    placeholder="Stage name"
                  />
                  <select
                    className={`${inputCls} max-w-[7.5rem]`}
                    value={s.type}
                    onChange={(e) => updateStage(i, { type: e.target.value as StageDraft['type'] })}
                    aria-label="Stage outcome"
                  >
                    <option value="open">open</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => moveStage(i, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Move stage up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(i, 1)}
                    disabled={i === stages.length - 1}
                    className="rounded p-1 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Move stage down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStage(i)}
                    className="rounded p-1 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove stage"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStages((prev) => [...prev, { name: '', type: 'open' }])}
              >
                <Plus size={13} /> Add stage
              </Button>
            </div>
          </Field>
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
