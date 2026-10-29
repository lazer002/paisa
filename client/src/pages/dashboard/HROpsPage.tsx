import { useState } from 'react'
import { Plus, Trash2, BadgeCheck, Award as AwardIcon } from 'lucide-react'

import {
  useGetSalaryStructuresQuery,
  useCreateSalaryStructureMutation,
  useDeleteSalaryStructureMutation,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useGetCertificatesQuery,
  useCreateCertificateMutation,
  useRevokeCertificateMutation,
  type SalaryStructure,
  type PerformanceReview,
  type Certificate,
} from '@/features/platform/platformApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import EmployeeDocumentsPanel from '@/components/hr/EmployeeDocumentsPanel'
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
  const [deleteStructure] = useDeleteSalaryStructureMutation()
  const [createReview] = useCreateReviewMutation()
  const [updateReview] = useUpdateReviewMutation()
  const [createCertificate] = useCreateCertificateMutation()
  const [revokeCertificate] = useRevokeCertificateMutation()

  const [showStructure, setShowStructure] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)

  const [name, setName] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [payFrequency, setPayFrequency] = useState('monthly')

  const [reviewEmployee, setReviewEmployee] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewType, setReviewType] = useState('annual')

  const [certUserId, setCertUserId] = useState('')
  const [certTitle, setCertTitle] = useState('')

  const submitStructure = async () => {
    if (!name || !baseSalary) return
    try {
      await createStructure({ name, baseSalary: Number(baseSalary), payFrequency }).unwrap()
      setShowStructure(false)
      setName(''); setBaseSalary('')
      setToast({ msg: 'Salary structure created', tone: 'success' })
    } catch (e) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create', tone: 'critical' })
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
      await createCertificate({ userId: certUserId, title: certTitle }).unwrap()
      setShowCertificate(false)
      setCertUserId(''); setCertTitle('')
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
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) =>
        canReview && r.status === 'draft' ? (
          <button
            onClick={async () => {
              await updateReview({ id: r.publicId ?? r._id, payload: { status: 'in_progress' } })
              setToast({ msg: 'Review started', tone: 'success' })
            }}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Start
          </button>
        ) : null,
    },
  ]

  const certificateColumns: Column<Certificate>[] = [
    {
      key: 'user',
      header: 'Issued to',
      render: (c) => (typeof c.userId === 'object' ? c.userId?.name ?? '—' : '—'),
    },
    {
      key: 'title',
      header: 'Certificate',
      render: (c) => (
        <span className="flex items-center gap-2 font-medium text-gray-800">
          <BadgeCheck size={15} className="text-sky-500" /> {c.title}
        </span>
      ),
    },
    {
      key: 'issued',
      header: 'Issued',
      render: (c) => (
        <span className="text-gray-500">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        canCertificate && c.status === 'issued' ? (
          <button
            onClick={async () => {
              await revokeCertificate(rid(c))
              setToast({ msg: 'Certificate revoked', tone: 'success' })
            }}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Revoke
          </button>
        ) : null,
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
      render: (s) =>
        canStructure && (
          <button
            onClick={() => deleteStructure(rid(s))}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
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
            {tab === 'structures' && canStructure && <Button onClick={() => setShowStructure(true)}><Plus size={15} /> Structure</Button>}
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
          emptyAction={canStructure ? <Button onClick={() => setShowStructure(true)}><Plus size={15} /> Structure</Button> : undefined}
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
        <DataTable
          columns={certificateColumns}
          rows={certificates}
          keyOf={(c) => c.publicId ?? c._id}
          emptyTitle="No certificates"
          emptyHint="Issue certificates for completions and achievements"
          emptyAction={canCertificate ? <Button onClick={() => setShowCertificate(true)}><Plus size={15} /> Certificate</Button> : undefined}
        />
      )}

      {/* Structure modal */}
      <ModalShell
        open={showStructure}
        onClose={() => setShowStructure(false)}
        title="New Salary Structure"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStructure(false)}>Cancel</Button>
            <Button onClick={submitStructure}>Create</Button>
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
              {['annual', 'semi_annual', 'quarterly', 'probation', 'project'].map((t) => (
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
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
