import {
  Building2, Users, GraduationCap, Briefcase, UserCog, Megaphone, FileText, ShieldCheck,
  Wallet, Receipt, IndianRupee, TrendingUp, Headphones, Ticket, UserPlus, Flame,
  BookOpen, BarChart3,
} from 'lucide-react'
import {
  useGetSuperAdminStatsQuery,
  useGetAdminStatsQuery,
  useGetTeacherStatsQuery,
  useGetHRStatsQuery,
  useGetAccountantStatsQuery,
  useGetCounselorStatsQuery,
  useGetSupportStatsQuery,
} from '@/features/stats/statsApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { LoadingGrid, ErrorState, EmptyState } from '@/components/ui/StateViews'

type Stat = {
  label: string
  value: number | string
  icon: typeof Users
  color: string
}

/**
 * One variant per role that the Reports nav entry is granted to
 * (see PATH_PERMISSION['/dashboard/reports'] = 'report:read').
 */
export default function ReportsPage() {
  const role = useAppSelector((s) => s.auth.user?.role)

  const superQ = useGetSuperAdminStatsQuery(undefined, { skip: role !== 'super_admin' })
  const adminQ = useGetAdminStatsQuery(undefined, { skip: role !== 'admin' && role !== 'principal' })
  const teacherQ = useGetTeacherStatsQuery(undefined, { skip: role !== 'teacher' })
  const hrQ = useGetHRStatsQuery(undefined, { skip: role !== 'hr' })
  const accountantQ = useGetAccountantStatsQuery(undefined, { skip: role !== 'accountant' })
  const counselorQ = useGetCounselorStatsQuery(undefined, { skip: role !== 'counselor' })
  const supportQ = useGetSupportStatsQuery(undefined, { skip: role !== 'support' })

  const query = {
    'super_admin': superQ,
    'admin': adminQ,
    'principal': adminQ,
    'teacher': teacherQ,
    'hr': hrQ,
    'accountant': accountantQ,
    'counselor': counselorQ,
    'support': supportQ,
  }[role ?? ''] as typeof superQ | undefined

  const header: Record<string, { title: string; subtitle: string }> = {
    super_admin: { title: 'Platform Reports', subtitle: 'Organization-wide statistics' },
    admin: { title: 'Organization Reports', subtitle: 'Your organization at a glance' },
    principal: { title: 'Academic Reports', subtitle: 'Your organization at a glance' },
    teacher: { title: 'Teaching Reports', subtitle: 'Your classes, assignments and grading load' },
    hr: { title: 'HR Reports', subtitle: 'Workforce and leave analytics' },
    accountant: { title: 'Finance Reports', subtitle: 'Invoices, collections and outstanding dues' },
    counselor: { title: 'Admissions Reports', subtitle: 'Pipeline health and conversions' },
    support: { title: 'Support Reports', subtitle: 'Ticket volume and resolution' },
  }

  const stats: Record<string, (d: Record<string, number>) => Stat[]> = {
    super_admin: (d) => [
      { label: 'Organizations', value: d.organizations, icon: Building2, color: 'bg-blue-50 text-blue-600' },
      { label: 'Total Users', value: d.users, icon: Users, color: 'bg-purple-50 text-purple-600' },
      { label: 'Institutes', value: d.institutes, icon: GraduationCap, color: 'bg-green-50 text-green-600' },
      { label: 'Companies', value: d.companies, icon: Briefcase, color: 'bg-orange-50 text-orange-600' },
      { label: 'Admins', value: d.admins, icon: ShieldCheck, color: 'bg-red-50 text-red-500' },
      { label: 'HR Managers', value: d.hr, icon: UserCog, color: 'bg-yellow-50 text-yellow-600' },
      { label: 'Teachers', value: d.teachers, icon: GraduationCap, color: 'bg-teal-50 text-teal-600' },
      { label: 'Students', value: d.students, icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
      { label: 'Employees', value: d.employees, icon: Briefcase, color: 'bg-cyan-50 text-cyan-600' },
    ],
    admin: (d) => [
      { label: 'Teachers', value: d.teachers, icon: GraduationCap, color: 'bg-teal-50 text-teal-600' },
      { label: 'Students', value: d.students, icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
      { label: 'Employees', value: d.employees, icon: Briefcase, color: 'bg-cyan-50 text-cyan-600' },
      { label: 'HR Managers', value: d.hr, icon: UserCog, color: 'bg-yellow-50 text-yellow-600' },
      { label: 'Active Announcements', value: d.announcements, icon: Megaphone, color: 'bg-blue-50 text-blue-600' },
      { label: 'Pending Leaves', value: d.pendingLeaves, icon: FileText, color: 'bg-orange-50 text-orange-600' },
    ],
    teacher: (d) => [
      { label: 'My Classes', value: d.myClasses, icon: GraduationCap, color: 'bg-teal-50 text-teal-600' },
      { label: 'My Assignments', value: d.myAssignments, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
      { label: 'Pending Submissions', value: d.pendingSubmissions, icon: FileText, color: 'bg-orange-50 text-orange-600' },
    ],
    hr: (d) => [
      { label: 'Employees', value: d.employees, icon: Briefcase, color: 'bg-cyan-50 text-cyan-600' },
      { label: 'Pending Leaves', value: d.pendingLeaves, icon: FileText, color: 'bg-orange-50 text-orange-600' },
      { label: 'Payrolls Processed', value: d.processedPayrolls, icon: Wallet, color: 'bg-green-50 text-green-600' },
      { label: 'Departments', value: d.departments, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    ],
    accountant: (d) => [
      { label: 'Total Invoices', value: d.totalInvoices, icon: Receipt, color: 'bg-blue-50 text-blue-600' },
      { label: 'Paid Invoices', value: d.paidInvoices, icon: IndianRupee, color: 'bg-green-50 text-green-600' },
      { label: 'Open Invoices', value: d.openInvoices, icon: FileText, color: 'bg-orange-50 text-orange-600' },
      { label: 'Outstanding (₹)', value: d.outstanding, icon: TrendingUp, color: 'bg-red-50 text-red-600' },
    ],
    counselor: (d) => [
      { label: 'Total Leads', value: d.totalLeads, icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
      { label: 'New Leads', value: d.newLeads, icon: Flame, color: 'bg-orange-50 text-orange-600' },
      { label: 'Converted Leads', value: d.convertedLeads, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
      { label: 'Open Deals', value: d.openDeals, icon: Briefcase, color: 'bg-purple-50 text-purple-600' },
    ],
    support: (d) => [
      { label: 'Total Tickets', value: d.totalTickets, icon: Ticket, color: 'bg-blue-50 text-blue-600' },
      { label: 'Open Tickets', value: d.openTickets, icon: Headphones, color: 'bg-orange-50 text-orange-600' },
      { label: 'Resolved Tickets', value: d.resolvedTickets, icon: ShieldCheck, color: 'bg-green-50 text-green-600' },
    ],
  }

  const h = header[role ?? ''] ?? { title: 'Reports', subtitle: 'Statistics for your role' }

  if (!query) {
    return (
      <div className="space-y-6">
        <PageHeader title={h.title} subtitle={h.subtitle} />
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="No reports for your role yet"
          hint="Reports are available to admin, principal, teacher, hr, accountant, counselor and support roles."
        />
      </div>
    )
  }

  const { isLoading, isError, refetch, data } = query

  return (
    <div className="space-y-6">
      <PageHeader title={h.title} subtitle={h.subtitle} />
      {isLoading ? (
        <LoadingGrid cards={6} height="h-32" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(stats[role ?? ''] ?? (() => []))(data as unknown as Record<string, number>).map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
