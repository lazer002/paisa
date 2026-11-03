import { useState } from 'react'
import { Plus, Trash2, Pencil, BadgeCheck, Award as AwardIcon, Printer, Link2 } from 'lucide-react'
import { printCertificate, verificationLink } from '@/components/certificates/printCertificate'

import {
  useGetSalaryStructuresQuery,
  useCreateSalaryStructureMutation,
  useUpdateSalaryStructureMutation,
  useDeleteSalaryStructureMutation,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useAcknowledgeReviewMutation,
  useDeleteReviewMutation,
  useGetCertificatesQuery,
  useCreateCertificateMutation,
  useRevokeCertificateMutation,
  useDeleteCertificateMutation,
  useGetCertificateTemplatesQuery,
  type SalaryStructure,
  type SalaryComponent,
  type PerformanceReview,
  type Certificate,
} from '@/features/platform/platformApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import EmployeeDocumentsPanel from '@/components/hr/EmployeeDocumentsPanel'
import CertificateTemplatesPanel from '@/components/certificates/CertificateTemplatesPanel'
import ReviewModal from '@/components/hr/ReviewModal'
import SalaryComponentsEditor from '@/components/hr-payroll/SalaryComponentsEditor'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Tabs, StatusBadge, ModalShell, Field, inputCls, Toast, type Column,
} from '@/components/ui/kit'

type TabId = 'structures' | 'reviews' | 'certificates' | 'documents'

