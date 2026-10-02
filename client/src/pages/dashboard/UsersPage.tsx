import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Users,
  GraduationCap,
  Briefcase,
  UserCog,
  ShieldCheck,
  Calculator,
  Headphones,
  Heart,
  UserRound,
  Mail,
  Pencil,
  UserX,
  X,
  Eye,
  Lock,
  Building2,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  MapPin,
  Phone,
  BookOpen,
  ClipboardList,
  Award,
  Clock3,
  Hash,
  UserCheck,
} from 'lucide-react'

import { useAppSelector } from '@/app/store'
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/features/users/usersApi'
import { Navigate, useNavigate } from 'react-router-dom'

type Role =
  | 'super_admin'
  | 'admin'
  | 'principal'
  | 'teacher'
  | 'student'
  | 'hr'
  | 'accountant'
  | 'counselor'
  | 'support'
  | 'employee'
  | 'parent'

type UserRecord = {
  _id?: string
  publicId?: string
  userCode?: string
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive' | 'suspended'
  instituteId?: string
  profile?: {
    phone?: string | null
    avatarUrl?: string | null
  }
  mustChangePassword?: boolean
  createdAt?: string
}

type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: Role
  instituteId?: string
  profile?: {
    phone?: string
    alternatePhone?: string
    address?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
    dateOfBirth?: string
    gender?: string
    bloodGroup?: string
    bio?: string
  }
  teacher?: Record<string, any>
  student?: Record<string, any>
  employee?: Record<string, any>
  hr?: Record<string, any>
  principal?: Record<string, any>
  accountant?: Record<string, any>
  counselor?: Record<string, any>
  parent?: Record<string, any>
  support?: Record<string, any>
}

type RoleForm = {
  displayName: string
  designation: string
  department: string
  reportingManager: string
  workLocation: string
  workEmail: string
  joiningDate: string
  employmentStatus: string
  experienceYears: string
  maxWeeklyHours: string

  course: string
  rollNumber: string
  grade: string
  section: string
  guardianName: string
  guardianPhone: string
  admissionDate: string

  subjects: string
  gradesTaught: string
  qualifications: string
  certifications: string

  employmentType: string
  probationEndDate: string
  skills: string

  specialization: string
  relationship: string
  occupation: string
  emergencyPhone: string

  phone: string
  alternatePhone: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  dateOfBirth: string
  gender: string
  bloodGroup: string
  bio: string
}

