import { useState } from 'react'
import { Eye, Pencil, Plus, Star, Trash2 } from 'lucide-react'

import {
  useGetCertificateTemplatesQuery,
  useSaveCertificateTemplateMutation,
  useDeleteCertificateTemplateMutation,
  type CertificateTemplate,
  type CertificateTemplateInput,
} from '@/features/platform/platformApi'
import Button from '@/components/ui/button'
import { ModalShell, Field, inputCls } from '@/components/ui/kit'
import { previewCertificateDesign } from './printCertificate'

const EMPTY: CertificateTemplateInput = {
  name: '',
  heading: 'Certificate of Achievement',
  intro: 'This is to certify that',
  awardLine: 'has been awarded',
  footerNote: '',
  signatoryName: '',
  signatoryTitle: '',
  accentColor: '#1e3a5f',
  style: 'classic',
  isDefault: false,
}

const errMsg = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message ?? fallback

/** The organization's certificate designs: create, edit, preview, set default, delete. */
export default function CertificateTemplatesPanel({
  canEdit,
  onToast,
}: {
  canEdit: boolean
  onToast: (t: { msg: string; tone: 'success' | 'critical' }) => void
}) {
  const { data: templates } = useGetCertificateTemplatesQuery()
  const [saveTemplate, { isLoading }] = useSaveCertificateTemplateMutation()
  const [deleteTemplate] = useDeleteCertificateTemplateMutation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CertificateTemplateInput | null>(null)

  const set = (patch: Partial<CertificateTemplateInput>) => setForm((f) => (f ? { ...f, ...patch } : f))

  const open = (t?: CertificateTemplate) => {
    setEditingId(t?.publicId ?? null)
    setForm(
      t
        ? {
            name: t.name, heading: t.heading ?? '', intro: t.intro ?? '', awardLine: t.awardLine ?? '',
            footerNote: t.footerNote ?? '', signatoryName: t.signatoryName ?? '', signatoryTitle: t.signatoryTitle ?? '',
            accentColor: t.accentColor ?? '#1e3a5f', style: t.style ?? 'classic', isDefault: t.isDefault,
          }
        : { ...EMPTY, isDefault: !(templates ?? []).length },
    )
  }

  const save = async () => {
    if (!form?.name.trim()) return
    try {
      await saveTemplate({ id: editingId ?? undefined, payload: { ...form, name: form.name.trim() } }).unwrap()
      onToast({ msg: editingId ? 'Template updated' : 'Template created', tone: 'success' })
      setForm(null)
    } catch (e) {
      onToast({ msg: errMsg(e, 'Could not save the template'), tone: 'critical' })
    }
  }

  const remove = async (t: CertificateTemplate) => {
    if (!window.confirm(`Delete template "${t.name}"? Certificates already issued keep their design.`)) return
    try {
      await deleteTemplate(t.publicId).unwrap()
      onToast({ msg: 'Template deleted', tone: 'success' })
    } catch (e) {
      onToast({ msg: errMsg(e, 'Could not delete the template'), tone: 'critical' })
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Certificate templates</h2>
          <p className="text-xs text-gray-400">Wording, signatory and colour used when certificates are printed</p>
        </div>
        {canEdit && <Button size="sm" variant="secondary" onClick={() => open()}><Plus size={14} /> Template</Button>}
      </div>

      {(templates ?? []).length === 0 ? (
        <p className="text-sm text-gray-400">No templates yet — certificates use the built-in classic design.</p>
      ) : (
        <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
          {(templates ?? []).map((t) => (
            <li key={t.publicId} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="h-4 w-4 shrink-0 rounded" style={{ background: t.accentColor ?? '#1e3a5f' }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-gray-900">{t.name}</span>
                {t.isDefault && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-amber-700"><Star size={11} /> default</span>
                )}
                <span className="block truncate text-xs text-gray-400">
                  {t.style} · {t.heading}{t.signatoryName ? ` · signed ${t.signatoryName}` : ''}
                </span>
              </span>
              <button onClick={() => previewCertificateDesign(t)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black" title="Preview">
                <Eye size={14} />
              </button>
              {canEdit && (
                <>
                  <button onClick={() => open(t)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(t)} className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ModalShell
        open={!!form}
        onClose={() => setForm(null)}
        title={editingId ? 'Edit Template' : 'New Template'}
        footer={
          <>
            <Button variant="secondary" onClick={() => form && previewCertificateDesign(form)}><Eye size={14} /> Preview</Button>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} loading={isLoading} disabled={!form?.name.trim()}>{editingId ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <Field label="Template name" required>
              <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Course completion" />
            </Field>
            <Field label="Heading">
              <input className={inputCls} value={form.heading ?? ''} onChange={(e) => set({ heading: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Line before the name">
                <input className={inputCls} value={form.intro ?? ''} onChange={(e) => set({ intro: e.target.value })} />
              </Field>
              <Field label="Line before the title">
                <input className={inputCls} value={form.awardLine ?? ''} onChange={(e) => set({ awardLine: e.target.value })} />
              </Field>
              <Field label="Signatory name">
                <input className={inputCls} value={form.signatoryName ?? ''} onChange={(e) => set({ signatoryName: e.target.value })} placeholder="e.g. Dr. A. Rao" />
              </Field>
              <Field label="Signatory title">
                <input className={inputCls} value={form.signatoryTitle ?? ''} onChange={(e) => set({ signatoryTitle: e.target.value })} placeholder="e.g. Principal" />
              </Field>
              <Field label="Style">
                <select className={inputCls} value={form.style} onChange={(e) => set({ style: e.target.value as 'classic' | 'modern' })}>
                  <option value="classic">Classic (serif, double border)</option>
                  <option value="modern">Modern (sans-serif, side bar)</option>
                </select>
              </Field>
              <Field label="Accent colour">
                <input type="color" className="h-10 w-full rounded-xl border border-gray-200" value={form.accentColor ?? '#1e3a5f'} onChange={(e) => set({ accentColor: e.target.value })} />
              </Field>
            </div>
            <Field label="Footer note">
              <input className={inputCls} value={form.footerNote ?? ''} onChange={(e) => set({ footerNote: e.target.value })} placeholder="Optional small print" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={!!form.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} />
              Use for new certificates unless another template is picked
            </label>
          </div>
        )}
      </ModalShell>
    </div>
  )
}