export default function HROpsPage() {
  const { can } = usePermission()
  const canStructure = can('salary_structure:create')
  const canReview = can('performance:create')
  const canCertificate = can('certificate:create')
  const canManage = canStructure || canReview || canCertificate
  // Mirrors hrOpsRoutes.js: PUT/DELETE each have their own permission.
  const canUpdateStructure = can('salary_structure:update')
  const canDeleteStructure = can('salary_structure:delete')
  const canDeleteReview = can('performance:delete')
  const canDeleteCertificate = can('certificate:delete')

  const canReadStructures = can('salary_structure:read')
  const canReadReviews = can('performance:read')
  const canReadCertificates = can('certificate:read')
  const canReadDocuments = can('employee_document:read')

  // Employees, students and parents reach this page as "My Records" and
  // only get the tabs their role may read.
  const [tab, setTab] = useState<TabId>(() =>
    canReadStructures ? 'structures' : canReadReviews ? 'reviews' : canReadCertificates ? 'certificates' : 'documents',
  )
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: structures } = useGetSalaryStructuresQuery(undefined, { skip: !canReadStructures })
  const { data: reviews } = useGetReviewsQuery(undefined, { skip: !canReadReviews })
  const { data: certificates } = useGetCertificatesQuery(undefined, { skip: !canReadCertificates })
  const { data: users } = useGetUsersQuery(undefined, { skip: !canManage })
  const { data: employees } = useGetUsersQuery({ role: 'employee' }, { skip: !canManage })

  const [createStructure] = useCreateSalaryStructureMutation()
  const [updateStructure] = useUpdateSalaryStructureMutation()
  const [deleteStructure] = useDeleteSalaryStructureMutation()
  const [deleteReview] = useDeleteReviewMutation()
  const [deleteCertificate] = useDeleteCertificateMutation()
  const [createReview] = useCreateReviewMutation()
  const [updateReview] = useUpdateReviewMutation()
  const [acknowledgeReview] = useAcknowledgeReviewMutation()
  const [createCertificate] = useCreateCertificateMutation()
  const [revokeCertificate] = useRevokeCertificateMutation()

  const [showStructure, setShowStructure] = useState(false)
  // publicId of the structure being edited; null while the modal creates a new one
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [openReview, setOpenReview] = useState<PerformanceReview | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)

  const [name, setName] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [payFrequency, setPayFrequency] = useState('monthly')
  const [autoTds, setAutoTds] = useState(false)
  const [components, setComponents] = useState<SalaryComponent[]>([])

  const [reviewEmployee, setReviewEmployee] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewType, setReviewType] = useState('annual')

  const [certUserId, setCertUserId] = useState('')
  const [certTitle, setCertTitle] = useState('')
  const [certDescription, setCertDescription] = useState('')
  const [certValidUntil, setCertValidUntil] = useState('')
  const [certTemplateId, setCertTemplateId] = useState('')
  const { data: certTemplates } = useGetCertificateTemplatesQuery(undefined, { skip: !canCertificate })

  const copyVerifyLink = async (c: Certificate) => {
    const code = c.verification?.verificationCode
    if (!code) return
    try {
      await navigator.clipboard.writeText(verificationLink(code))
      setToast({ msg: 'Verification link copied', tone: 'success' })
    } catch {
      setToast({ msg: verificationLink(code), tone: 'success' })
    }
  }

  const errMsg = (e: unknown, fallback: string) =>
    (e as { data?: { message?: string } })?.data?.message ?? fallback

  const openCreateStructure = () => {
    setEditingStructureId(null)
    setName(''); setBaseSalary(''); setPayFrequency('monthly'); setComponents([]); setAutoTds(false)
    setShowStructure(true)
  }

  const openEditStructure = (s: SalaryStructure) => {
    setEditingStructureId(rid(s))
    setName(s.name ?? '')
    setBaseSalary(String(s.baseSalary ?? ''))
    setPayFrequency(s.payFrequency ?? 'monthly')
    setAutoTds(!!s.autoTds)
    setComponents(s.components ?? [])
    setShowStructure(true)
  }

  const closeStructure = () => {
    setShowStructure(false)
    setEditingStructureId(null)
  }

  const submitStructure = async () => {
    if (!name || !baseSalary) return
    if (components.some((c) => !c.code || !c.name)) {
      setToast({ msg: 'Every component needs a code and a name', tone: 'critical' })
      return
    }
    const payload = { name, baseSalary: Number(baseSalary), payFrequency, components, autoTds }
    try {
      if (editingStructureId) {
        await updateStructure({ id: editingStructureId, payload }).unwrap()
      } else {
        await createStructure(payload).unwrap()
      }
      setToast({ msg: editingStructureId ? 'Salary structure updated' : 'Salary structure created', tone: 'success' })
      closeStructure()
      setName(''); setBaseSalary('')
    } catch (e) {
      setToast({ msg: errMsg(e, editingStructureId ? 'Failed to update' : 'Failed to create'), tone: 'critical' })
    }
  }

  const removeStructure = async (s: SalaryStructure) => {
    if (!window.confirm(`Delete salary structure "${s.name}"? This cannot be undone.`)) return
    try {
      await deleteStructure(rid(s)).unwrap()
      setToast({ msg: 'Salary structure deleted', tone: 'success' })
    } catch (e) {
      setToast({ msg: errMsg(e, 'Failed to delete'), tone: 'critical' })
    }
  }

  const removeReview = async (r: PerformanceReview) => {
    if (!window.confirm(`Delete review "${r.title}"? This cannot be undone.`)) return
    try {
      await deleteReview(rid(r)).unwrap()
      setToast({ msg: 'Review deleted', tone: 'success' })
    } catch (e) {
      setToast({ msg: errMsg(e, 'Failed to delete review'), tone: 'critical' })
    }
  }

  const removeCertificate = async (c: Certificate) => {
    if (!window.confirm(`Delete certificate "${c.title}"? This cannot be undone.`)) return
    try {
      await deleteCertificate(rid(c)).unwrap()
      setToast({ msg: 'Certificate deleted', tone: 'success' })
    } catch (e) {
      setToast({ msg: errMsg(e, 'Failed to delete certificate'), tone: 'critical' })
    }
  }

  const submitReview = async () => {
    if (!reviewEmployee || !reviewTitle) return
    try {
      await createReview({ employeeId: reviewEmployee, title: reviewTitle, type: reviewType }).unwrap()
      setShowReview(false)
      setReviewEmployee(''); setReviewTitle('')
      setToast({ msg: 'Review created as draft', tone: 'success' })
    } catch (e) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create review', tone: 'critical' })
    }
  }

  const submitCertificate = async () => {
    if (!certUserId || !certTitle) return
    try {
      await createCertificate({
        userId: certUserId,
        title: certTitle,
        description: certDescription.trim() || undefined,
        validUntil: certValidUntil || undefined,
        templateId: certTemplateId || undefined,
      }).unwrap()
      setShowCertificate(false)
      setCertUserId(''); setCertTitle(''); setCertDescription(''); setCertValidUntil(''); setCertTemplateId('')
      setToast({ msg: 'Certificate issued', tone: 'success' })
    } catch (e) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to issue', tone: 'critical' })
    }
  }

  const reviewColumns: Column<PerformanceReview>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (typeof r.employeeId === 'object' ? r.employeeId?.name ?? '—' : '—'),
    },
    { key: 'title', header: 'Review', render: (r) => <span className="font-medium text-gray-800">{r.title}</span> },
    { key: 'type', header: 'Type', render: (r) => <span className="capitalize text-gray-500">{r.type ?? 'annual'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'goals',
      header: 'Goals',
      render: (r) => (
        <span className="text-xs text-gray-600">
          {r.goals?.length ? `${r.goals.length} · ${r.goalScore ?? 0}%` : '—'}
          {r.performanceImprovementPlan?.enabled && r.performanceImprovementPlan.status !== 'cancelled' && (
            <span className="ml-2 rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">PIP {r.performanceImprovementPlan.status}</span>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => setOpenReview(r)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {canReview ? 'Open' : 'View'}
          </button>
          {canReview && r.status === 'draft' && (
            <button
              onClick={async () => {
                await updateReview({ id: r.publicId ?? r._id, payload: { status: 'in_progress' } })
                setToast({ msg: 'Review started', tone: 'success' })
              }}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Start
            </button>
          )}
          {!canReview && ['submitted', 'under_review', 'completed'].includes(r.status) && (
            <button
              onClick={async () => {
                try {
                  await acknowledgeReview(r.publicId ?? r._id).unwrap()
                  setToast({ msg: 'Review acknowledged', tone: 'success' })
                } catch (e: unknown) {
                  setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Could not acknowledge', tone: 'critical' })
                }
              }}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Acknowledge
            </button>
          )}
          {canDeleteReview && (
            <button
              onClick={() => removeReview(r)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Delete review"
              title="Delete review"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  const certificateColumns: Column<Certificate>[] = [
    {
      key: 'user',
      header: 'Issued to',
      render: (c) =>
        (typeof c.userId === 'object' ? c.userId?.name : undefined) ?? c.recipientSnapshot?.name ?? '—',
    },
    {
      key: 'title',
      header: 'Certificate',
      render: (c) => (
        <div>
          <span className="flex items-center gap-2 font-medium text-gray-800">
            <BadgeCheck size={15} className="text-sky-500" /> {c.title}
          </span>
          {c.certificateNumber && <p className="pl-6 text-xs text-gray-400">{c.certificateNumber}</p>}
        </div>
      ),
    },
    {
      key: 'issued',
      header: 'Issued',
      render: (c) => {
        const d = c.issueDate ?? c.createdAt
        return <span className="text-gray-500">{d ? new Date(d).toLocaleDateString() : '—'}</span>
      },
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => {
              if (!printCertificate(c)) setToast({ msg: 'Allow pop-ups to print the certificate', tone: 'critical' })
            }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Print certificate"
            title="Print / save as PDF"
          >
            <Printer size={14} />
          </button>
          {c.verification?.verificationCode && (
            <button
              onClick={() => copyVerifyLink(c)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Copy verification link"
              title={`Copy verification link (code ${c.verification.verificationCode})`}
            >
              <Link2 size={14} />
            </button>
          )}
          {canCertificate && c.status === 'issued' && (
            <button
              onClick={async () => {
                if (!window.confirm(`Revoke "${c.title}"? Public verification will show it as revoked.`)) return
                try {
                  await revokeCertificate(rid(c)).unwrap()
                  setToast({ msg: 'Certificate revoked', tone: 'success' })
                } catch (e) {
                  setToast({ msg: errMsg(e, 'Failed to revoke'), tone: 'critical' })
                }
              }}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Revoke
            </button>
          )}
          {canDeleteCertificate && (
            <button
              onClick={() => removeCertificate(c)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Delete certificate"
              title="Delete certificate"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  const structureColumns: Column<SalaryStructure>[] = [
    {
      key: 'name',
      header: 'Structure',
      render: (s) => <p className="font-medium text-gray-900">{s.name}</p>,
    },
    { key: 'base', header: 'Base salary', render: (s) => <span className="font-medium text-gray-800">₹{(s.baseSalary ?? 0).toLocaleString()}</span> },
    { key: 'freq', header: 'Frequency', render: (s) => <span className="capitalize text-gray-500">{s.payFrequency ?? 'monthly'}</span> },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) => (
        <div className="flex justify-end gap-1">
          {canUpdateStructure && (
            <button
              onClick={() => openEditStructure(s)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Edit salary structure"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDeleteStructure && (
            <button
              onClick={() => removeStructure(s)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Delete salary structure"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={can('hr:read') ? 'HR Operations' : 'My Records'}
        subtitle={can('hr:read') ? 'Salary structures, performance reviews, and certificates' : 'Your documents, reviews and certificates'}
        actions={canManage ? (
          <div className="flex gap-2">
            {tab === 'structures' && canStructure && <Button onClick={openCreateStructure}><Plus size={15} /> Structure</Button>}
            {tab === 'reviews' && canReview && <Button onClick={() => setShowReview(true)}><Plus size={15} /> Review</Button>}
            {tab === 'certificates' && canCertificate && <Button onClick={() => setShowCertificate(true)}><Plus size={15} /> Certificate</Button>}
          </div>
        ) : undefined}
      />

      <Tabs<TabId>
        tabs={[
          ...(canReadStructures ? [{ id: 'structures' as TabId, label: 'Salary Structures', count: structures?.length }] : []),
          ...(canReadReviews ? [{ id: 'reviews' as TabId, label: 'Reviews', count: reviews?.length }] : []),
          ...(canReadCertificates ? [{ id: 'certificates' as TabId, label: 'Certificates', count: certificates?.length }] : []),
          ...(canReadDocuments ? [{ id: 'documents' as TabId, label: 'Documents' }] : []),
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'structures' && (
        <DataTable
          columns={structureColumns}
          rows={structures}
          keyOf={(s) => s.publicId ?? s._id}
          emptyTitle="No salary structures"
          emptyHint="Define pay templates to standardize compensation"
          emptyAction={canStructure ? <Button onClick={openCreateStructure}><Plus size={15} /> Structure</Button> : undefined}
        />
      )}

      {tab === 'reviews' && (
        <DataTable
          columns={reviewColumns}
          rows={reviews}
          keyOf={(r) => r.publicId ?? r._id}
          emptyTitle="No reviews"
          emptyHint="Schedule performance reviews for your team"
          emptyAction={canReview ? <Button onClick={() => setShowReview(true)}><Plus size={15} /> Review</Button> : undefined}
        />
      )}

      {tab === 'documents' && <EmployeeDocumentsPanel />}

      {tab === 'certificates' && (
        <div className="space-y-5">
          {canCertificate && <CertificateTemplatesPanel canEdit={canCertificate} onToast={setToast} />}
          <DataTable
            columns={certificateColumns}
            rows={certificates}
            keyOf={(c) => c.publicId ?? c._id}
            emptyTitle="No certificates"
            emptyHint="Issue certificates for completions and achievements"
            emptyAction={canCertificate ? <Button onClick={() => setShowCertificate(true)}><Plus size={15} /> Certificate</Button> : undefined}
          />
        </div>
      )}

      {/* Structure modal */}
      <ModalShell
        open={showStructure}
        onClose={closeStructure}
        title={editingStructureId ? 'Edit Salary Structure' : 'New Salary Structure'}
        footer={
          <>
            <Button variant="secondary" onClick={closeStructure}>Cancel</Button>
            <Button onClick={submitStructure}>{editingStructureId ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior Teacher — Tier A" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base salary (₹)" required>
              <input type="number" className={inputCls} value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
            </Field>
            <Field label="Pay frequency">
              <select className={inputCls} value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)}>
                {['monthly', 'biweekly', 'weekly'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Components">
            <SalaryComponentsEditor value={components} onChange={setComponents} />
          </Field>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-0.5" checked={autoTds} onChange={(e) => setAutoTds(e.target.checked)} />
            <span>
              Deduct income tax (TDS) automatically
              <span className="block text-xs text-gray-400">
                Each month: the year's projected tax from the employee's declaration (new regime if none), minus tax already deducted, spread over the months left. Skipped when a component already deducts income tax.
              </span>
            </span>
          </label>
        </div>
      </ModalShell>

      {/* Review modal */}
      <ModalShell
        open={showReview}
        onClose={() => setShowReview(false)}
        title="New Performance Review"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReview(false)}>Cancel</Button>
            <Button onClick={submitReview}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee" required>
            <select className={inputCls} value={reviewEmployee} onChange={(e) => setReviewEmployee(e.target.value)}>
              <option value="">— Select employee —</option>
              {(employees ?? []).map((u) => (
                <option key={rid(u)} value={rid(u)}>{u.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Title" required>
            <input className={inputCls} value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="e.g. FY26 Annual Review" />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={reviewType} onChange={(e) => setReviewType(e.target.value)}>
              {['annual', 'half_yearly', 'quarterly', 'probation', 'project'].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </Field>
        </div>
      </ModalShell>

      {/* Certificate modal */}
      <ModalShell
        open={showCertificate}
        onClose={() => setShowCertificate(false)}
        title="Issue Certificate"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCertificate(false)}>Cancel</Button>
            <Button onClick={submitCertificate}><AwardIcon size={14} /> Issue</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Issue to" required>
            <select className={inputCls} value={certUserId} onChange={(e) => setCertUserId(e.target.value)}>
              <option value="">— Select user —</option>
              {(users ?? []).map((u) => (
                <option key={rid(u)} value={rid(u)}>{u.name} ({u.role})</option>
              ))}
            </select>
          </Field>
          <Field label="Certificate title" required>
            <input className={inputCls} value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="e.g. Advanced Pedagogy Certificate" />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={certDescription} onChange={(e) => setCertDescription(e.target.value)} placeholder="Optional line printed under the title" />
          </Field>
          <Field label="Valid until">
            <input type="date" className={inputCls} value={certValidUntil} onChange={(e) => setCertValidUntil(e.target.value)} />
          </Field>
          {(certTemplates ?? []).length > 0 && (
            <Field label="Template">
              <select className={inputCls} value={certTemplateId} onChange={(e) => setCertTemplateId(e.target.value)}>
                <option value="">Organization default</option>
                {(certTemplates ?? []).map((t) => (
                  <option key={t.publicId} value={t.publicId}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
                ))}
              </select>
            </Field>
          )}
          <p className="text-xs text-gray-400">A certificate number and a public verification code are generated automatically.</p>
        </div>
      </ModalShell>

      {openReview && (
        <ReviewModal
          key={rid(openReview)}
          review={openReview}
          canManage={canReview}
          onClose={() => setOpenReview(null)}
          onToast={setToast}
        />
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
