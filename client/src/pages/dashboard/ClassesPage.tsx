import { useState } from 'react'
import {
  ClipboardList, Plus, Pencil, Trash2, UserPlus, UserMinus, Clock, Users,
} from 'lucide-react'

import {
  useGetClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useEnrollStudentMutation,
  useRemoveStudentMutation,
  type SchoolClass,
} from '@/features/classes/classesApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingGrid, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ClassModal({
  open, onClose, onSubmit, loading, error, initial, canAssignTeacher,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (d: any) => void
  loading: boolean
  error: string
  initial: SchoolClass | null
  canAssignTeacher: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [room, setRoom] = useState(initial?.room ?? '')
  const [teacherId, setTeacherId] = useState(
    typeof initial?.teacherId === 'object' ? (initial?.teacherId as { publicId?: string })?.publicId ?? '' : initial?.teacherId ?? '',
  )
  const [maxStudents, setMaxStudents] = useState(initial?.maxStudents ?? 50)
  const [days, setDays] = useState<string[]>(initial?.schedule?.days ?? [])
  const [startTime, setStartTime] = useState(initial?.schedule?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.schedule?.endTime ?? '')

  const { data: users } = useGetUsersQuery({ role: 'teacher' }, { skip: !canAssignTeacher })
  const teachers = (users ?? []).filter((u) => u.role === 'teacher')

  const toggleDay = (d: string) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Edit — ${initial.name}` : 'New Class'} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({
            name, subject, description, room, maxStudents,
            teacherId: teacherId || undefined,
            schedule: { days, startTime, endTime },
          })
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Class Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Grade 10-A"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. Mathematics"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
        </div>

        {canAssignTeacher && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
              <option value="">— Assign later —</option>
              {teachers.map((t) => (
                <option key={rid(t)} value={rid(t)}>{t.name} ({t.email})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Room</label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="101"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Days</label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  days.includes(d) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Create Class'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ClassesPage() {
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const canCreate = role === 'super_admin' || role === 'admin' || role === 'teacher'
  const canAssignTeacher = role === 'super_admin' || role === 'admin'
  const canDelete = role === 'super_admin' || role === 'admin'
  const isStudent = role === 'student'

  const { data: classes, isLoading, isError, refetch } = useGetClassesQuery()
  const { data: students } = useGetUsersQuery({ role: 'student' }, { skip: !canAssignTeacher })

  const [createClass, { isLoading: createPending }] = useCreateClassMutation()
  const [updateClass, { isLoading: updatePending }] = useUpdateClassMutation()
  const [deleteClass] = useDeleteClassMutation()
  const [enrollStudent] = useEnrollStudentMutation()
  const [removeStudent] = useRemoveStudentMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editClass, setEditClass] = useState<SchoolClass | null>(null)
  const [manageClass, setManageClass] = useState<SchoolClass | null>(null)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (d: any) => {
    setFormError('')
    try {
      if (editClass) await updateClass({ id: rid(editClass), payload: d }).unwrap()
      else await createClass(d).unwrap()
      setShowCreate(false)
      setEditClass(null)
    } catch (e: any) {
      setFormError(e?.data?.message ?? 'Failed to save class')
    }
  }

  const teacherName = (c: SchoolClass) =>
    typeof c.teacherId === 'object' ? c.teacherId?.name ?? 'Unassigned' : 'Unassigned'

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStudent ? 'My Classes' : 'Classes'}
        subtitle={
          isStudent ? 'Classes you are enrolled in'
          : role === 'teacher' ? 'Classes you teach'
          : 'Manage classes and enrollments'
        }
        actions={canCreate ? (
          <Button onClick={() => { setShowCreate(true); setFormError('') }}>
            <Plus size={16} /> New Class
          </Button>
        ) : undefined}
      />

      {isLoading ? (
        <LoadingGrid />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !classes?.length ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="No classes yet"
          hint={canCreate ? 'Create your first class' : 'No classes assigned yet'}
          action={canCreate ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Class</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={rid(c)} className="group rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-400">{c.subject}{c.room ? ` · Room ${c.room}` : ''}</p>
                </div>
                <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {canCreate && (
                    <button onClick={() => setEditClass(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black" title="Edit">
                      <Pencil size={14} />
                    </button>
                  )}
                  {canAssignTeacher && (
                    <button onClick={() => setManageClass(c)} className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50" title="Manage students">
                      <Users size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => deleteClass(rid(c))} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge color="blue">{c.studentIds?.length ?? 0} / {c.maxStudents ?? 50}</Badge>
                <Badge color="gray">{teacherName(c)}</Badge>
                {c.schedule?.startTime && (
                  <Badge color="purple"><Clock size={10} className="mr-1 inline" />{c.schedule.startTime}</Badge>
                )}
              </div>

              {c.schedule?.days?.length ? (
                <p className="text-xs text-gray-400">{c.schedule.days.map((d) => d.slice(0, 3)).join(' · ')}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {(showCreate || editClass) && (
        <ClassModal
          open={showCreate || !!editClass}
          onClose={() => { setShowCreate(false); setEditClass(null) }}
          onSubmit={handleSubmit}
          loading={createPending || updatePending}
          error={formError}
          initial={editClass}
          canAssignTeacher={canAssignTeacher}
        />
      )}

      {/* Enrolled students manager */}
      <Modal
        open={!!manageClass}
        onClose={() => setManageClass(null)}
        title={`Students — ${manageClass?.name ?? ''}`}
        size="md"
      >
        {manageClass && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Enrolled ({manageClass.studentIds?.length ?? 0})
              </p>
              <div className="space-y-1.5">
                {(manageClass.studentIds ?? []).length === 0 && (
                  <p className="text-sm text-gray-400">No students enrolled yet.</p>
                )}
                {(manageClass.studentIds ?? []).map((s: any) => (
                  <div key={s.publicId ?? s._id ?? s} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{s.email ?? ''}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const updated = await removeStudent({ id: rid(manageClass), studentId: s.publicId ?? s._id ?? s }).unwrap()
                        setManageClass(updated)
                      }}
                      className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50"
                      title="Remove"
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Enroll a student</p>
              <div className="space-y-1.5">
                {(students ?? [])
                  .filter((s) => !(manageClass.studentIds ?? []).some((e: any) => (e.publicId ?? e._id ?? e) === (s.publicId ?? s._id)))
                  .slice(0, 8)
                  .map((s) => (
                    <div key={rid(s)} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = await enrollStudent({ id: rid(manageClass), studentId: rid(s) }).unwrap()
                          setManageClass(updated)
                        }}
                        className="rounded-lg p-1.5 text-blue-500 transition hover:bg-blue-50"
                        title="Enroll"
                      >
                        <UserPlus size={15} />
                      </button>
                    </div>
                  ))}
                {(students ?? []).length === 0 && (
                  <p className="text-sm text-gray-400">No student accounts yet — create them on the Users page first.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
