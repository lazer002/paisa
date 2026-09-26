import { Building2, Users, Activity, ArrowRight, Megaphone, GraduationCap, Briefcase, ClipboardList, Wallet, CalendarCheck, FileText as FileTextIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import { useGetUsersQuery } from '@/features/users/usersApi'
import { useGetAnnouncementsQuery } from '@/features/announcements/announcementsApi'
import {
  useGetSuperAdminStatsQuery,
  useGetAdminStatsQuery,
  useGetTeacherStatsQuery,
  useGetStudentStatsQuery,
  useGetHRStatsQuery,
  useGetEmployeeStatsQuery,
} from '@/features/stats/statsApi'
import { useAppSelector } from '@/app/store'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/badge'
import { LoadingGrid } from '@/components/ui/StateViews'
import type { Organization } from '@/features/organizations/types'

const STATUS_COLOR = {
  active: 'green' as const,
  inactive: 'yellow' as const,
  suspended: 'red' as const,
}

function AnnouncementsWidget() {
  const { data: announcements } = useGetAnnouncementsQuery()
  const latest = (announcements ?? []).slice(0, 3)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Announcements</h2>
        <Link
          to="/dashboard/announcements"
          className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-black"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {!latest.length ? (
        <div className="py-6 text-center">
          <Megaphone size={32} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">No announcements right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {latest.map((a) => (
            <div key={a._id} className="rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-800">{a.title}</p>
                <Badge color={a.priority === 'high' ? 'red' : a.priority === 'medium' ? 'orange' : 'gray'}>
                  {a.priority}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-400">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardHomePage() {
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const isSuperAdmin = role === 'super_admin'

  // Data each role legitimately has access to (backend scopes it)
  const orgsQ = useGetOrganizationsQuery(
    { page: 1, limit: 6 },
    { skip: !['super_admin', 'admin'].includes(role ?? '') },
  )
  const usersQ = useGetUsersQuery(undefined, { skip: !['super_admin', 'admin'].includes(role ?? '') })

  const superQ = useGetSuperAdminStatsQuery(undefined, { skip: role !== 'super_admin' })
  const adminQ = useGetAdminStatsQuery(undefined, { skip: role !== 'admin' })
  const teacherQ = useGetTeacherStatsQuery(undefined, { skip: role !== 'teacher' })
  const studentQ = useGetStudentStatsQuery(undefined, { skip: role !== 'student' })
  const hrQ = useGetHRStatsQuery(undefined, { skip: role !== 'hr' })
  const empQ = useGetEmployeeStatsQuery(undefined, { skip: role !== 'employee' })

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const subtitle: Record<string, string> = {
    super_admin: "Here's what's happening across your platform",
    admin: "Here's what's happening in your organization",
    teacher: 'Your classes and assignments at a glance',
    student: 'Your classes, attendance and assignments',
    hr: 'Your workforce overview',
    employee: 'Your work at a glance',
  }

  // ─── Role-based stat cards ────────────────────────────────────────────────
  let stats: { label: string; value: string | number; icon: any; color: string; link?: string }[] = []

  if (role === 'super_admin') {
    const d = superQ.data
    stats = [
      { label: 'Organizations', value: d?.organizations ?? '…', icon: Building2, color: 'bg-blue-50 text-blue-600', link: '/dashboard/organizations' },
      { label: 'Total Users', value: d?.users ?? '…', icon: Users, color: 'bg-purple-50 text-purple-600', link: '/dashboard/users' },
      { label: 'Institutes + Companies', value: d ? d.institutes + d.companies : '…', icon: Building2, color: 'bg-green-50 text-green-600' },
      { label: 'Students', value: d?.students ?? '…', icon: GraduationCap, color: 'bg-orange-50 text-orange-600' },
    ]
  } else if (role === 'admin') {
    const d = adminQ.data
    stats = [
      { label: 'My Organization', value: orgsQ.data?.total ?? '…', icon: Building2, color: 'bg-blue-50 text-blue-600', link: '/dashboard/organizations' },
      { label: 'My Users', value: usersQ.data?.length ?? '…', icon: Users, color: 'bg-purple-50 text-purple-600', link: '/dashboard/users' },
      { label: 'Students', value: d?.students ?? '…', icon: GraduationCap, color: 'bg-teal-50 text-teal-600' },
      { label: 'Pending Leaves', value: d?.pendingLeaves ?? '…', icon: ClipboardList, color: 'bg-orange-50 text-orange-600', link: '/dashboard/leaves' },
    ]
  } else if (role === 'teacher') {
    const d = teacherQ.data
    stats = [
      { label: 'My Classes', value: d?.myClasses ?? '…', icon: ClipboardList, color: 'bg-blue-50 text-blue-600', link: '/dashboard/classes' },
      { label: 'Assignments', value: d?.myAssignments ?? '…', icon: FileTextIcon, color: 'bg-purple-50 text-purple-600' },
      { label: 'Pending Submissions', value: d?.pendingSubmissions ?? '…', icon: Activity, color: 'bg-orange-50 text-orange-600' },
    ]
  } else if (role === 'student') {
    const d = studentQ.data
    stats = [
      { label: 'My Classes', value: d?.enrolledClasses ?? '…', icon: ClipboardList, color: 'bg-blue-50 text-blue-600', link: '/dashboard/classes' },
      { label: 'Attendance', value: d ? `${d.attendancePercent}%` : '…', icon: CalendarCheck, color: 'bg-green-50 text-green-600', link: '/dashboard/attendance' },
      { label: 'Pending Work', value: d?.pendingAssignments ?? '…', icon: Activity, color: 'bg-orange-50 text-orange-600' },
    ]
  } else if (role === 'hr') {
    const d = hrQ.data
    stats = [
      { label: 'Employees', value: d?.employees ?? '…', icon: Briefcase, color: 'bg-cyan-50 text-cyan-600', link: '/dashboard/employees' },
      { label: 'Pending Leaves', value: d?.pendingLeaves ?? '…', icon: ClipboardList, color: 'bg-orange-50 text-orange-600', link: '/dashboard/leaves' },
      { label: 'Payrolls Done', value: d?.processedPayrolls ?? '…', icon: Wallet, color: 'bg-green-50 text-green-600', link: '/dashboard/payroll' },
    ]
  } else {
    const d = empQ.data
    stats = [
      { label: 'Attendance', value: d ? `${d.attendancePercent}%` : '…', icon: CalendarCheck, color: 'bg-green-50 text-green-600', link: '/dashboard/attendance' },
      { label: 'My Payslips', value: d?.myPayslips ?? '…', icon: Wallet, color: 'bg-blue-50 text-blue-600', link: '/dashboard/payroll' },
      { label: 'Leaves Taken', value: d?.myLeaves ?? '…', icon: ClipboardList, color: 'bg-purple-50 text-purple-600', link: '/dashboard/leaves' },
    ]
  }

  const isLoadingStats =
    superQ.isLoading || adminQ.isLoading || teacherQ.isLoading || studentQ.isLoading || hrQ.isLoading || empQ.isLoading

  const showOrgsSection = ['super_admin', 'admin'].includes(role ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-500">{subtitle[role ?? 'employee']}</p>
      </div>

      {/* Stats */}
      {isLoadingStats ? (
        <LoadingGrid cards={4} height="h-32" />
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${stats.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              link={stat.link}
            />
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${showOrgsSection ? 'lg:grid-cols-3' : ''}`}>
        {/* Organizations (admins + super admin only) */}
        {showOrgsSection && (
          <div className={`rounded-2xl bg-white p-6 shadow-sm ${isSuperAdmin ? '' : 'lg:col-span-2'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {isSuperAdmin ? 'Recent Organizations' : 'My Organization'}
              </h2>
              <Link
                to="/dashboard/organizations"
                className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-black"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {orgsQ.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : !orgsQ.data?.data?.length ? (
              <div className="py-8 text-center">
                <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">No organizations yet</p>
                {isSuperAdmin && (
                  <Link
                    to="/dashboard/organizations"
                    className="mt-2 inline-block text-sm font-medium text-black hover:underline"
                  >
                    Create one →
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orgsQ.data.data.map((org: Organization) => (
                  <div key={org._id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                      {org.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-400">{org.orgCode} · {org.type}</p>
                    </div>
                    <Badge color={STATUS_COLOR[org.status] ?? 'gray'}>{org.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements widget */}
        <div className={showOrgsSection ? '' : 'lg:col-span-1'}>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  )
}

