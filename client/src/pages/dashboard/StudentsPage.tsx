import { useMemo, useState } from 'react'
import { GraduationCap, Plus, Pencil, Trash2, Search } from 'lucide-react'

import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  type StudentProfile,
  type AcademicStatus,
} from '@/features/students/studentsApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/Modal'

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  active: 'green',
  graduating: 'blue',
  alumni: 'gray',
  suspended: 'yellow',
  dropped_out: 'red',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:bg-white'
const labelCls = 'mb-1 block text-sm font-medium text-gray-700'

/* -------------------------------------------------------------------------- */
/* CREATE                                                                      */
/* -------------------------------------------------------------------------- */

function CreateStudentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const { data: users } = useGetUsersQuery(undefined, { skip: !open })
  const { data: students } = useGetStudentsQuery(undefined, { skip: !open })
  const [createStudent, { isLoading }] = useCreateStudentMutation()

  const [userId, setUserId] = useState('')
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('')
  const [semester, setSemester] = useState('')
  const [error, setError] = useState('')

  // Student-role users that don't have a profile yet.
  const candidates = useMemo(() => {
    const linked = new Set(
      (students ?? []).map((s) => (typeof s.userId === 'object' ? s.userId._id : s.userId)),
    )
    return (users ?? []).filter((u) => u.role === 'student' && !linked.has(rid(u)))
  }, [users, students])

  if (!open) return null

  const submit = async () => {
    setError('')
    if (!userId || !enrollmentNumber.trim() || !course.trim()) {
      setError('User, enrollment number and course are required.')
      return
    }
    try {
      await createStudent({
        userId,
        enrollmentNumber: enrollmentNumber.trim(),
        course: course.trim(),
        year: year ? Number(year) : undefined,
        semester: semester ? Number(semester) : undefined,
      }).unwrap()
      setUserId('')
      setEnrollmentNumber('')
      setCourse('')
      setYear('')
      setSemester('')
      onCreated()
      onClose()
    } catch (e) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? 'Could not create student profile.',
      )
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add student profile" size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Student user</label>
          <select className={inputCls} value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">
              {candidates.length
                ? 'Select a student account…'
                : 'No unlinked student accounts — create one on the Users page first'}
            </option>
            {candidates.map((u) => (
              <option key={rid(u)} value={rid(u)}>
                {u.name} · {u.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Enrollment number *</label>
            <input
              className={inputCls}
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value)}
              placeholder="e.g. 2026-BCA-014"
            />
          </div>
          <div>
            <label className={labelCls}>Course *</label>
            <input
              className={inputCls}
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. BCA"
            />
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label className={labelCls}>Semester</label>
            <input
              type="number"
              min={1}
              max={12}
              className={inputCls}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            <Plus size={15} /> Create profile
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* EDIT                                                                        */
/* -------------------------------------------------------------------------- */

function EditStudentModal({
  student,
  onClose,
}: {
  student: StudentProfile
  onClose: () => void
}) {
  const [updateStudent, { isLoading }] = useUpdateStudentMutation()

  const [course, setCourse] = useState(student.course ?? '')
  const [branch, setBranch] = useState(student.branch ?? '')
  const [year, setYear] = useState(student.year ? String(student.year) : '')
  const [semester, setSemester] = useState(student.semester ? String(student.semester) : '')
  const [section, setSection] = useState(student.section ?? '')
  const [rollNumber, setRollNumber] = useState(student.rollNumber ?? '')
  const [academicStatus, setAcademicStatus] = useState<AcademicStatus>(
    student.academicStatus ?? 'active',
  )
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!course.trim()) {
      setError('Course is required.')
      return
    }
    try {
      await updateStudent({
        publicId: student.publicId ?? student._id,
        changes: {
          course: course.trim(),
          branch: branch.trim() || null,
          year: year ? Number(year) : null,
          semester: semester ? Number(semester) : null,
          section: section.trim() || null,
          rollNumber: rollNumber.trim() || null,
          academicStatus,
        },
      }).unwrap()
      onClose()
    } catch (e) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? 'Could not update student profile.',
      )
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit student profile" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Course *</label>
            <input className={inputCls} value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Branch</label>
            <input className={inputCls} value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Semester</label>
            <input
              type="number"
              min={1}
              max={12}
              className={inputCls}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Section</label>
            <input className={inputCls} value={section} onChange={(e) => setSection(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Roll number</label>
            <input
              className={inputCls}
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Academic status</label>
            <select
              className={inputCls}
              value={academicStatus}
              onChange={(e) => setAcademicStatus(e.target.value as AcademicStatus)}
            >
              <option value="active">Active</option>
              <option value="graduating">Graduating</option>
              <option value="alumni">Alumni</option>
              <option value="suspended">Suspended</option>
              <option value="dropped_out">Dropped out</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

export default function StudentsPage() {
  const { can } = usePermission()
  const { data: students, isLoading, isError, refetch } = useGetStudentsQuery()
  const [deleteStudent, { isLoading: deleting }] = useDeleteStudentMutation()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<StudentProfile | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StudentProfile | null>(null)

  const canCreate = can('student:create')
  const canUpdate = can('student:update')
  const canDelete = can('student:delete')

  const list = (students ?? []).filter((s) => {
    if (!search.trim()) return true
    const user = typeof s.userId === 'object' ? s.userId : null
    const hay = [user?.name, user?.email, s.enrollmentNumber, s.course]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(search.toLowerCase().trim())
  })

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteStudent(confirmDelete.publicId ?? confirmDelete._id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="Student profiles, enrollment numbers and academic details"
        actions={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add student profile
            </Button>
          ) : undefined
        }
      />

      {(students?.length ?? 0) > 0 && (
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, enrollment no. or course…"
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-black focus:bg-white"
          />
        </div>
      )}

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !students?.length ? (
        <EmptyState
          icon={<GraduationCap size={48} />}
          title="No student profiles yet"
          hint={
            canCreate
              ? 'Create student user accounts on the Users page first, then link a profile here.'
              : 'Create student user accounts from the Users page first.'
          }
        />
      ) : !list.length ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No matching students"
          hint="Try a different search term."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Enrollment No.</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Year / Semester</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {(canUpdate || canDelete) && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const user = typeof s.userId === 'object' ? s.userId : null
                return (
                  <tr
                    key={s.publicId ?? s._id}
                    className="border-b border-gray-50 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                          {(user?.name ?? '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{user?.email ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.enrollmentNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.course ?? '—'}
                      {s.branch ? <span className="text-gray-400"> · {s.branch}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.year ?? '—'} / {s.semester ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_COLOR[s.academicStatus ?? 'active'] ?? 'gray'}>
                        {(s.academicStatus ?? 'active').replace('_', ' ')}
                      </Badge>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {canUpdate && (
                            <button
                              onClick={() => setEditing(s)}
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-black hover:text-black"
                              title="Edit profile"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(s)}
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-300 hover:text-red-600"
                              title="Delete profile"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateStudentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}

      {editing && <EditStudentModal student={editing} onClose={() => setEditing(null)} />}

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Delete student profile?"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This removes the profile for{' '}
              <strong>
                {typeof confirmDelete.userId === 'object' ? confirmDelete.userId.name : 'this student'}
              </strong>{' '}
              (enrollment {confirmDelete.enrollmentNumber}). The linked user account stays active.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button onClick={handleDelete} loading={deleting}>
                <Trash2 size={15} /> Delete profile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
