// pages/dashboard/UserDetailPage.tsx

import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Edit3,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Save,
  Shield,
  User,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  useGetUserDetailQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetReportingManagersQuery,
  useGetUsersQuery
} from '@/features/users/usersApi'
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi'

import type {
  UpdateUserPayload,
  UserDetailResponse,
} from '@/features/users/usersApi'

type Tab =
  | 'overview'
  | 'profile'
  | 'employment'
  | 'academic'
  | 'security'

const EMPTY = 'Not provided'

const formatDate = (
  value?: string | null
) => {
  if (!value) return EMPTY

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}

const formatDateTime = (
  value?: string | null
) => {
  if (!value) return EMPTY

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

const roleLabel = (role?: string) => {
  if (!role) return 'User'

  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    )
}

const getInitials = (
  name?: string | null
) => {
  if (!name) return 'U'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase()
}

const Field = ({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: React.ReactNode
  mono?: boolean
}) => (
  <div className="rounded-xl border border-slate-100 bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>

    <div
      className={`mt-1 text-sm font-medium text-slate-900 ${
        mono ? 'font-mono' : ''
      }`}
    >
      {value ?? '—'}
    </div>
  </div>
)

const Section = ({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Icon
            size={18}
            className="text-slate-700"
          />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-950">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>

    <div className="p-6">
      {children}
    </div>
  </section>
)

const StatusBadge = ({
  status,
}: {
  status?: string
}) => {
  const active = status === 'active'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? 'bg-emerald-500'
            : 'bg-slate-400'
        }`}
      />

      {status
        ? status.charAt(0).toUpperCase() +
          status.slice(1)
        : 'Unknown'}
    </span>
  )
}

export default function UserDetailPage() {
  const navigate = useNavigate()

  const { publicId } = useParams<{
    publicId: string
  }>()

  const id = publicId ?? ''

  const {
    data: user,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetUserByIdQuery(id, {
    skip: !id,
  })
const { data: users = [] } = useGetUsersQuery({
  instituteId:
    typeof user?.instituteId === 'string'
      ? user.instituteId
      : user?.instituteId?._id,
})

const managers = users.filter((manager) => {
  const managerInstituteId =
    typeof manager.instituteId === 'object' &&
    manager.instituteId !== null
      ? manager.instituteId._id
      : manager.instituteId

  const userInstituteId =
    typeof user?.instituteId === 'object' &&
    user.instituteId !== null
      ? user.instituteId._id
      : user?.instituteId

  return (
    manager._id !== user?._id &&
    managerInstituteId &&
    userInstituteId &&
    managerInstituteId === userInstituteId &&
    ['super_admin', 'admin', 'principal', 'hr'].includes(
      manager.role
    )
  )
})

const { data: departments = [] } =
  useGetDepartmentsQuery()
  const [updateUser, updateState] =
    useUpdateUserMutation()

  const [activeTab, setActiveTab] =
    useState<Tab>('overview')

  const [editing, setEditing] =
    useState(false)

  const [copied, setCopied] =
    useState(false)

  const [menuOpen, setMenuOpen] =
    useState(false)

const [form, setForm] = useState({
  name: '',
  displayName: '',
  email: '',
  status: 'active' as 'active' | 'inactive',

  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',

  department: '',
  designation: '',
  reportingManager: '',
  workLocation: '',
  workEmail: '',
  dateOfJoining: '',
  probationEndDate: '',
  skills: '',

  rollNumber: '',
  grade: '',
  section: '',
  guardianName: '',
  guardianPhone: '',
  admissionDate: '',
})
    
const { data: reportingManagers = [], isLoading: managersLoading } =
  useGetReportingManagersQuery(
    user?.instituteId && typeof user.instituteId !== 'string'
      ? {
          instituteId: user.instituteId._id,
        }
      : undefined
  )
useEffect(() => {
  if (!user) return

  const department =
    typeof user.employment?.department === 'object' &&
    user.employment.department !== null
      ? user.employment.department._id
      : user.employment?.department ?? ''

  setForm({
    name: user.name ?? '',
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    status: user.status === 'inactive' ? 'inactive' : 'active',

    phone: user.profile?.phone ?? '',
    alternatePhone: user.profile?.alternatePhone ?? '',
    address: user.profile?.address ?? '',
    city: user.profile?.city ?? '',
    state: user.profile?.state ?? '',
    country: user.profile?.country ?? '',
    pincode: user.profile?.pincode ?? '',

    department,

    designation: user.employment?.designation ?? '',

    reportingManager:
      typeof user.employment?.reportingManager === 'object' &&
      user.employment.reportingManager !== null
        ? user.employment.reportingManager._id
        : user.employment?.reportingManager ?? '',

    workLocation: user.employment?.workLocation ?? '',
    workEmail: user.employment?.workEmail ?? '',

    dateOfJoining: user.employment?.dateOfJoining
      ? user.employment.dateOfJoining.slice(0, 10)
      : '',

    probationEndDate: user.employment?.probationEndDate
      ? user.employment.probationEndDate.slice(0, 10)
      : '',

    skills: user.employment?.skills?.join(', ') ?? '',

    rollNumber: user.academic?.rollNumber ?? '',
    grade: user.academic?.grade ?? '',
    section: user.academic?.section ?? '',
    guardianName: user.academic?.guardianName ?? '',
    guardianPhone: user.academic?.guardianPhone ?? '',

    admissionDate: user.academic?.admissionDate
      ? user.academic.admissionDate.slice(0, 10)
      : '',
  })
}, [user])

  const initials = useMemo(
    () => getInitials(user?.displayName || user?.name),
    [user]
  )

 const saveChanges = async () => {
  if (!user || !form) return

  try {
    const payload: UpdateUserPayload = {
      name: form.name,
      displayName: form.displayName || undefined,
      status: form.status,

      profile: {
        phone: form.phone || undefined,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        pincode: form.pincode || undefined,
      },

      employment: {
        department: form.department || undefined,
        designation: form.designation || undefined,
        reportingManager: form.reportingManager || undefined,
        workLocation: form.workLocation || undefined,
        workEmail: form.workEmail || undefined,
        dateOfJoining: form.dateOfJoining || undefined,
        probationEndDate: form.probationEndDate || undefined,
        skills: form.skills
          ? form.skills
              .split(',')
              .map((x: string) => x.trim())
              .filter(Boolean)
          : [],
      },

      academic: {
        rollNumber: form.rollNumber || undefined,
        grade: form.grade || undefined,
        section: form.section || undefined,
        guardianName: form.guardianName || undefined,
        guardianPhone: form.guardianPhone || undefined,
        admissionDate: form.admissionDate || undefined,
      },
    }

    if (
      typeof form.email === 'string' &&
      form.email.trim() !== '' &&
      form.email.trim() !== user.email
    ) {
      payload.email = form.email.trim()
    }

    await updateUser({
      id,
      payload,
    }).unwrap()

    setEditing(false)

    await refetch()
  } catch (error) {
    console.error('Unable to update user:', error)
  }
}

  const copyPublicId = async () => {
    if (!user?.publicId) return

    await navigator.clipboard.writeText(
      user.publicId
    )

    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 1600)
  }

  const updateField = (
    field: string,
    value: string
  ) => {
    setForm((previous: any) => ({
      ...previous,
      [field]: value,
    }))
  }

  const deactivate = async () => {
    if (!user) return

    if (
      !window.confirm(
        `Deactivate ${user.name}?`
      )
    ) {
      return
    }

    try {
      await updateUser({
        id,
        payload: {
          status: 'inactive',
        },
      }).unwrap()

      setMenuOpen(false)

      await refetch()
    } catch {
      // RTK Query state handles the error
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-[1500px] animate-pulse space-y-6">
          <div className="h-10 w-40 rounded-lg bg-slate-200" />

          <div className="h-48 rounded-2xl bg-slate-200" />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="h-[500px] rounded-2xl bg-slate-200" />

            <div className="h-[300px] rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="min-h-[70vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <X className="text-red-600" />
          </div>

          <h2 className="text-lg font-bold text-slate-950">
            Unable to load user
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {(error as any)?.data?.message ||
              'The requested user could not be found.'}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
            >
              Go back
            </button>

            <button
              onClick={() => refetch()}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isSaving =
    updateState.isLoading

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Users
          </button>

          <div className="flex items-center gap-2">
            {isFetching && (
              <span className="mr-2 text-xs text-slate-400">
                Refreshing...
              </span>
            )}

            {!editing ? (
              <>
                <button
                  onClick={() =>
                    setEditing(true)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Edit3 size={16} />
                  Edit user
                </button>

                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpen((x) => !x)
                    }
                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {user.status ===
                      'active' ? (
                        <button
                          onClick={deactivate}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Deactivate user
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await updateUser({
                              id,
                              payload: {
                                status:
                                  'active',
                              },
                            }).unwrap()

                            setMenuOpen(false)

                            await refetch()
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          Activate user
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    setEditing(false)
                  }
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Save size={16} />

                  {isSaving
                    ? 'Saving...'
                    : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800" />

          <div className="-mt-11 px-6 pb-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-950 text-2xl font-bold text-white shadow-lg">
                  {initials}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                      {user.displayName ||
                        user.name ||
                        EMPTY}
                    </h1>

                    <StatusBadge
                      status={user.status}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound size={14} />
                      {roleLabel(
                        user.role
                      )}
                    </span>

                    {user.userCode && (
                      <span className="font-mono text-xs">
                        {user.userCode}
                      </span>
                    )}

                    {user.publicId && (
                      <span className="font-mono text-xs text-slate-400">
                        {user.publicId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {roleLabel(user.role)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {user.status
                      ? user.status
                          .charAt(0)
                          .toUpperCase() +
                        user.status.slice(1)
                      : EMPTY}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(
                      user.createdAt
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Last login
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(
                      user.lastLogin
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-b border-slate-200">
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                [
                  'overview',
                  'Overview',
                ],
                [
                  'profile',
                  'Profile',
                ],
                [
                  'employment',
                  'Employment',
                ],
                [
                  'academic',
                  'Academic',
                ],
                [
                  'security',
                  'Security',
                ],
              ] as [
                Tab,
                string
              ][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  setActiveTab(key)
                }
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === key
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-5">
            {activeTab ===
              'overview' && (
              <>
                <Section
                  icon={User}
                  title="Profile"
                  description="Identity and contact information"
                  action={
                    !editing && (
                      <button
                        onClick={() => {
                          setEditing(true)
                          setActiveTab(
                            'profile'
                          )
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-950"
                      >
                        Edit
                      </button>
                    )
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.name ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'name',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.name
                        )
                      }
                    />

                    <Field
                      label="Display name"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.displayName ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'displayName',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.displayName
                        )
                      }
                    />

                    <Field
                      label="Email"
                      value={
                        editing ? (
                          <input
                            type="email"
                            value={
                              form?.email ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'email',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.email
                        )
                      }
                    />

                    <Field
                      label="Phone"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.phone ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'phone',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.profile
                            ?.phone
                        )
                      }
                    />

                    <Field
                      label="City"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.city ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'city',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.profile
                            ?.city
                        )
                      }
                    />

                    <Field
                      label="State"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.state ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'state',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.profile
                            ?.state
                        )
                      }
                    />

                    <Field
                      label="Country"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.country ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'country',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.profile
                            ?.country
                        )
                      }
                    />

                    <Field
                      label="Pincode"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.pincode ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'pincode',
                                e.target
                                  .value
                              )
                            }
                            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                        ) : (
                          user.profile
                            ?.pincode
                        )
                      }
                    />
                  </div>
                </Section>

                <Section
                  icon={BriefcaseBusiness}
                  title="Role & employment"
                  description="Current organizational assignment"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Role"
                      value={roleLabel(
                        user.role
                      )}
                    />

<Field
  label="Department"
  value={
    user.employment?.department &&
    typeof user.employment.department === 'object'
      ? `${user.employment.department.name}${
          user.employment.department.code
            ? ` (${user.employment.department.code})`
            : ''
        }`
      : 'Not assigned'
  }
/>

                    <Field
                      label="Designation"
                      value={
                        user.employment
                          ?.designation
                      }
                    />

                    <Field
                      label="Work location"
                      value={
                        user.employment
                          ?.workLocation
                      }
                    />

                    <Field
                      label="Work email"
                      value={
                        user.employment
                          ?.workEmail
                      }
                    />

                    <Field
                      label="Joining date"
                      value={formatDate(
                        user.employment
                          ?.dateOfJoining
                      )}
                    />
                  </div>
                </Section>

                {user.role ===
                  'student' && (
                  <Section
                    icon={GraduationCap}
                    title="Academic profile"
                    description="Student enrollment and academic information"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Enrollment / user code"
                        value={
                          user.userCode
                        }
                        mono
                      />

                      <Field
                        label="Roll number"
                        value={
                          user.academic
                            ?.rollNumber
                        }
                      />

                      <Field
                        label="Grade"
                        value={
                          user.academic
                            ?.grade
                        }
                      />

                      <Field
                        label="Section"
                        value={
                          user.academic
                            ?.section
                        }
                      />
                    </div>
                  </Section>
                )}
              </>
            )}

            {activeTab ===
              'profile' && (
              <Section
                icon={User}
                title="Profile information"
                description="Personal identity and contact details"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.name ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'name',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.name
                      )
                    }
                  />

                  <Field
                    label="Display name"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.displayName ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'displayName',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.displayName
                      )
                    }
                  />

                  <Field
                    label="Email"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.email ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'email',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.email
                      )
                    }
                  />

                  <Field
                    label="Phone"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.phone ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'phone',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.profile
                          ?.phone
                      )
                    }
                  />

                  <Field
                    label="Alternate phone"
                    value={
                      user.profile
                        ?.alternatePhone
                    }
                  />

                  <Field
                    label="Address"
                    value={
                      user.profile
                        ?.address
                    }
                  />

                  <Field
                    label="City"
                    value={
                      user.profile?.city
                    }
                  />

                  <Field
                    label="State"
                    value={
                      user.profile?.state
                    }
                  />

                  <Field
                    label="Country"
                    value={
                      user.profile
                        ?.country
                    }
                  />

                  <Field
                    label="Pincode"
                    value={
                      user.profile
                        ?.pincode
                    }
                  />

                  <Field
                    label="Date of birth"
                    value={formatDate(
                      user.profile
                        ?.dateOfBirth
                    )}
                  />

                  <Field
                    label="Gender"
                    value={
                      user.profile?.gender
                    }
                  />
                </div>
              </Section>
            )}

            {activeTab ===
              'employment' && (
              <Section
                icon={BriefcaseBusiness}
                title="Employment"
                description="Employment classification and organization assignment"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Employee ID"
                    value={
                      user.employment
                        ?.employeeId ||
                      user.userCode
                    }
                    mono
                  />

<Field
  label="Department"
  value={
    editing ? (
      <select
        value={form?.department ?? ''}
        onChange={(e) =>
          updateField('department', e.target.value)
        }
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        <option value="">Select department</option>

        {departments
          .filter((department) => department.status === 'active')
          .map((department) => (
            <option
              key={department.publicId ?? department._id}
              value={department.publicId ?? department._id}
            >
              {department.name}
              {department.code ? ` (${department.code})` : ''}
            </option>
          ))}
      </select>
    ) : typeof user.employment?.department === 'object' &&
      user.employment.department !== null ? (
      user.employment.department.name
    ) : (
      user.employment?.department || 'Not assigned'
    )
  }
/>

                  <Field
                    label="Designation"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.designation ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'designation',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.employment
                          ?.designation
                      )
                    }
                  />

<Field
  label="Reporting manager"
  value={
    editing ? (
      <select
        value={form?.reportingManager ?? ''}
        onChange={(e) =>
          updateField('reportingManager', e.target.value)
        }
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        <option value="">Select reporting manager</option>

        {managers
          .filter(
            (manager: any) =>
              manager._id !== user._id &&
              ['super_admin', 'admin', 'principal', 'hr'].includes(
                manager.role
              )
          )
          .map((manager: any) => (
            <option key={manager._id} value={manager.publicId}>
              {manager.name} — {manager.role}
            </option>
          ))}
      </select>
    ) : typeof user.employment?.reportingManager === 'object' &&
      user.employment.reportingManager !== null ? (
      user.employment.reportingManager.name
    ) : (
      user.employment?.reportingManager || 'Not assigned'
    )
  }
/>
                  <Field
                    label="Work location"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.workLocation ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'workLocation',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.employment
                          ?.workLocation
                      )
                    }
                  />

                  <Field
                    label="Work email"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.workEmail ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'workEmail',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.employment
                          ?.workEmail
                      )
                    }
                  />

                  <Field
                    label="Joining date"
                    value={
                      editing ? (
                        <input
                          type="date"
                          value={
                            form?.dateOfJoining ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'dateOfJoining',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        formatDate(
                          user.employment
                            ?.dateOfJoining
                        )
                      )
                    }
                  />

                  <Field
                    label="Probation end date"
                    value={
                      editing ? (
                        <input
                          type="date"
                          value={
                            form?.probationEndDate ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'probationEndDate',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        formatDate(
                          user.employment
                            ?.probationEndDate
                        )
                      )
                    }
                  />

                  <Field
                    label="Skills"
                    value={
                      editing ? (
                        <input
                          value={
                            form?.skills ??
                            ''
                          }
                          onChange={(e) =>
                            updateField(
                              'skills',
                              e.target
                                .value
                            )
                          }
                          className="w-full outline-none"
                        />
                      ) : (
                        user.employment
                          ?.skills
                          ?.join(', ')
                      )
                    }
                  />
                </div>
              </Section>
            )}

            {activeTab ===
              'academic' && (
              <Section
                icon={GraduationCap}
                title="Academic information"
                description="Academic identity and student-specific information"
              >
                {user.role !==
                'student' ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    Academic information is
                    not applicable to this
                    role.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Enrollment number"
                      value={
                        user.userCode
                      }
                      mono
                    />

                    <Field
                      label="Roll number"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.rollNumber ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'rollNumber',
                                e.target
                                  .value
                              )
                            }
                            className="w-full outline-none"
                          />
                        ) : (
                          user.academic
                            ?.rollNumber
                        )
                      }
                    />

                    <Field
                      label="Grade"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.grade ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'grade',
                                e.target
                                  .value
                              )
                            }
                            className="w-full outline-none"
                          />
                        ) : (
                          user.academic
                            ?.grade
                        )
                      }
                    />

                    <Field
                      label="Section"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.section ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'section',
                                e.target
                                  .value
                              )
                            }
                            className="w-full outline-none"
                          />
                        ) : (
                          user.academic
                            ?.section
                        )
                      }
                    />

                    <Field
                      label="Guardian name"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.guardianName ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'guardianName',
                                e.target
                                  .value
                              )
                            }
                            className="w-full outline-none"
                          />
                        ) : (
                          user.academic
                            ?.guardianName
                        )
                      }
                    />

                    <Field
                      label="Guardian phone"
                      value={
                        editing ? (
                          <input
                            value={
                              form?.guardianPhone ??
                              ''
                            }
                            onChange={(e) =>
                              updateField(
                                'guardianPhone',
                                e.target
                                  .value
                              )
                            }
                            className="w-full outline-none"
                            
                          />
                        ) : (
                          user.academic
                            ?.guardianPhone
                        )
                      }
                    />

                    <Field
                      label="Admission date"
                      value={formatDate(
                        user.academic
                          ?.admissionDate
                      )}
                    />
                  </div>
                )}
              </Section>
            )}

            {activeTab ===
              'security' && (
              <>
                <Section
                  icon={Shield}
                  title="Account security"
                  description="Authentication and account controls"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="Email verification"
                      value={
                        user.emailVerified
                          ? 'Verified'
                          : 'Not verified'
                      }
                    />

                    <Field
                      label="Two-factor authentication"
                      value={
                        user.twoFactorEnabled
                          ? 'Enabled'
                          : 'Disabled'
                      }
                    />

                    <Field
                      label="Password status"
                      value={
                        user.mustChangePassword
                          ? 'Change required'
                          : 'Normal'
                      }
                    />

                    <Field
                      label="Failed login attempts"
                      value={
                        user.failedAttempts ??
                        0
                      }
                    />

                    <Field
                      label="Locked until"
                      value={formatDateTime(
                        user.lockedUntil
                      )}
                    />

                    <Field
                      label="Last active"
                      value={formatDateTime(
                        user.lastActiveAt
                      )}
                    />
                  </div>
                </Section>

                <Section
                  icon={KeyRound}
                  title="Authentication"
                  description="Recent authentication information"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <Mail
                          size={17}
                          className="text-slate-400"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Email verification
                          </p>

                          <p className="text-xs text-slate-500">
                            {user.emailVerifiedAt
                              ? `Verified ${formatDateTime(
                                  user.emailVerifiedAt
                                )}`
                              : 'Email has not been verified'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.emailVerified
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {user.emailVerified
                          ? 'Verified'
                          : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <Lock
                          size={17}
                          className="text-slate-400"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Password
                          </p>

                          <p className="text-xs text-slate-500">
                            {user.passwordChangedAt
                              ? `Last changed ${formatDateTime(
                                  user.passwordChangedAt
                                )}`
                              : 'Password has not been changed'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        Protected
                      </span>
                    </div>
                  </div>
                </Section>
              </>
            )}
          </div>

          <aside className="space-y-5">
            <Section
              icon={Clipboard}
              title="User summary"
            >
              <div className="-mx-6 -my-6 divide-y divide-slate-100">
                <div className="flex items-center gap-3 px-6 py-4">
                  <Mail
                    size={16}
                    className="text-slate-400"
                  />

                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">
                      Email
                    </p>

                    <p className="truncate text-sm font-medium text-slate-900">
                      {user.email ||
                        EMPTY}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-4">
                  <Phone
                    size={16}
                    className="text-slate-400"
                  />

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Phone
                    </p>

                    <p className="text-sm font-medium text-slate-900">
                      {user.profile
                        ?.phone ||
                        EMPTY}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-4">
                  <MapPin
                    size={16}
                    className="text-slate-400"
                  />

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Location
                    </p>

                    <p className="text-sm font-medium text-slate-900">
                      {[
                        user.profile
                          ?.city,
                        user.profile
                          ?.state,
                        user.profile
                          ?.country,
                      ]
                        .filter(Boolean)
                        .join(', ') ||
                        EMPTY}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-4">
                  <CalendarDays
                    size={16}
                    className="text-slate-400"
                  />

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Created
                    </p>

                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(
                        user.createdAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-4">
                  <UserCheck
                    size={16}
                    className="text-slate-400"
                  />

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Last login
                    </p>

                    <p className="text-sm font-medium text-slate-900">
                      {formatDateTime(
                        user.lastLogin
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Public ID
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    System identity
                  </p>
                </div>

                <button
                  onClick={copyPublicId}
                  disabled={!user.publicId}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                >
                  {copied ? (
                    <Check
                      size={15}
                      className="text-emerald-600"
                    />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-3 font-mono text-xs text-slate-600">
                {user.publicId ||
                  user._id}
              </div>
            </div>

            <Section
              icon={Shield}
              title="Account access"
              description="Current authentication state"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Account
                  </span>

                  <StatusBadge
                    status={
                      user.status
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Email
                  </span>

                  <span className="text-xs font-semibold text-slate-700">
                    {user.emailVerified
                      ? 'Verified'
                      : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    2FA
                  </span>

                  <span className="text-xs font-semibold text-slate-700">
                    {user.twoFactorEnabled
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
              </div>
            </Section>

            {user.role ===
              'student' && (
              <Section
                icon={GraduationCap}
                title="Student"
                description="Academic identity"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Enrollment
                    </span>

                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {user.userCode ||
                        EMPTY}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Roll number
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {user.academic
                        ?.rollNumber ||
                        EMPTY}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Grade
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {user.academic
                        ?.grade ||
                        EMPTY}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Section
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {user.academic
                        ?.section ||
                        EMPTY}
                    </span>
                  </div>
                </div>
              </Section>
            )}
          </aside>
        </div>

        {updateState.isError && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md rounded-xl border border-red-200 bg-white p-4 shadow-2xl">
            <p className="text-sm font-bold text-red-700">
              Unable to update user
            </p>

            <p className="mt-1 text-xs text-red-600">
              {(updateState.error as any)
                ?.data?.message ||
                'Something went wrong while saving changes.'}
            </p>
          </div>
        )}

        {updateState.isSuccess && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-2xl">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
              <Check
                size={15}
                className="text-emerald-600"
              />
            </div>

            <p className="text-sm font-semibold text-emerald-700">
              User updated successfully
            </p>
          </div>
        )}
      </div>
    </div>
  )
}