import {
  Activity,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText as FileTextIcon,
  GraduationCap,
  Megaphone,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import {
  useGetOrganizationsQuery,
} from '@/features/organizations/organizationsApi'

import {
  useGetUsersQuery,
} from '@/features/users/usersApi'

import {
  useGetAnnouncementsQuery,
} from '@/features/announcements/announcementsApi'

import {
  useGetSuperAdminStatsQuery,
  useGetAdminStatsQuery,
  useGetTeacherStatsQuery,
  useGetStudentStatsQuery,
  useGetHRStatsQuery,
  useGetEmployeeStatsQuery,
} from '@/features/stats/statsApi'

import { useAppSelector } from '@/app/store'

import Badge from '@/components/ui/badge'

import type { Organization } from '@/features/organizations/types'

/* ==========================================================================
   TYPES
   ========================================================================== */

type StatItem = {
  label: string
  value: string | number
  icon: any
  href?: string
  description?: string
}

type QuickAction = {
  label: string
  description: string
  icon: any
  href: string
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

const STATUS_COLOR = {
  active: 'green' as const,
  inactive: 'yellow' as const,
  suspended: 'red' as const,
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
  hr: 'HR',
  employee: 'Employee',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-slate-100 text-slate-700',
  teacher: 'bg-emerald-50 text-emerald-700',
  student: 'bg-blue-50 text-blue-700',
  hr: 'bg-violet-50 text-violet-700',
  employee: 'bg-orange-50 text-orange-700',
  principal: 'bg-indigo-50 text-indigo-700',
  accountant: 'bg-amber-50 text-amber-700',
  counselor: 'bg-pink-50 text-pink-700',
  support: 'bg-cyan-50 text-cyan-700',
}

function getInitials(name?: string | null) {
  if (!name) return 'U'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/* ==========================================================================
   ANNOUNCEMENTS
   ========================================================================== */

function AnnouncementsWidget() {
  const { data: announcements, isLoading } =
    useGetAnnouncementsQuery()

  const latest = (announcements ?? []).slice(0, 4)

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Megaphone size={16} className="text-gray-700" />
            </div>

            <h2 className="text-sm font-semibold text-gray-950">
              Announcements
            </h2>
          </div>

          <p className="mt-1 pl-10 text-xs text-gray-400">
            Latest communication
          </p>
        </div>

        <Link
          to="/dashboard/announcements"
          className="flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-gray-950"
        >
          View all
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-gray-50"
              />
            ))}
          </div>
        ) : !latest.length ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">
              <Megaphone
                size={20}
                className="text-gray-300"
              />
            </div>

            <p className="text-sm font-medium text-gray-700">
              No announcements
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Nothing new to review right now.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {latest.map((announcement) => (
              <Link
                key={announcement._id}
                to="/dashboard/announcements"
                className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Megaphone
                    size={14}
                    className="text-gray-600"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {announcement.title}
                    </p>

                    <Badge
                      color={
                        announcement.priority === 'high'
                          ? 'red'
                          : announcement.priority === 'medium'
                            ? 'orange'
                            : 'gray'
                      }
                    >
                      {announcement.priority}
                    </Badge>
                  </div>

                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                    {announcement.content}
                  </p>
                </div>

                <ChevronRight
                  size={15}
                  className="mt-1 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-600"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */

function DashboardStatCard({
  item,
}: {
  item: StatItem
}) {
  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/40">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
          <item.icon size={18} />
        </div>

        {item.href && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition group-hover:bg-gray-950 group-hover:text-white">
            <ArrowRight size={13} />
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          {item.label}
        </p>

        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold tracking-tight text-gray-950">
            {item.value}
          </p>
        </div>

        {item.description && (
          <p className="mt-1 text-xs text-gray-400">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )

  if (!item.href) {
    return content
  }

  return (
    <Link to={item.href}>
      {content}
    </Link>
  )
}

/* ==========================================================================
   QUICK ACTIONS
   ========================================================================== */

function QuickActions({
  actions,
}: {
  actions: QuickAction[]
}) {
  if (!actions.length) return null

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">
            Quick actions
          </h2>

          <p className="mt-0.5 text-xs text-gray-400">
            Common tasks for your workspace
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white transition group-hover:scale-105">
              <action.icon size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {action.label}
              </p>

              <p className="mt-0.5 truncate text-xs text-gray-400">
                {action.description}
              </p>
            </div>

            <ChevronRight
              size={15}
              className="flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-700"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ==========================================================================
   PEOPLE MIX
   ========================================================================== */

function PeopleMix({
  role,
  stats,
}: {
  role?: string
  stats: {
    label: string
    value: number
    icon: any
  }[]
}) {
  const total = stats.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-950">
              People overview
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Current people distribution
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
            <Users size={15} className="text-gray-600" />
          </div>
        </div>
      </div>

      <div className="p-6">
        {stats.length ? (
          <div className="space-y-5">
            {stats.map((item) => {
              const percentage =
                total > 0
                  ? Math.round(
                      (Number(item.value || 0) / total) * 100,
                    )
                  : 0

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50">
                        <item.icon
                          size={13}
                          className="text-gray-600"
                        />
                      </div>

                      <span className="text-xs font-medium text-gray-700">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        {item.value}
                      </span>

                      <span className="text-[10px] text-gray-400">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-950 transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">
            No people data available.
          </div>
        )}
      </div>
    </section>
  )
}

/* ==========================================================================
   ORGANIZATION LIST
   ========================================================================== */

function OrganizationsPanel({
  organizations,
  isLoading,
  isSuperAdmin,
}: {
  organizations: Organization[]
  isLoading: boolean
  isSuperAdmin: boolean
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">
            {isSuperAdmin
              ? 'Organizations'
              : 'My organization'}
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            {isSuperAdmin
              ? 'Recently created organizations'
              : 'Your organization workspace'}
          </p>
        </div>

        <Link
          to="/dashboard/organizations"
          className="flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-gray-950"
        >
          Manage
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-gray-50"
              />
            ))}
          </div>
        ) : !organizations.length ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">
              <Building2
                size={20}
                className="text-gray-300"
              />
            </div>

            <p className="text-sm font-medium text-gray-700">
              No organizations
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Create an organization to get started.
            </p>

            {isSuperAdmin && (
              <Link
                to="/dashboard/organizations"
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-gray-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
              >
                <Plus size={13} />
                Create organization
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {organizations.map((org) => (
              <Link
                key={org._id}
                to="/dashboard/organizations"
                className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-950 text-sm font-semibold text-white">
                  {org.name?.[0]?.toUpperCase() ?? 'O'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {org.name}
                    </p>

                    <Badge
                      color={
                        STATUS_COLOR[org.status] ?? 'gray'
                      }
                    >
                      {org.status}
                    </Badge>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{org.orgCode}</span>

                    <span className="h-1 w-1 rounded-full bg-gray-300" />

                    <span>{org.type}</span>
                  </div>
                </div>

                <ChevronRight
                  size={15}
                  className="flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-700"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ==========================================================================
   DASHBOARD HOME
   ========================================================================== */

export default function DashboardHomePage() {
  const user = useAppSelector((s) => s.auth.user)

  const role = user?.role

  const isSuperAdmin = role === 'super_admin'

  const isAdmin = role === 'admin'

  const canViewOrganizations = [
    'super_admin',
    'admin',
  ].includes(role ?? '')

  /* ------------------------------------------------------------------------
     API
     ------------------------------------------------------------------------ */

  const orgsQ = useGetOrganizationsQuery(
    {
      page: 1,
      limit: 6,
    },
    {
      skip: !canViewOrganizations,
    },
  )

  const usersQ = useGetUsersQuery(undefined, {
    skip: !canViewOrganizations,
  })

  const superQ = useGetSuperAdminStatsQuery(undefined, {
    skip: role !== 'super_admin',
  })

  const adminQ = useGetAdminStatsQuery(undefined, {
    skip: role !== 'admin',
  })

  const teacherQ = useGetTeacherStatsQuery(undefined, {
    skip: role !== 'teacher',
  })

  const studentQ = useGetStudentStatsQuery(undefined, {
    skip: role !== 'student',
  })

  const hrQ = useGetHRStatsQuery(undefined, {
    skip: role !== 'hr',
  })

  const empQ = useGetEmployeeStatsQuery(undefined, {
    skip: role !== 'employee',
  })

  /* ------------------------------------------------------------------------
     USER
     ------------------------------------------------------------------------ */

  const firstName =
    user?.name?.split(' ')[0] ?? 'there'

  const roleLabel =
    ROLE_LABELS[role ?? ''] ?? role ?? 'User'

  const subtitle: Record<string, string> = {
    super_admin:
      "Here's what's happening across your platform",
    admin:
      "Here's what's happening in your organization",
    teacher:
      'Your classes and assignments at a glance',
    student:
      'Your classes, attendance and assignments',
    hr:
      'Your workforce overview',
    employee:
      'Your work at a glance',
  }

  /* ------------------------------------------------------------------------
     STATS
     ------------------------------------------------------------------------ */

  let stats: StatItem[] = []

  let peopleStats: {
    label: string
    value: number
    icon: any
  }[] = []

  if (role === 'super_admin') {
    const d = superQ.data

    stats = [
      {
        label: 'Organizations',
        value: d?.organizations ?? '…',
        icon: Building2,
        href: '/dashboard/organizations',
        description: 'Across the platform',
      },
      {
        label: 'Total users',
        value: d?.users ?? '…',
        icon: Users,
        href: '/dashboard/users',
        description: 'Registered users',
      },
      {
        label: 'Institutes & companies',
        value: d
          ? d.institutes + d.companies
          : '…',
        icon: Building2,
        description: 'All organization types',
      },
      {
        label: 'Students',
        value: d?.students ?? '…',
        icon: GraduationCap,
        href: '/dashboard/students',
        description: 'Students across platform',
      },
    ]

    peopleStats = [
      {
        label: 'Students',
        value: Number(d?.students ?? 0),
        icon: GraduationCap,
      },
      {
        label: 'Users',
        value: Number(d?.users ?? 0),
        icon: Users,
      },
      {
        label: 'Organizations',
        value: Number(d?.organizations ?? 0),
        icon: Building2,
      },
    ]
  } else if (role === 'admin') {
    const d = adminQ.data

    stats = [
      {
        label: 'Organization',
        value: orgsQ.data?.total ?? '…',
        icon: Building2,
        href: '/dashboard/organizations',
        description: 'Your organization',
      },
      {
        label: 'Total users',
        value: usersQ.data?.length ?? '…',
        icon: Users,
        href: '/dashboard/users',
        description: 'People in workspace',
      },
      {
        label: 'Students',
        value: d?.students ?? '…',
        icon: GraduationCap,
        href: '/dashboard/students',
        description: 'Enrolled students',
      },
      {
        label: 'Pending leaves',
        value: d?.pendingLeaves ?? '…',
        icon: ClipboardList,
        href: '/dashboard/leaves',
        description: 'Require attention',
      },
    ]

    peopleStats = [
      {
        label: 'Students',
        value: Number(d?.students ?? 0),
        icon: GraduationCap,
      },
      {
        label: 'Users',
        value: Number(usersQ.data?.length ?? 0),
        icon: Users,
      },
    ]
  } else if (role === 'teacher') {
    const d = teacherQ.data

    stats = [
      {
        label: 'My classes',
        value: d?.myClasses ?? '…',
        icon: ClipboardList,
        href: '/dashboard/classes',
        description: 'Classes assigned to you',
      },
      {
        label: 'Assignments',
        value: d?.myAssignments ?? '…',
        icon: FileTextIcon,
        description: 'Your assignments',
      },
      {
        label: 'Pending submissions',
        value: d?.pendingSubmissions ?? '…',
        icon: Activity,
        description: 'Waiting for review',
      },
    ]
  } else if (role === 'student') {
    const d = studentQ.data

    stats = [
      {
        label: 'My classes',
        value: d?.enrolledClasses ?? '…',
        icon: ClipboardList,
        href: '/dashboard/classes',
        description: 'Current classes',
      },
      {
        label: 'Attendance',
        value: d
          ? `${d.attendancePercent}%`
          : '…',
        icon: CalendarCheck,
        href: '/dashboard/attendance',
        description: 'Current attendance',
      },
      {
        label: 'Pending work',
        value: d?.pendingAssignments ?? '…',
        icon: Activity,
        description: 'Assignments to complete',
      },
    ]
  } else if (role === 'hr') {
    const d = hrQ.data

    stats = [
      {
        label: 'Employees',
        value: d?.employees ?? '…',
        icon: Briefcase,
        href: '/dashboard/employees',
        description: 'Current workforce',
      },
      {
        label: 'Pending leaves',
        value: d?.pendingLeaves ?? '…',
        icon: ClipboardList,
        href: '/dashboard/leaves',
        description: 'Require attention',
      },
      {
        label: 'Payrolls done',
        value: d?.processedPayrolls ?? '…',
        icon: Wallet,
        href: '/dashboard/payroll',
        description: 'Processed payrolls',
      },
    ]
  } else {
    const d = empQ.data

    stats = [
      {
        label: 'Attendance',
        value: d
          ? `${d.attendancePercent}%`
          : '…',
        icon: CalendarCheck,
        href: '/dashboard/attendance',
        description: 'Your current attendance',
      },
      {
        label: 'My payslips',
        value: d?.myPayslips ?? '…',
        icon: Wallet,
        href: '/dashboard/payroll',
        description: 'Available payslips',
      },
      {
        label: 'Leaves taken',
        value: d?.myLeaves ?? '…',
        icon: ClipboardList,
        href: '/dashboard/leaves',
        description: 'Leave history',
      },
    ]
  }

  /* ------------------------------------------------------------------------
     LOADING
     ------------------------------------------------------------------------ */

  const isLoadingStats =
    superQ.isLoading ||
    adminQ.isLoading ||
    teacherQ.isLoading ||
    studentQ.isLoading ||
    hrQ.isLoading ||
    empQ.isLoading

  /* ------------------------------------------------------------------------
     QUICK ACTIONS
     ------------------------------------------------------------------------ */

  let quickActions: QuickAction[] = []

  if (role === 'super_admin') {
    quickActions = [
      {
        label: 'Organizations',
        description: 'Manage workspaces',
        icon: Building2,
        href: '/dashboard/organizations',
      },
      {
        label: 'Users',
        description: 'Manage platform users',
        icon: Users,
        href: '/dashboard/users',
      },
      {
        label: 'Announcements',
        description: 'Broadcast updates',
        icon: Megaphone,
        href: '/dashboard/announcements',
      },
      {
        label: 'System activity',
        description: 'Review platform activity',
        icon: Activity,
        href: '/dashboard/activity',
      },
    ]
  } else if (role === 'admin') {
    quickActions = [
      {
        label: 'Add user',
        description: 'Create a new account',
        icon: Plus,
        href: '/dashboard/users',
      },
      {
        label: 'Departments',
        description: 'Manage departments',
        icon: Building2,
        href: '/dashboard/departments',
      },
      {
        label: 'Announcements',
        description: 'Communicate with people',
        icon: Megaphone,
        href: '/dashboard/announcements',
      },
      {
        label: 'HR operations',
        description: 'Manage workforce',
        icon: Briefcase,
        href: '/dashboard/hr',
      },
    ]
  } else if (role === 'teacher') {
    quickActions = [
      {
        label: 'Classes',
        description: 'Open your classes',
        icon: ClipboardList,
        href: '/dashboard/classes',
      },
      {
        label: 'Assignments',
        description: 'Manage assignments',
        icon: FileTextIcon,
        href: '/dashboard/assignments',
      },
      {
        label: 'Attendance',
        description: 'Record attendance',
        icon: CalendarCheck,
        href: '/dashboard/attendance',
      },
    ]
  } else if (role === 'student') {
    quickActions = [
      {
        label: 'My classes',
        description: 'View enrolled classes',
        icon: GraduationCap,
        href: '/dashboard/classes',
      },
      {
        label: 'Attendance',
        description: 'View attendance',
        icon: CalendarCheck,
        href: '/dashboard/attendance',
      },
      {
        label: 'Assignments',
        description: 'View pending work',
        icon: FileTextIcon,
        href: '/dashboard/assignments',
      },
    ]
  } else if (role === 'hr') {
    quickActions = [
      {
        label: 'Employees',
        description: 'Manage employees',
        icon: Briefcase,
        href: '/dashboard/employees',
      },
      {
        label: 'Leave requests',
        description: 'Review leave requests',
        icon: ClipboardList,
        href: '/dashboard/leaves',
      },
      {
        label: 'Payroll',
        description: 'Manage payroll',
        icon: Wallet,
        href: '/dashboard/payroll',
      },
    ]
  } else {
    quickActions = [
      {
        label: 'Attendance',
        description: 'View your attendance',
        icon: CalendarCheck,
        href: '/dashboard/attendance',
      },
      {
        label: 'Payslips',
        description: 'View your payslips',
        icon: Wallet,
        href: '/dashboard/payroll',
      },
      {
        label: 'Leaves',
        description: 'Manage your leave',
        icon: ClipboardList,
        href: '/dashboard/leaves',
      },
    ]
  }

  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="absolute right-0 top-0 h-48 w-48 translate-x-20 -translate-y-20 rounded-full bg-gray-100" />

        <div className="absolute bottom-0 right-48 h-24 w-24 translate-y-12 rounded-full bg-gray-50" />

        <div className="relative px-6 py-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-950 text-lg font-semibold text-white shadow-lg shadow-gray-300">
                {getInitials(user?.name)}
              </div>

              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {roleLabel}
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                  Good afternoon, {firstName}
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {subtitle[role ?? 'employee']}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {role === 'admin' && (
                <Link
                  to="/dashboard/users"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  <Plus size={15} />
                  Add user
                </Link>
              )}

              {isSuperAdmin && (
                <Link
                  to="/dashboard/organizations"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  <Plus size={15} />
                  New organization
                </Link>
              )}

              <Link
                to="/dashboard/announcements"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <Bell size={15} />
                Notifications
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STATS                                                              */}
      {/* ------------------------------------------------------------------ */}

      {isLoadingStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: Math.max(stats.length, 3),
          }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white"
            />
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 ${
            stats.length >= 4
              ? 'sm:grid-cols-2 xl:grid-cols-4'
              : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {stats.map((stat) => (
            <DashboardStatCard
              key={stat.label}
              item={stat}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* QUICK ACTIONS                                                      */}
      {/* ------------------------------------------------------------------ */}

      <QuickActions actions={quickActions} />

      {/* ------------------------------------------------------------------ */}
      {/* MAIN GRID                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* -------------------------------------------------------------- */}
        {/* ORGANIZATIONS                                                   */}
        {/* -------------------------------------------------------------- */}

        {canViewOrganizations && (
          <div className="xl:col-span-7">
            <OrganizationsPanel
              organizations={
                orgsQ.data?.data ?? []
              }
              isLoading={orgsQ.isLoading}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* PEOPLE                                                          */}
        {/* -------------------------------------------------------------- */}

        {peopleStats.length > 0 && (
          <div
            className={
              canViewOrganizations
                ? 'xl:col-span-5'
                : 'xl:col-span-6'
            }
          >
            <PeopleMix
              role={role}
              stats={peopleStats}
            />
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* ANNOUNCEMENTS                                                   */}
        {/* -------------------------------------------------------------- */}

        <div
          className={
            canViewOrganizations
              ? 'xl:col-span-7'
              : 'xl:col-span-6'
          }
        >
          <AnnouncementsWidget />
        </div>

        {/* -------------------------------------------------------------- */}
        {/* WORKSPACE HEALTH                                                */}
        {/* -------------------------------------------------------------- */}

        <section
          className={
            canViewOrganizations
              ? 'xl:col-span-5'
              : 'xl:col-span-6'
          }
        >
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-950">
                    Workspace
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Quick overview of your workspace
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <ShieldCheck
                    size={15}
                    className="text-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                      <CheckCircle2
                        size={15}
                        className="text-emerald-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        Account status
                      </p>

                      <p className="text-[11px] text-gray-400">
                        Your account is active
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Users
                        size={15}
                        className="text-gray-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        People
                      </p>

                      <p className="text-[11px] text-gray-400">
                        Users currently visible to you
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-gray-900">
                    {usersQ.isLoading
                      ? '…'
                      : usersQ.data?.length ??
                        peopleStats.reduce(
                          (sum, item) =>
                            sum +
                            Number(item.value || 0),
                          0,
                        )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Activity
                        size={15}
                        className="text-gray-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        Platform access
                      </p>

                      <p className="text-[11px] text-gray-400">
                        Role-based workspace access
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LOWER INFORMATION BAR                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="rounded-2xl border border-gray-200 bg-gray-950 px-6 py-5 text-white lg:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Activity size={15} />
              </div>

              <p className="text-sm font-semibold">
                PAISA workspace
              </p>
            </div>

            <p className="mt-1 pl-10 text-xs text-gray-400">
              Everything you need to manage your day is available from the navigation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/announcements"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition hover:bg-white/10"
            >
              <Megaphone size={14} />
              Announcements
            </Link>

            {role === 'admin' && (
              <Link
                to="/dashboard/users"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-950 transition hover:bg-gray-100"
              >
                <Users size={14} />
                Manage users
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                to="/dashboard/organizations"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-950 transition hover:bg-gray-100"
              >
                <Building2 size={14} />
                Manage organizations
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}