// src/pages/dashboard/TeachersPage.tsx

import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GraduationCap,
  Users,
  UserCheck,
  X,
  Check,
  ChevronDown,
  BookOpen,
  BriefcaseBusiness,
  Mail,
  Phone,
} from 'lucide-react'

import {
  useGetTeachersQuery,
  useCreateTeacherMutation,
} from '@/features/teacher/teachersApi'

import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'

import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'
import {
  LoadingGrid,
  ErrorState,
  EmptyState,
} from '@/components/ui/StateViews'

type Teacher = {
  _id: string
  userId:
    | {
        _id: string
        name: string
        email: string
        userCode?: string
      }
    | string
    | null
  instituteId:
    | {
        _id: string
        name: string
        type?: string
      }
    | string
    | null
  subject?: string
  qualifications?: string
  experience?: number | string
  createdAt?: string
}

export default function TeachersPage() {
  const authUser = useAppSelector((s) => s.auth.user)

  const canManage = [
    'super_admin',
    'admin',
    'principal',
    'hr',
  ].includes(authUser?.role ?? '')

  const {
    data: teachers = [],
    isLoading,
    isError,
    refetch,
  } = useGetTeachersQuery()

  const { data: users = [] } = useGetUsersQuery()

  const [createTeacher, { isLoading: createPending }] =
    useCreateTeacherMutation()

  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    userId: '',
    subject: '',
    qualifications: '',
    experience: '',
  })

  const availableTeachers = useMemo(() => {
    const linkedUserIds = new Set(
      teachers.map((teacher: Teacher) =>
        typeof teacher.userId === 'object' && teacher.userId
          ? teacher.userId._id
          : teacher.userId,
      ),
    )

    return users.filter(
      (user: any) =>
        user.role === 'teacher' &&
        !linkedUserIds.has(user._id) &&
        !linkedUserIds.has(user.publicId),
    )
  }, [users, teachers])

  const subjects = useMemo(() => {
    const values = teachers
      .map((teacher: Teacher) => teacher.subject?.trim())
      .filter(Boolean) as string[]

    return [...new Set(values)].sort()
  }, [teachers])

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return teachers.filter((teacher: Teacher) => {
      const person =
        typeof teacher.userId === 'object' && teacher.userId
          ? teacher.userId
          : null

      const matchesSearch =
        !query ||
        person?.name?.toLowerCase().includes(query) ||
        person?.email?.toLowerCase().includes(query) ||
        person?.userCode?.toLowerCase().includes(query) ||
        teacher.subject?.toLowerCase().includes(query) ||
        teacher.qualifications?.toLowerCase().includes(query)

      const matchesSubject =
        subjectFilter === 'all' ||
        teacher.subject === subjectFilter

      return matchesSearch && matchesSubject
    })
  }, [teachers, search, subjectFilter])

  const resetForm = () => {
    setForm({
      userId: '',
      subject: '',
      qualifications: '',
      experience: '',
    })

    setError('')
  }

  const openCreate = () => {
    resetForm()
    setShowCreate(true)
  }

  const closeCreate = () => {
    if (createPending) return

    setShowCreate(false)
    resetForm()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.userId) {
      setError('Select a teacher')
      return
    }

    setError('')

    try {
      await createTeacher({
        userId: form.userId,
        subject: form.subject.trim() || undefined,
        qualifications:
          form.qualifications.trim() || undefined,
        experience:
          form.experience.trim()
            ? Number(form.experience)
            : undefined,
      }).unwrap()

      closeCreate()
    } catch (e: any) {
      setError(
        e?.data?.message ??
          e?.error?.data?.message ??
          'Failed to create teacher profile',
      )
    }
  }

  const totalExperience = useMemo(() => {
    const values = teachers
      .map((teacher: Teacher) =>
        Number(teacher.experience ?? 0),
      )
      .filter((value: number) => !Number.isNaN(value))

    if (!values.length) return 0

    return Math.round(
      values.reduce((a: number, b: number) => a + b, 0),
    )
  }, [teachers])

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto max-w-[1500px] px-6 py-7 lg:px-8">
        <PageHeader
          title="Teachers"
          subtitle="Manage teaching staff, subjects and professional profiles"
          actions={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus size={16} />
                Add teacher
              </Button>
            ) : undefined
          }
        />

        {/* STATS */}
        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={<GraduationCap size={18} />}
            label="Total teachers"
            value={teachers.length}
            description="Teaching staff"
          />

          <StatCard
            icon={<BookOpen size={18} />}
            label="Subjects"
            value={subjects.length}
            description="Currently assigned"
          />

          <StatCard
            icon={<BriefcaseBusiness size={18} />}
            label="Experience"
            value={`${totalExperience} yrs`}
            description="Combined experience"
          />
        </div>

        {/* TOOLBAR */}
        <div className="mt-7 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search teachers, email, ID or subject..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={subjectFilter}
                  onChange={(e) =>
                    setSubjectFilter(e.target.value)
                  }
                  className="h-10 appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-9 text-sm outline-none focus:border-gray-400"
                >
                  <option value="all">
                    All subjects
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {canManage && (
                <Button onClick={openCreate}>
                  <Plus size={15} />
                  Add
                </Button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {filteredTeachers.length}{' '}
                {filteredTeachers.length === 1
                  ? 'teacher'
                  : 'teachers'}
              </span>

              {(search ||
                subjectFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('')
                    setSubjectFilter('all')
                  }}
                  className="font-medium text-gray-900 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-4">
          {isLoading ? (
            <LoadingGrid />
          ) : isError ? (
            <ErrorState
              onRetry={() => refetch()}
            />
          ) : !filteredTeachers.length ? (
            <div className="rounded-2xl border border-gray-200 bg-white py-20">
              <EmptyState
                icon={
                  <GraduationCap size={44} />
                }
                title={
                  search || subjectFilter !== 'all'
                    ? 'No teachers found'
                    : 'No teacher profiles yet'
                }
                hint={
                  search || subjectFilter !== 'all'
                    ? 'Try changing your search or filters'
                    : canManage
                      ? 'Create a teacher profile for one of your teacher accounts'
                      : 'Teacher profiles will appear here'
                }
                action={
                  canManage &&
                  !search &&
                  subjectFilter === 'all' ? (
                    <Button onClick={openCreate}>
                      <Plus size={16} />
                      Add teacher
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* HEADER */}
              <div className="hidden grid-cols-[minmax(300px,2fr)_180px_minmax(180px,1fr)_130px_60px] border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:grid">
                <span>Teacher</span>
                <span>Subject</span>
                <span>Qualifications</span>
                <span>Experience</span>
                <span />
              </div>

              <div className="divide-y divide-gray-100">
                {filteredTeachers.map(
                  (teacher: Teacher) => {
                    const person =
                      typeof teacher.userId ===
                        'object' &&
                      teacher.userId
                        ? teacher.userId
                        : null

                    const id =
                      teacher._id

                    const initials =
                      person?.name
                        ?.split(' ')
                        .map(
                          (part) =>
                            part[0],
                        )
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() ||
                      '?'

                    return (
                      <div
                        key={id}
                        className="group grid gap-4 px-5 py-5 transition hover:bg-gray-50/60 md:grid-cols-[minmax(300px,2fr)_180px_minmax(180px,1fr)_130px_60px] md:items-center"
                      >
                        {/* PERSON */}
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                            {initials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-sm font-semibold text-gray-900">
                                {person?.name ??
                                  'Unknown teacher'}
                              </h3>

                              <Badge color="green">
                                Teacher
                              </Badge>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                              {person?.email && (
                                <span className="flex items-center gap-1">
                                  <Mail
                                    size={12}
                                  />
                                  {
                                    person.email
                                  }
                                </span>
                              )}

                              {person?.userCode && (
                                <span>
                                  ID:{' '}
                                  {
                                    person.userCode
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* SUBJECT */}
                        <div>
                          <p className="text-xs text-gray-400 md:hidden">
                            Subject
                          </p>

                          {teacher.subject ? (
                            <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                              {
                                teacher.subject
                              }
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not assigned
                            </span>
                          )}
                        </div>

                        {/* QUALIFICATION */}
                        <div className="min-w-0">
                          <p className="truncate text-sm text-gray-700">
                            {teacher.qualifications ||
                              'Not provided'}
                          </p>
                        </div>

                        {/* EXPERIENCE */}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {teacher.experience !=
                            null
                              ? `${teacher.experience} ${
                                  Number(
                                    teacher.experience,
                                  ) === 1
                                    ? 'year'
                                    : 'years'
                                }`
                              : '—'}
                          </p>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              setMenuId(
                                menuId === id
                                  ? null
                                  : id,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <MoreHorizontal
                              size={18}
                            />
                          </button>

                          {menuId === id && (
                            <>
                              <button
                                className="fixed inset-0 z-10 cursor-default"
                                onClick={() =>
                                  setMenuId(
                                    null,
                                  )
                                }
                              />

                              <div className="absolute z-20 mt-10 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                                <button
                                  onClick={() =>
                                    setMenuId(
                                      null,
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Pencil
                                    size={15}
                                  />
                                  Edit profile
                                </button>

                                <button
                                  onClick={() =>
                                    setMenuId(
                                      null,
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Users
                                    size={15}
                                  />
                                  View teacher
                                </button>

                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  onClick={() =>
                                    setMenuId(
                                      null,
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                  Remove profile
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          )}
        </div>

        {/* CREATE MODAL */}
        <Modal
          open={showCreate}
          onClose={closeCreate}
          title="Add teacher"
          size="md"
        >
          <form
            onSubmit={handleCreate}
            className="space-y-5"
          >
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                  <GraduationCap
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Create teacher profile
                  </p>

                  <p className="text-xs text-gray-500">
                    Link an existing teacher account
                    with professional information.
                  </p>
                </div>
              </div>
            </div>

            {/* USER */}
            <FormField
              label="Teacher account"
              required
            >
              <div className="relative">
                <select
                  value={form.userId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      userId:
                        e.target.value,
                    }))
                  }
                  required
                  className="form-input appearance-none pr-10"
                >
                  <option value="">
                    Select teacher
                  </option>

                  {availableTeachers.map(
                    (teacher: any) => (
                      <option
                        key={rid(teacher)}
                        value={rid(
                          teacher,
                        )}
                      >
                        {teacher.name} —{' '}
                        {teacher.email}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {!availableTeachers.length && (
                <p className="mt-2 text-xs text-amber-600">
                  No unlinked teacher accounts are
                  available.
                </p>
              )}
            </FormField>

            {/* SUBJECT */}
            <FormField label="Primary subject">
              <input
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subject:
                      e.target.value,
                  }))
                }
                placeholder="e.g. Mathematics"
                className="form-input"
              />
            </FormField>

            {/* QUALIFICATION */}
            <FormField label="Qualifications">
              <input
                value={
                  form.qualifications
                }
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    qualifications:
                      e.target.value,
                  }))
                }
                placeholder="e.g. M.Sc Mathematics, B.Ed"
                className="form-input"
              />
            </FormField>

            {/* EXPERIENCE */}
            <FormField label="Experience">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={
                    form.experience
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      experience:
                        e.target.value,
                    }))
                  }
                  placeholder="e.g. 5"
                  className="form-input pr-16"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  years
                </span>
              </div>
            </FormField>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Cancel
              </button>

              <Button
                type="submit"
                loading={createPending}
              >
                <Check size={16} />
                Create teacher
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(229 231 235);
          background: white;
          padding: 0.65rem 0.8rem;
          font-size: 0.875rem;
          color: rgb(17 24 39);
          outline: none;
          transition: all 150ms ease;
        }

        .form-input::placeholder {
          color: rgb(156 163 175);
        }

        .form-input:focus {
          border-color: rgb(17 24 39);
          box-shadow: 0 0 0 3px rgb(17 24 39 / 0.05);
        }
      `}</style>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  description: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  )
}