const EMPTY_ROLE_FORM: RoleForm = {
  displayName: '',
  designation: '',
  department: '',
  reportingManager: '',
  workLocation: '',
  workEmail: '',
  joiningDate: '',
  employmentStatus: 'active',
  experienceYears: '',
  maxWeeklyHours: '24',

  course: '',
  rollNumber: '',
  grade: '',
  section: '',
  guardianName: '',
  guardianPhone: '',
  admissionDate: '',

  subjects: '',
  gradesTaught: '',
  qualifications: '',
  certifications: '',

  employmentType: '',
  probationEndDate: '',
  skills: '',

  specialization: '',
  relationship: '',
  occupation: '',
  emergencyPhone: '',

  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  bio: '',
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getErrorMessage(error: any) {
  return (
    error?.data?.message ||
    error?.error?.data?.message ||
    error?.message ||
    'Something went wrong'
  )
}

function getId(user: UserRecord) {
  return user.publicId ?? user._id ?? ''
}

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase() || 'U'
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  disabled?: boolean
  hint?: string
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-gray-700">
          {label}
          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </span>

        {hint && (
          <span className="text-[10px] text-gray-400">
            {hint}
          </span>
        )}
      </div>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="
          h-11 w-full rounded-xl
          border border-gray-200
          bg-white px-3.5
          text-sm text-gray-900
          outline-none transition
          placeholder:text-gray-400
          focus:border-gray-900
          focus:ring-4 focus:ring-gray-900/[0.04]
          disabled:cursor-not-allowed
          disabled:bg-gray-50
          disabled:text-gray-400
        "
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="
          w-full resize-none rounded-xl
          border border-gray-200
          bg-white px-3.5 py-3
          text-sm text-gray-900
          outline-none transition
          placeholder:text-gray-400
          focus:border-gray-900
          focus:ring-4 focus:ring-gray-900/[0.04]
        "
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="
          h-11 w-full rounded-xl
          border border-gray-200
          bg-white px-3.5
          text-sm text-gray-900
          outline-none transition
          focus:border-gray-900
          focus:ring-4 focus:ring-gray-900/[0.04]
        "
      >
        <option value="">Select</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description?: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white">
            {icon}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-950">
              {title}
            </h3>

            {description && (
              <p className="mt-0.5 text-xs text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  )
}

function RoleSummary({
  role,
}: {
  role: Role
}) {
  const meta = ROLE_META[role]
  const Icon = meta?.icon ?? Users

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Creating
          </p>

          <p className="mt-0.5 text-sm font-semibold text-gray-950">
            {meta?.label ?? role}
          </p>

          <p className="text-xs text-gray-500">
            {meta?.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function CreateUserModal({
  open,
  onClose,
  actorRole,
  organizationType,
  instituteId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  actorRole: Role
  organizationType?: string
  instituteId?: string
  onCreated: () => void
}) {
  const [createUser, { isLoading }] =
    useCreateUserMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [error, setError] = useState('')

  const [activeSection, setActiveSection] =
    useState<'account' | 'profile' | 'role'>('account')

  const [form, setForm] =
    useState<RoleForm>(EMPTY_ROLE_FORM)

  const availableRoles = useMemo(
    () =>
      getRoleOptions(
        actorRole,
        organizationType
      ),
    [actorRole, organizationType]
  )

  const updateForm = (
    key: keyof RoleForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  useEffect(() => {
    if (!open) return

    setName('')
    setEmail('')
    setPassword('')
    setError('')
    setForm(EMPTY_ROLE_FORM)
    setActiveSection('account')

    const firstRole =
      availableRoles.find(
        (item) =>
          item !== 'admin' ||
          actorRole === 'super_admin'
      )

    setRole(
      (firstRole as Role | undefined) ?? ''
    )
  }, [
    open,
    availableRoles,
    actorRole,
  ])

  const generatePassword = () => {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'

    let value = ''

    for (let i = 0; i < 14; i++) {
      value +=
        chars[
          Math.floor(
            Math.random() * chars.length
          )
        ]
    }

    setPassword(value)
  }

  const validate = () => {
    if (!name.trim()) {
      return 'Full name is required'
    }

    if (!email.trim()) {
      return 'Email address is required'
    }

    if (!password) {
      return 'Password is required'
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }

    if (!role) {
      return 'Please select a role'
    }

    if (
      actorRole !== 'super_admin' &&
      role === 'admin'
    ) {
      return 'Organization admins cannot create another admin'
    }

    if (
      actorRole !== 'super_admin' &&
      !instituteId
    ) {
      return 'Your account is not linked to an organization'
    }

    if (role === 'student') {
      if (!form.course.trim()) {
        return 'Course is required'
      }
    }

    return ''
  }

  const buildPayload =
    (): CreateUserPayload => {
      const payload: CreateUserPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role as Role,

        profile: {
          phone:
            form.phone.trim() ||
            undefined,

          alternatePhone:
            form.alternatePhone.trim() ||
            undefined,

          address:
            form.address.trim() ||
            undefined,

          city:
            form.city.trim() ||
            undefined,

          state:
            form.state.trim() ||
            undefined,

          country:
            form.country.trim() ||
            'India',

          pincode:
            form.pincode.trim() ||
            undefined,

          dateOfBirth:
            form.dateOfBirth ||
            undefined,

          gender:
            form.gender ||
            undefined,

          bloodGroup:
            form.bloodGroup ||
            undefined,

          bio:
            form.bio.trim() ||
            undefined,
        },
      }

      if (actorRole === 'super_admin') {
        payload.instituteId =
          instituteId || undefined
      } else {
        payload.instituteId =
          instituteId
      }

      if (role === 'teacher') {
        payload.teacher = {
          displayName:
            form.displayName.trim() ||
            name.trim(),

          phone:
            form.phone.trim() ||
            null,

          alternatePhone:
            form.alternatePhone.trim() ||
            null,

          designation:
            form.designation.trim() ||
            null,

          department:
            form.department.trim() ||
            null,

          reportingManager:
            form.reportingManager.trim() ||
            null,

          workLocation:
            form.workLocation.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          subjects:
            splitList(form.subjects),

          gradesTaught:
            splitList(form.gradesTaught),

          classes: [],

          qualifications:
            splitList(form.qualifications),

          certifications:
            splitList(form.certifications),

          experienceYears:
            Number(form.experienceYears) || 0,

          previousEmployment: [],

          maxWeeklyHours:
            Number(form.maxWeeklyHours) || 24,

          isClassTeacherOf: null,

          employmentStatus:
            form.employmentStatus ||
            'active',

          joiningDate:
            form.joiningDate ||
            null,
        }
      }

      if (role === 'student') {
        payload.student = {
          course:
            form.course.trim(),

          rollNumber:
            form.rollNumber.trim() ||
            null,

          grade:
            form.grade.trim() ||
            null,

          section:
            form.section.trim() ||
            null,

          guardianName:
            form.guardianName.trim() ||
            null,

          guardianPhone:
            form.guardianPhone.trim() ||
            null,

          admissionDate:
            form.admissionDate ||
            null,
        }
      }

      if (role === 'employee') {
        payload.employee = {
          employmentType:
            form.employmentType ||
            null,

          department:
            form.department.trim() ||
            null,

          designation:
            form.designation.trim() ||
            null,

          reportingManager:
            form.reportingManager.trim() ||
            null,

          workLocation:
            form.workLocation.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          dateOfJoining:
            form.joiningDate ||
            null,

          probationEndDate:
            form.probationEndDate ||
            null,

          skills:
            splitList(form.skills),
        }
      }

      if (role === 'hr') {
        payload.hr = {
          department:
            form.department.trim() ||
            null,

          designation:
            form.designation.trim() ||
            null,

          reportingManager:
            form.reportingManager.trim() ||
            null,

          workLocation:
            form.workLocation.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          joiningDate:
            form.joiningDate ||
            null,

          experienceYears:
            Number(form.experienceYears) || 0,

          employmentStatus:
            form.employmentStatus ||
            'active',
        }
      }

      if (role === 'principal') {
        payload.principal = {
          displayName:
            form.displayName.trim() ||
            name.trim(),

          designation:
            form.designation.trim() ||
            null,

          department:
            form.department.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          joiningDate:
            form.joiningDate ||
            null,

          qualifications:
            splitList(form.qualifications),
        }
      }

      if (role === 'accountant') {
        payload.accountant = {
          department:
            form.department.trim() ||
            null,

          designation:
            form.designation.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          joiningDate:
            form.joiningDate ||
            null,
        }
      }

      if (role === 'counselor') {
        payload.counselor = {
          specialization:
            form.specialization.trim() ||
            null,

          department:
            form.department.trim() ||
            null,

          designation:
            form.designation.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          joiningDate:
            form.joiningDate ||
            null,
        }
      }

      if (role === 'parent') {
        payload.parent = {
          relationship:
            form.relationship.trim() ||
            null,

          occupation:
            form.occupation.trim() ||
            null,

          emergencyPhone:
            form.emergencyPhone.trim() ||
            null,
        }
      }

      if (role === 'support') {
        payload.support = {
          department:
            form.department.trim() ||
            null,

          designation:
            form.designation.trim() ||
            null,

          workEmail:
            form.workEmail.trim() ||
            null,

          joiningDate:
            form.joiningDate ||
            null,
        }
      }

      return payload
    }

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    const validationError = validate()

    if (validationError) {
      setError(validationError)

      setActiveSection(
        role === 'student' ||
          role === 'teacher' ||
          role === 'employee' ||
          role === 'hr' ||
          role === 'principal' ||
          role === 'accountant' ||
          role === 'counselor' ||
          role === 'support' ||
          role === 'parent'
          ? 'role'
          : 'account'
      )

      return
    }

    try {
      setError('')

      const payload = buildPayload()

      await createUser(payload).unwrap()

      onCreated()
      onClose()
    } catch (err) {
      setError(
        getErrorMessage(err)
      )
    }
  }

  if (!open) return null

  const isStaffRole =
    role === 'teacher' ||
    role === 'employee' ||
    role === 'hr' ||
    role === 'principal' ||
    role === 'accountant' ||
    role === 'counselor' ||
    role === 'support'

  const goNext = () => {
    setError('')

    if (activeSection === 'account') {
      if (!name.trim()) {
        setError('Full name is required')
        return
      }

      if (!email.trim()) {
        setError('Email address is required')
        return
      }

      if (!password) {
        setError('Password is required')
        return
      }

      if (password.length < 8) {
        setError(
          'Password must be at least 8 characters'
        )
        return
      }

      if (!role) {
        setError('Please select a role')
        return
      }

      setActiveSection('profile')
      return
    }

    setActiveSection('role')
  }

  const goBack = () => {
    setError('')

    if (activeSection === 'role') {
      setActiveSection('profile')
      return
    }

    setActiveSection('account')
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50 p-3
        backdrop-blur-sm
      "
    >
      <div
        className="
          flex h-[min(94vh,920px)]
          w-full max-w-6xl
          flex-col overflow-hidden
          rounded-3xl bg-[#f7f8fa]
          shadow-[0_30px_100px_rgba(0,0,0,0.24)]
        "
      >
        <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="text-lg font-semibold tracking-tight text-gray-950">
                  Create user
                </h2>

                <p className="text-xs text-gray-500">
                  Create an account and complete only the information required for the selected role
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 lg:block">
            <div className="space-y-1">
              {[
                {
                  id: 'account',
                  label: 'Account',
                  description: 'Identity, login & role',
                },
                {
                  id: 'profile',
                  label: 'Profile',
                  description: 'Contact information',
                },
                {
                  id: 'role',
                  label: 'Role details',
                  description: role
                    ? ROLE_META[role]?.label
                    : 'Select a role',
                },
              ].map((item, index) => {
                const active =
                  activeSection === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        item.id as
                          | 'account'
                          | 'profile'
                          | 'role'
                      )
                    }
                    className={`
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-3
                      text-left transition
                      ${
                        active
                          ? 'bg-gray-950 text-white'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span
                      className={`
                        flex h-8 w-8 shrink-0
                        items-center justify-center
                        rounded-lg text-xs font-semibold
                        ${
                          active
                            ? 'bg-white text-gray-950'
                            : 'bg-gray-100 text-gray-500'
                        }
                      `}
                    >
                      {index + 1}
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">
                        {item.label}
                      </span>

                      <span
                        className={`
                          mt-0.5 block truncate text-[10px]
                          ${
                            active
                              ? 'text-white/60'
                              : 'text-gray-400'
                          }
                        `}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {role && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <RoleSummary role={role} />
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    Backend generated IDs
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-gray-500">
                    Enrollment numbers, employee codes and other sequence-based identifiers are generated by the server.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="flex min-w-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7">
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Unable to create user
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'account' && (
                <div className="space-y-5">
                  <FormSection
                    title="Account"
                    description="Basic identity and login credentials"
                    icon={<UserRound size={17} />}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        value={name}
                        onChange={setName}
                        placeholder="e.g. Rahul Sharma"
                        required
                      />

                      <Field
                        label="Email address"
                        value={email}
                        onChange={setEmail}
                        placeholder="user@example.com"
                        type="email"
                        required
                      />

                      <div className="sm:col-span-2">
                        <div className="flex items-end gap-2">
                          <div className="min-w-0 flex-1">
                            <Field
                              label="Temporary password"
                              value={password}
                              onChange={setPassword}
                              placeholder="Minimum 8 characters"
                              type="text"
                              required
                            />
                          </div>

                          <button
                            type="button"
                            onClick={generatePassword}
                            className="
                              mb-0 h-11 shrink-0
                              rounded-xl border border-gray-200
                              bg-white px-4
                              text-xs font-semibold
                              text-gray-700
                              transition
                              hover:border-gray-900
                              hover:text-gray-950
                            "
                          >
                            Generate
                          </button>
                        </div>

                        <p className="mt-1.5 text-[11px] text-gray-400">
                          The account is created with must-change-password enabled.
                        </p>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Access role"
                    description="Only roles permitted for your account and organization are available"
                    icon={<ShieldCheck size={17} />}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableRoles.map(
                        (availableRole) => {
                          const meta =
                            ROLE_META[
                              availableRole
                            ]

                          const Icon =
                            meta?.icon ??
                            Users

                          const selected =
                            role ===
                            availableRole

                          return (
                            <button
                              key={
                                availableRole
                              }
                              type="button"
                              onClick={() =>
                                setRole(
                                  availableRole
                                )
                              }
                              className={`
                                rounded-2xl
                                border p-4
                                text-left transition
                                ${
                                  selected
                                    ? 'border-gray-950 bg-gray-950 text-white shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`
                                    flex h-10 w-10
                                    items-center justify-center
                                    rounded-xl
                                    ${
                                      selected
                                        ? 'bg-white text-gray-950'
                                        : 'bg-gray-100 text-gray-700'
                                    }
                                  `}
                                >
                                  <Icon size={18} />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">
                                    {meta?.label ??
                                      availableRole}
                                  </p>

                                  <p
                                    className={`
                                      mt-0.5 text-xs
                                      ${
                                        selected
                                          ? 'text-white/60'
                                          : 'text-gray-500'
                                      }
                                    `}
                                  >
                                    {
                                      meta?.description
                                    }
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        }
                      )}
                    </div>
                  </FormSection>
                </div>
              )}

              {activeSection === 'profile' && (
                <div className="space-y-5">
                  <FormSection
                    title="Contact information"
                    description="Personal contact and address information"
                    icon={<Mail size={17} />}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Phone"
                        value={form.phone}
                        onChange={(value) =>
                          updateForm(
                            'phone',
                            value
                          )
                        }
                        placeholder="+91 9876543210"
                      />

                      <Field
                        label="Alternate phone"
                        value={
                          form.alternatePhone
                        }
                        onChange={(value) =>
                          updateForm(
                            'alternatePhone',
                            value
                          )
                        }
                        placeholder="+91 9876543211"
                      />

                      <div className="sm:col-span-2">
                        <Field
                          label="Address"
                          value={form.address}
                          onChange={(value) =>
                            updateForm(
                              'address',
                              value
                            )
                          }
                          placeholder="Street address"
                        />
                      </div>

                      <Field
                        label="City"
                        value={form.city}
                        onChange={(value) =>
                          updateForm(
                            'city',
                            value
                          )
                        }
                        placeholder="Delhi"
                      />

                      <Field
                        label="State"
                        value={form.state}
                        onChange={(value) =>
                          updateForm(
                            'state',
                            value
                          )
                        }
                        placeholder="Delhi"
                      />

                      <Field
                        label="Country"
                        value={form.country}
                        onChange={(value) =>
                          updateForm(
                            'country',
                            value
                          )
                        }
                        placeholder="India"
                      />

                      <Field
                        label="Pincode"
                        value={form.pincode}
                        onChange={(value) =>
                          updateForm(
                            'pincode',
                            value
                          )
                        }
                        placeholder="110001"
                      />

                      <Field
                        label="Date of birth"
                        value={
                          form.dateOfBirth
                        }
                        onChange={(value) =>
                          updateForm(
                            'dateOfBirth',
                            value
                          )
                        }
                        type="date"
                      />

                      <SelectField
                        label="Gender"
                        value={form.gender}
                        onChange={(value) =>
                          updateForm(
                            'gender',
                            value
                          )
                        }
                        options={[
                          {
                            value: 'male',
                            label: 'Male',
                          },
                          {
                            value: 'female',
                            label: 'Female',
                          },
                          {
                            value: 'other',
                            label: 'Other',
                          },
                        ]}
                      />

                      <SelectField
                        label="Blood group"
                        value={
                          form.bloodGroup
                        }
                        onChange={(value) =>
                          updateForm(
                            'bloodGroup',
                            value
                          )
                        }
                        options={[
                          {
                            value: 'A+',
                            label: 'A+',
                          },
                          {
                            value: 'A-',
                            label: 'A-',
                          },
                          {
                            value: 'B+',
                            label: 'B+',
                          },
                          {
                            value: 'B-',
                            label: 'B-',
                          },
                          {
                            value: 'AB+',
                            label: 'AB+',
                          },
                          {
                            value: 'AB-',
                            label: 'AB-',
                          },
                          {
                            value: 'O+',
                            label: 'O+',
                          },
                          {
                            value: 'O-',
                            label: 'O-',
                          },
                        ]}
                      />

                      <div className="sm:col-span-2">
                        <TextAreaField
                          label="Bio"
                          value={form.bio}
                          onChange={(value) =>
                            updateForm(
                              'bio',
                              value
                            )
                          }
                          placeholder="Short profile description..."
                        />
                      </div>
                    </div>
                  </FormSection>
                </div>
              )}

              {activeSection === 'role' &&
                role === 'student' && (
                  <div className="space-y-5">
                    <RoleSummary role="student" />

                    <FormSection
                      title="Student information"
                      description="Academic identity and enrollment"
                      icon={
                        <GraduationCap
                          size={17}
                        />
                      }
                    >
                      <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                          <Hash
                            size={17}
                            className="mt-0.5 text-blue-600"
                          />

                          <div>
                            <p className="text-sm font-semibold text-blue-900">
                              Enrollment number is automatic
                            </p>

                            <p className="mt-1 text-xs leading-5 text-blue-700">
                              The backend generates the unique student enrollment number. You do not need to enter it.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label="Course"
                          value={form.course}
                          onChange={(value) =>
                            updateForm(
                              'course',
                              value
                            )
                          }
                          placeholder="BCA"
                          required
                        />

                        <Field
                          label="Roll number"
                          value={
                            form.rollNumber
                          }
                          onChange={(value) =>
                            updateForm(
                              'rollNumber',
                              value
                            )
                          }
                          placeholder="24"
                        />

                        <Field
                          label="Grade / Year"
                          value={form.grade}
                          onChange={(value) =>
                            updateForm(
                              'grade',
                              value
                            )
                          }
                          placeholder="10 / First Year"
                        />

                        <Field
                          label="Section"
                          value={
                            form.section
                          }
                          onChange={(value) =>
                            updateForm(
                              'section',
                              value
                            )
                          }
                          placeholder="A"
                        />

                        <Field
                          label="Admission date"
                          value={
                            form.admissionDate
                          }
                          onChange={(value) =>
                            updateForm(
                              'admissionDate',
                              value
                            )
                          }
                          type="date"
                        />
                      </div>
                    </FormSection>

                    <FormSection
                      title="Guardian"
                      description="Parent or guardian information"
                      icon={
                        <UserRound size={17} />
                      }
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label="Guardian name"
                          value={
                            form.guardianName
                          }
                          onChange={(value) =>
                            updateForm(
                              'guardianName',
                              value
                            )
                          }
                          placeholder="Parent / guardian name"
                        />

                        <Field
                          label="Guardian phone"
                          value={
                            form.guardianPhone
                          }
                          onChange={(value) =>
                            updateForm(
                              'guardianPhone',
                              value
                            )
                          }
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </FormSection>
                  </div>
                )}

              {activeSection === 'role' &&
                role === 'teacher' && (
                  <div className="space-y-5">
                    <RoleSummary role="teacher" />

                    <FormSection
                      title="Teaching employment"
                      description="Professional information for the teacher"
                      icon={
                        <Briefcase size={17} />
                      }
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label="Display name"
                          value={
                            form.displayName
                          }
                          onChange={(value) =>
                            updateForm(
                              'displayName',
                              value
                            )
                          }
                          placeholder="Teacher name"
                        />

                        <Field
                          label="Designation"
                          value={
                            form.designation
                          }
                          onChange={(value) =>
                            updateForm(
                              'designation',
                              value
                            )
                          }
                          placeholder="Senior Teacher"
                        />

                        <Field
                          label="Department"
                          value={
                            form.department
                          }
                          onChange={(value) =>
                            updateForm(
                              'department',
                              value
                            )
                          }
                          placeholder="Mathematics"
                        />

                        <Field
                          label="Reporting manager"
                          value={
                            form.reportingManager
                          }
                          onChange={(value) =>
                            updateForm(
                              'reportingManager',
                              value
                            )
                          }
                          placeholder="Manager public ID"
                        />

                        <Field
                          label="Work location"
                          value={
                            form.workLocation
                          }
                          onChange={(value) =>
                            updateForm(
                              'workLocation',
                              value
                            )
                          }
                          placeholder="Main Campus"
                        />

                        <Field
                          label="Work email"
                          value={
                            form.workEmail
                          }
                          onChange={(value) =>
                            updateForm(
                              'workEmail',
                              value
                            )
                          }
                          placeholder="teacher@school.com"
                          type="email"
                        />

                        <Field
                          label="Joining date"
                          value={
                            form.joiningDate
                          }
                          onChange={(value) =>
                            updateForm(
                              'joiningDate',
                              value
                            )
                          }
                          type="date"
                        />

                        <SelectField
                          label="Employment status"
                          value={
                            form.employmentStatus
                          }
                          onChange={(value) =>
                            updateForm(
                              'employmentStatus',
                              value
                            )
                          }
                          options={[
                            {
                              value: 'active',
                              label: 'Active',
                            },
                            {
                              value: 'inactive',
                              label: 'Inactive',
                            },
                            {
                              value: 'on_leave',
                              label: 'On leave',
                            },
                          ]}
                        />

                        <Field
                          label="Experience years"
                          value={
                            form.experienceYears
                          }
                          onChange={(value) =>
                            updateForm(
                              'experienceYears',
                              value
                            )
                          }
                          type="number"
                          placeholder="5"
                        />

                        <Field
                          label="Maximum weekly hours"
                          value={
                            form.maxWeeklyHours
                          }
                          onChange={(value) =>
                            updateForm(
                              'maxWeeklyHours',
                              value
                            )
                          }
                          type="number"
                          placeholder="24"
                        />
                      </div>
                    </FormSection>

                    <FormSection
                      title="Teaching profile"
                      description="Subjects, grades and professional qualifications"
                      icon={
                        <GraduationCap
                          size={17}
                        />
                      }
                    >
                      <div className="grid gap-5">
                        <Field
                          label="Subjects"
                          value={
                            form.subjects
                          }
                          onChange={(value) =>
                            updateForm(
                              'subjects',
                              value
                            )
                          }
                          placeholder="Mathematics, Physics, Algebra"
                          hint="Comma separated"
                        />

                        <Field
                          label="Grades taught"
                          value={
                            form.gradesTaught
                          }
                          onChange={(value) =>
                            updateForm(
                              'gradesTaught',
                              value
                            )
                          }
                          placeholder="8, 9, 10"
                          hint="Comma separated"
                        />

                        <Field
                          label="Qualifications"
                          value={
                            form.qualifications
                          }
                          onChange={(value) =>
                            updateForm(
                              'qualifications',
                              value
                            )
                          }
                          placeholder="B.Ed, M.Sc Mathematics"
                          hint="Comma separated"
                        />

                        <Field
                          label="Certifications"
                          value={
                            form.certifications
                          }
                          onChange={(value) =>
                            updateForm(
                              'certifications',
                              value
                            )
                          }
                          placeholder="CTET, NET"
                          hint="Comma separated"
                        />
                      </div>
                    </FormSection>
                  </div>
                )}

              {activeSection === 'role' &&
                isStaffRole &&
                role !== 'teacher' && (
                  <div className="space-y-5">
                    {role && (
                      <RoleSummary role={role} />
                    )}

                    <FormSection
                      title="Employment details"
                      description="Professional and organization information"
                      icon={
                        <Briefcase size={17} />
                      }
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        {role !== 'principal' &&
                          role !== 'accountant' &&
                          role !== 'counselor' &&
                          role !== 'support' && (
                            <div className="sm:col-span-2">
                              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                  <Hash
                                    size={17}
                                    className="mt-0.5 text-blue-600"
                                  />

                                  <div>
                                    <p className="text-sm font-semibold text-blue-900">
                                      Identifier generated automatically
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-blue-700">
                                      Employee codes and other sequence-based identifiers are generated by the backend.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        <Field
                          label="Display name"
                          value={
                            form.displayName
                          }
                          onChange={(value) =>
                            updateForm(
                              'displayName',
                              value
                            )
                          }
                          placeholder="Display name"
                        />

                        <Field
                          label="Designation"
                          value={
                            form.designation
                          }
                          onChange={(value) =>
                            updateForm(
                              'designation',
                              value
                            )
                          }
                          placeholder="Designation"
                        />

                        <Field
                          label="Department"
                          value={
                            form.department
                          }
                          onChange={(value) =>
                            updateForm(
                              'department',
                              value
                            )
                          }
                          placeholder="Department"
                        />

                        <Field
                          label="Reporting manager"
                          value={
                            form.reportingManager
                          }
                          onChange={(value) =>
                            updateForm(
                              'reportingManager',
                              value
                            )
                          }
                          placeholder="Manager public ID"
                        />

                        <Field
                          label="Work location"
                          value={
                            form.workLocation
                          }
                          onChange={(value) =>
                            updateForm(
                              'workLocation',
                              value
                            )
                          }
                          placeholder="Main office"
                        />

                        <Field
                          label="Work email"
                          value={
                            form.workEmail
                          }
                          onChange={(value) =>
                            updateForm(
                              'workEmail',
                              value
                            )
                          }
                          type="email"
                          placeholder="work@example.com"
                        />

                        <Field
                          label="Joining date"
                          value={
                            form.joiningDate
                          }
                          onChange={(value) =>
                            updateForm(
                              'joiningDate',
                              value
                            )
                          }
                          type="date"
                        />

                        <SelectField
                          label="Employment status"
                          value={
                            form.employmentStatus
                          }
                          onChange={(value) =>
                            updateForm(
                              'employmentStatus',
                              value
                            )
                          }
                          options={[
                            {
                              value: 'active',
                              label: 'Active',
                            },
                            {
                              value: 'inactive',
                              label: 'Inactive',
                            },
                            {
                              value: 'on_leave',
                              label: 'On leave',
                            },
                          ]}
                        />

                        <Field
                          label="Experience years"
                          value={
                            form.experienceYears
                          }
                          onChange={(value) =>
                            updateForm(
                              'experienceYears',
                              value
                            )
                          }
                          type="number"
                          placeholder="3"
                        />
                      </div>
                    </FormSection>

                    {role === 'employee' && (
                      <FormSection
                        title="Employee profile"
                        description="Employment classification and skills"
                        icon={
                          <Briefcase size={17} />
                        }
                      >
                        <div className="grid gap-5 sm:grid-cols-2">
                          <SelectField
                            label="Employment type"
                            value={
                              form.employmentType
                            }
                            onChange={(value) =>
                              updateForm(
                                'employmentType',
                                value
                              )
                            }
                            options={[
                              {
                                value: 'full_time',
                                label: 'Full time',
                              },
                              {
                                value: 'part_time',
                                label: 'Part time',
                              },
                              {
                                value: 'contract',
                                label: 'Contract',
                              },
                              {
                                value: 'intern',
                                label: 'Intern',
                              },
                            ]}
                          />

                          <Field
                            label="Probation end date"
                            value={
                              form.probationEndDate
                            }
                            onChange={(value) =>
                              updateForm(
                                'probationEndDate',
                                value
                              )
                            }
                            type="date"
                          />

                          <div className="sm:col-span-2">
                            <Field
                              label="Skills"
                              value={
                                form.skills
                              }
                              onChange={(value) =>
                                updateForm(
                                  'skills',
                                  value
                                )
                              }
                              placeholder="Excel, Payroll, Communication"
                              hint="Comma separated"
                            />
                          </div>
                        </div>
                      </FormSection>
                    )}

                    {role === 'hr' && (
                      <FormSection
                        title="HR profile"
                        description="Human resources responsibilities"
                        icon={
                          <UserCog size={17} />
                        }
                      >
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm font-semibold text-gray-900">
                            HR account
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            HR-specific identifiers are generated by the backend. Use this section for professional details only.
                          </p>
                        </div>
                      </FormSection>
                    )}

                    {role === 'principal' && (
                      <FormSection
                        title="Academic leadership"
                        description="Principal profile and qualifications"
                        icon={
                          <UserCog size={17} />
                        }
                      >
                        <div className="grid gap-5">
                          <Field
                            label="Display name"
                            value={
                              form.displayName
                            }
                            onChange={(value) =>
                              updateForm(
                                'displayName',
                                value
                              )
                            }
                            placeholder="Principal name"
                          />

                          <Field
                            label="Qualifications"
                            value={
                              form.qualifications
                            }
                            onChange={(value) =>
                              updateForm(
                                'qualifications',
                                value
                              )
                            }
                            placeholder="M.Ed, M.A."
                            hint="Comma separated"
                          />
                        </div>
                      </FormSection>
                    )}

                    {role === 'accountant' && (
                      <FormSection
                        title="Finance profile"
                        description="Accounting and finance role"
                        icon={
                          <Calculator size={17} />
                        }
                      >
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm font-semibold text-gray-900">
                            Accountant account
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            Finance-specific access is controlled by the accountant role and backend permissions.
                          </p>
                        </div>
                      </FormSection>
                    )}

                    {role === 'counselor' && (
                      <FormSection
                        title="Counseling profile"
                        description="Professional counseling information"
                        icon={
                          <Heart size={17} />
                        }
                      >
                        <Field
                          label="Specialization"
                          value={
                            form.specialization
                          }
                          onChange={(value) =>
                            updateForm(
                              'specialization',
                              value
                            )
                          }
                          placeholder="Career counseling"
                        />
                      </FormSection>
                    )}

                    {role === 'support' && (
                      <FormSection
                        title="Support profile"
                        description="Support and operations information"
                        icon={
                          <Headphones size={17} />
                        }
                      >
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm font-semibold text-gray-900">
                            Support account
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            Support access is controlled by the assigned role and organization permissions.
                          </p>
                        </div>
                      </FormSection>
                    )}
                  </div>
                )}

              {activeSection === 'role' &&
                role === 'parent' && (
                  <div className="space-y-5">
                    <RoleSummary role="parent" />

                    <FormSection
                      title="Parent / guardian profile"
                      description="Relationship and emergency information"
                      icon={
                        <UserRound size={17} />
                      }
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label="Relationship"
                          value={
                            form.relationship
                          }
                          onChange={(value) =>
                            updateForm(
                              'relationship',
                              value
                            )
                          }
                          placeholder="Father"
                        />

                        <Field
                          label="Occupation"
                          value={
                            form.occupation
                          }
                          onChange={(value) =>
                            updateForm(
                              'occupation',
                              value
                            )
                          }
                          placeholder="Business owner"
                        />

                        <Field
                          label="Emergency phone"
                          value={
                            form.emergencyPhone
                          }
                          onChange={(value) =>
                            updateForm(
                              'emergencyPhone',
                              value
                            )
                          }
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </FormSection>
                  </div>
                )}

              {activeSection === 'role' &&
                role === 'admin' && (
                  <div className="space-y-5">
                    <RoleSummary role="admin" />

                    <FormSection
                      title="Administrator"
                      description="Organization administrator account"
                      icon={
                        <ShieldCheck
                          size={17}
                        />
                      }
                    >
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-medium text-gray-900">
                          Organization administrator
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          This account will manage users and organization operations according to the permissions assigned to the admin role.
                        </p>
                      </div>
                    </FormSection>
                  </div>
                )}

              {!role && (
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                      <Users
                        size={21}
                        className="text-gray-500"
                      />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900">
                      Select a role
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Role-specific fields will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    h-11 rounded-xl
                    border border-gray-200
                    bg-white px-5
                    text-sm font-medium
                    text-gray-700
                    transition
                    hover:border-gray-400
                    hover:text-gray-950
                  "
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {activeSection !== 'account' && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="
                        inline-flex h-11
                        items-center gap-2
                        rounded-xl
                        border border-gray-200
                        bg-white px-5
                        text-sm font-medium
                        text-gray-700
                        transition
                        hover:border-gray-400
                      "
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                  )}

                  {activeSection !== 'role' ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="
                        inline-flex h-11
                        items-center gap-2
                        rounded-xl
                        bg-gray-950 px-6
                        text-sm font-semibold
                        text-white
                        shadow-sm
                        transition
                        hover:bg-gray-800
                      "
                    >
                      Continue
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        inline-flex h-11
                        items-center justify-center
                        gap-2 rounded-xl
                        bg-gray-950 px-6
                        text-sm font-semibold
                        text-white
                        shadow-sm
                        transition
                        hover:bg-gray-800
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {isLoading && (
                        <RefreshCw
                          size={15}
                          className="animate-spin"
                        />
                      )}

                      {isLoading
                        ? 'Creating...'
                        : 'Create user'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const ROLE_META: Record<
  Role,
  {
    label: string
    description: string
    icon: typeof Users
    className: string
  }
> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Platform administrator',
    icon: ShieldCheck,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  admin: {
    label: 'Admin',
    description: 'Organization administrator',
    icon: ShieldCheck,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  principal: {
    label: 'Principal',
    description: 'Academic leadership',
    icon: UserCog,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  teacher: {
    label: 'Teacher',
    description: 'Teaching staff',
    icon: GraduationCap,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  student: {
    label: 'Student',
    description: 'Learner',
    icon: GraduationCap,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  hr: {
    label: 'HR',
    description: 'Human resources',
    icon: UserCog,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  accountant: {
    label: 'Accountant',
    description: 'Finance and billing',
    icon: Calculator,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  counselor: {
    label: 'Counselor',
    description: 'Student counseling',
    icon: Heart,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  support: {
    label: 'Support',
    description: 'Support operations',
    icon: Headphones,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  employee: {
    label: 'Employee',
    description: 'Organization employee',
    icon: Briefcase,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },

  parent: {
    label: 'Parent',
    description: 'Student parent / guardian',
    icon: UserRound,
    className:
      'bg-gray-100 text-gray-800 border-gray-200',
  },
}

const SCHOOL_ROLES: Role[] = [
  'admin',
  'principal',
  'teacher',
  'student',
]

const COMPANY_ROLES: Role[] = [
  'admin',
  'hr',
  'employee',
]

const INSTITUTE_ROLES: Role[] = [
  'admin',
  'principal',
  'teacher',
  'student',
  'hr',
  'accountant',
  'counselor',
  'employee',
  'support',
  'parent',
]

const ALL_SUPER_ADMIN_ROLES: Role[] = [
  'super_admin',
  'admin',
  'principal',
  'teacher',
  'student',
  'hr',
  'accountant',
  'counselor',
  'employee',
  'support',
  'parent',
]

function getRoleOptions(
  actorRole: Role,
  organizationType?: string
): Role[] {
  if (actorRole === 'super_admin') {
    return ALL_SUPER_ADMIN_ROLES
  }

  if (actorRole !== 'admin') {
    return []
  }

  switch (organizationType) {
    case 'school':
    case 'college':
    case 'coaching':
      return SCHOOL_ROLES

    case 'company':
    case 'startup':
    case 'ngo':
      return COMPANY_ROLES

    case 'institute':
    case 'others':
    default:
      return INSTITUTE_ROLES
  }
}

function roleLabel(role: Role) {
  return ROLE_META[role]?.label ?? role
}

function RoleBadge({
  role,
}: {
  role: Role
}) {
  const meta = ROLE_META[role]
  const Icon = meta?.icon ?? Users

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border px-2.5 py-1
        text-xs font-medium
        ${
          meta?.className ??
          'border-gray-200 bg-gray-50 text-gray-700'
        }
      `}
    >
      <Icon size={12} />
      {meta?.label ?? role}
    </span>
  )
}

function StatusBadge({
  status,
}: {
  status: UserRecord['status']
}) {
  const config = {
    active:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    inactive:
      'border-gray-200 bg-gray-50 text-gray-600',
    suspended:
      'border-red-200 bg-red-50 text-red-700',
  }

  return (
    <span
      className={`
        inline-flex rounded-full
        border px-2.5 py-1
        text-xs font-medium
        ${config[status]}
      `}
    >
      {status}
    </span>
  )
}

function UserDetailsModal({
  user,
  onClose,
}: {
  user: UserRecord | null
  onClose: () => void
}) {
  if (!user) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 font-semibold text-white">
              {initials(user.name)}
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                {user.name}
              </h2>

              <p className="text-sm text-gray-500">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                User code
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {user.userCode ?? '—'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                Status
              </p>

              <div className="mt-1">
                <StatusBadge
                  status={user.status}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                Public ID
              </p>

              <p className="mt-1 truncate font-mono text-xs font-semibold text-gray-900">
                {user.publicId ?? '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Role
            </p>

            <RoleBadge role={user.role} />
          </div>

          <div className="space-y-3 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail
                size={15}
                className="text-gray-400"
              />

              <span>{user.email}</span>
            </div>

            {user.profile?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone
                  size={15}
                  className="text-gray-400"
                />

                <span>
                  {user.profile.phone}
                </span>
              </div>
            )}

            {user.mustChangePassword && (
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Lock size={13} />

                Password change required on first login
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserRow({
  user,
  onView,
  onEdit,
  onDeactivate,
  navigate: Navigate,

}: {
  user: UserRecord
  onView: () => void
  onEdit: () => void
  onDeactivate: () => void
  navigate: (path: string) => void
}) {
  return (
 <tr
  key={user.publicId}
  onClick={() => Navigate(`/dashboard/users/${user.publicId}`)}
  className="group cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
            {initials(user.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">
              {user.name}
            </p>

            <p className="truncate text-xs text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-xs text-gray-500">
          {user.userCode ?? '—'}
        </span>
      </td>

      <td className="px-5 py-4">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={user.status} />
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={onView}
            title="View"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-900"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={onEdit}
            title="Edit"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-900"
          >
            <Pencil size={16} />
          </button>

          {user.status === 'active' && (
            <button
              onClick={onDeactivate}
              title="Deactivate"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <UserX size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function UsersPage() {
  const currentUser = useAppSelector(
    (state) => state.auth.user
  ) as any
const Navigate = useNavigate()
  const actorRole =
    (currentUser?.role ??
      'student') as Role

  const instituteId =
    currentUser?.instituteId
      ? String(currentUser.instituteId)
      : undefined

  const organizationType =
    currentUser?.organization?.type ??
    currentUser?.institute?.type

  const isSuperAdmin =
    actorRole === 'super_admin'

  const isAdmin =
    actorRole === 'admin'

  const canManageUsers =
    isSuperAdmin || isAdmin

  const [search, setSearch] =
    useState('')

  const [roleFilter, setRoleFilter] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('')

  const [showCreate, setShowCreate] =
    useState(false)

  const [selectedUser, setSelectedUser] =
    useState<UserRecord | null>(null)

  const query = useMemo(
    () => ({
      search:
        search.trim() || undefined,

      role:
        roleFilter || undefined,

      status:
        statusFilter || undefined,

      instituteId: isSuperAdmin
        ? undefined
        : instituteId,
    }),
    [
      search,
      roleFilter,
      statusFilter,
      isSuperAdmin,
      instituteId,
    ]
  )

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetUsersQuery(
    query as any
  )

  const users: UserRecord[] =
    (data ?? []).map((user: any) => ({
      ...user,

      role:
        user.role as UserRecord['role'],

      status:
        (user.status ??
          'active') as UserRecord['status'],

      instituteId:
        typeof user.instituteId ===
        'object'
          ? user.instituteId?._id
          : user.instituteId ??
            undefined,
    }))

  const [updateUser] =
    useUpdateUserMutation()

  const availableCreateRoles =
    getRoleOptions(
      actorRole,
      organizationType
    )

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      if (
        search &&
        !`${user.name} ${
          user.email
        } ${
          user.userCode ?? ''
        } ${
          user.publicId ?? ''
        }`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      ) {
        return false
      }

      if (
        roleFilter &&
        user.role !== roleFilter
      ) {
        return false
      }

      if (
        statusFilter &&
        user.status !== statusFilter
      ) {
        return false
      }

      return true
    })
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ])

  const stats = useMemo(() => {
    const active =
      users.filter(
        (x) =>
          x.status === 'active'
      ).length

    const teachers =
      users.filter(
        (x) =>
          x.role === 'teacher'
      ).length

    const students =
      users.filter(
        (x) =>
          x.role === 'student'
      ).length

    const staff =
      users.filter((x) =>
        [
          'admin',
          'principal',
          'hr',
          'accountant',
          'counselor',
          'support',
          'employee',
        ].includes(x.role)
      ).length

    return {
      total: users.length,
      active,
      teachers,
      students,
      staff,
    }
  }, [users])

  const handleDeactivate = async (
    user: UserRecord
  ) => {
    if (
      !window.confirm(
        `Deactivate ${user.name}?`
      )
    ) {
      return
    }

    try {
      await updateUser({
        id: getId(user),
        payload: {
          status: 'inactive',
        },
      }).unwrap()

      refetch()
    } catch (error) {
      window.alert(
        getErrorMessage(error)
      )
    }
  }

  return (
    <div className="min-h-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            <Users size={14} />
            User Management
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Users
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {isSuperAdmin
              ? 'Manage users across all organizations.'
              : 'Manage people and roles inside your organization.'}
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() =>
              setShowCreate(true)
            }
            className="
              inline-flex h-11
              items-center justify-center
              gap-2 rounded-xl
              bg-gray-900 px-5
              text-sm font-medium
              text-white shadow-sm
              transition hover:bg-black
            "
          >
            <Plus size={17} />
            Add user
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: 'Total users',
            value: stats.total,
            icon: Users,
          },
          {
            label: 'Active',
            value: stats.active,
            icon: UserCheck,
          },
          {
            label: 'Teachers',
            value: stats.teachers,
            icon: GraduationCap,
          },
          {
            label: 'Students',
            value: stats.students,
            icon: BookOpen,
          },
          {
            label: 'Staff',
            value: stats.staff,
            icon: Briefcase,
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.label}
              className="
                rounded-2xl
                border border-gray-100
                bg-white p-4
                shadow-sm
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">
                    {item.label}
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                    {item.value}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5 text-gray-500">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search users by name, email, user code or public ID..."
                className="
                  h-11 w-full
                  rounded-xl
                  border border-gray-200
                  bg-gray-50
                  pl-10 pr-4
                  text-sm outline-none
                  transition
                  focus:border-gray-900
                  focus:bg-white
                "
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value
                )
              }
              className="
                h-11 rounded-xl
                border border-gray-200
                bg-white px-3
                text-sm outline-none
                focus:border-gray-900
              "
            >
              <option value="">
                All roles
              </option>

              {(
                isSuperAdmin
                  ? ALL_SUPER_ADMIN_ROLES
                  : availableCreateRoles
              ).map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {roleLabel(role)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="
                h-11 rounded-xl
                border border-gray-200
                bg-white px-3
                text-sm outline-none
                focus:border-gray-900
              "
            >
              <option value="">
                All status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="suspended">
                Suspended
              </option>
            </select>

            <button
              onClick={() => refetch()}
              className="
                inline-flex h-11
                items-center justify-center
                gap-2 rounded-xl
                border border-gray-200
                px-4 text-sm font-medium
                text-gray-700
                transition hover:bg-gray-50
              "
            >
              <RefreshCw
                size={15}
                className={
                  isFetching
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({
              length: 7,
            }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="rounded-2xl bg-red-50 p-4 text-red-500">
              <AlertTriangle size={28} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              Failed to load users
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Please check your connection and try again.
            </p>

            <button
              onClick={() => refetch()}
              className="
                mt-5 inline-flex
                items-center gap-2
                rounded-xl
                bg-gray-900
                px-4 py-2.5
                text-sm font-medium
                text-white
              "
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="rounded-2xl bg-gray-50 p-4 text-gray-400">
              <Users size={28} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No users found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {search ||
              roleFilter ||
              statusFilter
                ? 'Try changing your filters.'
                : 'Create your first organization user.'}
            </p>

            {canManageUsers &&
              !search &&
              !roleFilter &&
              !statusFilter && (
                <button
                  onClick={() =>
                    setShowCreate(true)
                  }
                  className="
                    mt-5 inline-flex
                    items-center gap-2
                    rounded-xl
                    bg-gray-900
                    px-4 py-2.5
                    text-sm font-medium
                    text-white
                  "
                >
                  <Plus size={15} />
                  Add user
                </button>
              )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      User
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      User ID
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Role
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleUsers.map(
                    (user) => (
                      <UserRow
                        key={getId(user)}
                        user={user}
                        onView={() =>
                          setSelectedUser(
                            user
                          )
                        }
                        onEdit={() =>
                          setSelectedUser(
                            user
                          )
                        }
                        onDeactivate={() =>
                          handleDeactivate(
                            user
                          )
                        }
                        navigate={Navigate}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing{' '}
                {visibleUsers.length} of{' '}
                {users.length} users
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Organization scoped
              </span>
            </div>
          </>
        )}
      </div>

      <CreateUserModal
        open={showCreate}
        onClose={() =>
          setShowCreate(false)
        }
        actorRole={actorRole}
        organizationType={
          organizationType
        }
        instituteId={instituteId}
        onCreated={() => refetch()}
      />

      <UserDetailsModal
        user={selectedUser}
        onClose={() =>
          setSelectedUser(null)
        }
      />
    </div>
  )
}