import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import {
  useGetEnrollmentsQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentStatusMutation,
  useDeleteEnrollmentMutation,
  type Enrollment,
} from '@/features/platform/platformApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, SelectFilter, StatusBadge, ModalShell, Field, inputCls, Toast,
  type Column,
} from '@/components/ui/kit'

const STATUSES = ['active', 'completed', 'suspended', 'withdrawn']

export default function EnrollmentsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = ['super_admin', 'admin'].includes(user?.role ?? '')
  const isStudent = user?.role === 'student'

  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: enrollments, isLoading, isError, refetch } = useGetEnrollmentsQuery()
  const { data: students } = useGetUsersQuery({ role: 'student' }, { skip: !canManage })
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canManage })

  const [createEnrollment] = useCreateEnrollmentMutation()
  const [updateStatus] = useUpdateEnrollmentStatusMutation()
  const [deleteEnrollment] = useDeleteEnrollmentMutation()

  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')

  const filtered = useMemo(
    () => (enrollments ?? []).filter((e) => !statusFilter || e.status === statusFilter),
    [enrollments, statusFilter],
  )

  const submit = async () => {
    if (!studentId) return
    try {
      await createEnrollment({ studentId, classId: classId || undefined }).unwrap()
      setShowCreate(false)
      setStudentId(''); setClassId('')
      setToast({ msg: 'Student enrolled', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Enrollment failed', tone: 'critical' })
    }
  }

  const changeStatus = async (e: Enrollment, status: string) => {
    try {
      await updateStatus({ id: e.publicId ?? e._id, status }).unwrap()
      setToast({ msg: `Marked ${status}`, tone: 'success' })
    } catch {
      setToast({ msg: 'Update failed', tone: 'critical' })
    }
  }

  const columns: Column<Enrollment>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (e) => (
        <div>
          <p className="font-medium text-gray-900">{typeof e.studentId === 'object' ? e.studentId?.name ?? '—' : '—'}</p>
          <p className="text-xs text-gray-400">{typeof e.studentId === 'object' ? e.studentId?.userCode ?? e.studentId?.email ?? '' : ''}</p>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (e) => (typeof e.classId === 'object' ? e.classId?.name ?? '—' : '—'),
    },
    { key: 'type', header: 'Type', render: (e) => <span className="capitalize text-gray-500">{e.type}</span> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (e) =>
        canManage && (
          <div className="flex justify-end gap-1.5">
            {e.status === 'active' && (
              <button
                onClick={(ev) => { ev.stopPropagation(); changeStatus(e, 'completed') }}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Complete
              </button>
            )}
            {['super_admin'].includes(user?.role ?? '') && (
              <button
                onClick={(ev) => { ev.stopPropagation(); deleteEnrollment(e.publicId ?? e._id) }}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
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
        title={isStudent ? 'My Enrollments' : 'Enrollments'}
        subtitle={isStudent ? 'Classes and programs you are enrolled in' : 'Manage class and program enrollments'}
        actions={canManage ? <Button onClick={() => setShowCreate(true)}><Plus size={15} /> Enroll Student</Button> : undefined}
      />

      <Toolbar
        filters={
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        keyOf={(e) => e.publicId ?? e._id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No enrollments"
        emptyHint={canManage ? 'Enroll students into classes or programs' : 'Your enrollments will appear here'}
        emptyAction={canManage ? <Button onClick={() => setShowCreate(true)}><Plus size={15} /> Enroll Student</Button> : undefined}
      />

      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Enroll Student"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit}>Enroll</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Student" required>
            <select className={inputCls} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Select student —</option>
              {(students ?? []).map((s) => (
                <option key={rid(s)} value={rid(s)}>{s.name} ({s.userCode ?? s.email})</option>
              ))}
            </select>
          </Field>
          <Field label="Class">
            <select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">— None —</option>
              {(classes ?? []).map((c) => (
                <option key={rid(c)} value={rid(c)}>{c.name} · {c.subject}</option>
              ))}
            </select>
          </Field>
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
