import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'

import {
  useGetEmployeeDocumentsQuery,
  useCreateEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
  useDeleteEmployeeDocumentMutation,
  type EmployeeDocument,
} from '@/features/crm/crmApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, StatusBadge, ModalShell, Field, inputCls, Toast, type Column,
} from '@/components/ui/kit'

const DOC_TYPES = [
  'identity', 'address', 'education', 'experience', 'employment', 'joining', 'contract',
  'salary', 'bank', 'tax', 'insurance', 'medical', 'compliance', 'certificate', 'license', 'other',
]

const errorMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

/** HR records for employee paperwork. HR/admin manage; employees see their own. */
export default function EmployeeDocumentsPanel() {
  const { can } = usePermission()
  const canManage = can('employee_document:create')

  const { data, isLoading, isError, refetch } = useGetEmployeeDocumentsQuery()
  const { data: employees } = useGetUsersQuery({ role: 'employee' }, { skip: !canManage })

  const [createDocument] = useCreateEmployeeDocumentMutation()
  const [updateDocument] = useUpdateEmployeeDocumentMutation()
  const [deleteDocument] = useDeleteEmployeeDocumentMutation()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const [employee, setEmployee] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('identity')
  const [documentNumber, setDocumentNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  const rows = (data ?? []).filter(
    (d) => !search || d.title.toLowerCase().includes(search.toLowerCase()),
  )

  const submit = async () => {
    if (!employee || !title.trim()) return
    try {
      await createDocument({
        employeeUserId: employee,
        title: title.trim(),
        type,
        documentNumber: documentNumber.trim() || undefined,
        expiryDate: expiryDate || undefined,
        status: 'submitted',
        ...(fileUrl.trim() ? { fileUrl: fileUrl.trim(), fileName: title.trim() } : {}),
      }).unwrap()
      setOpen(false)
      setEmployee(''); setTitle(''); setType('identity'); setDocumentNumber(''); setExpiryDate(''); setFileUrl('')
      setToast({ msg: 'Document recorded', tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Could not save document'), tone: 'critical' })
    }
  }

  const review = async (d: EmployeeDocument, status: 'approved' | 'rejected') => {
    try {
      await updateDocument({ id: rid(d), changes: { status } }).unwrap()
      setToast({ msg: `Document ${status}`, tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Could not update document'), tone: 'critical' })
    }
  }

  const remove = async (d: EmployeeDocument) => {
    try {
      await deleteDocument(rid(d)).unwrap()
      setToast({ msg: 'Document deleted', tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Delete failed'), tone: 'critical' })
    }
  }

  const columns: Column<EmployeeDocument>[] = [
    {
      key: 'title',
      header: 'Document',
      render: (d) => (
        <div>
          <p className="font-medium text-gray-900">{d.title}</p>
          <p className="text-xs capitalize text-gray-400">
            {d.type ?? 'other'}{d.documentNumber ? ` · ${d.documentNumber}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (d) => (typeof d.employeeUserId === 'object' ? d.employeeUserId?.name ?? '—' : '—'),
    },
    {
      key: 'expiry',
      header: 'Expires',
      render: (d) => (
        <span className="text-gray-500">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</span>
      ),
    },
    {
      key: 'file',
      header: 'File',
      render: (d) =>
        d.versions?.length ? (
          <a
            href={d.versions[d.versions.length - 1].fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-700 underline"
          >
            Open
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (d) =>
        canManage && (
          <div className="flex justify-end gap-1.5">
            {['submitted', 'pending', 'under_review'].includes(d.status ?? '') && (
              <>
                <button
                  onClick={() => review(d, 'approved')}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                  title="Approve"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => review(d, 'rejected')}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Reject"
                >
                  <X size={14} />
                </button>
              </>
            )}
            <button
              onClick={() => remove(d)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
    },
  ]

  return (
    <>
      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search documents..."
        actions={
          canManage ? <Button onClick={() => setOpen(true)}><Plus size={15} /> Document</Button> : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(d) => rid(d)}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No documents"
        emptyHint={canManage ? 'Record contracts, ID proofs and certificates for your team' : 'Your documents will appear here'}
      />

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Record document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Employee" required>
              <select className={inputCls} value={employee} onChange={(e) => setEmployee(e.target.value)}>
                <option value="">Select employee</option>
                {(employees ?? []).map((u) => (
                  <option key={u._id} value={rid(u)}>{u.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Title" required>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Document number">
            <input className={inputCls} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </Field>
          <Field label="Expiry date">
            <input className={inputCls} type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="File link (optional)">
              <input
                className={inputCls}
                placeholder="https://..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </>
  )
}
