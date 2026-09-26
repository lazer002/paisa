import {
  Building2, Users, GraduationCap, Briefcase, UserCog, Megaphone, FileText, ShieldCheck,
} from 'lucide-react'
import {
  useGetSuperAdminStatsQuery,
  useGetAdminStatsQuery,
  useGetHRStatsQuery,
} from '@/features/stats/statsApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { LoadingGrid, ErrorState } from '@/components/ui/StateViews'

export default function ReportsPage() {
  const role = useAppSelector((s) => s.auth.user?.role)

  const superQ = useGetSuperAdminStatsQuery(undefined, { skip: role !== 'super_admin' })
  const adminQ = useGetAdminStatsQuery(undefined, { skip: role !== 'admin' })
  const hrQ = useGetHRStatsQuery(undefined, { skip: role !== 'hr' })

  if (role === 'super_admin') {
    const d = superQ.data
    return (
      <div className="space-y-6">
        <PageHeader title="Platform Reports" subtitle="Organization-wide statistics" />
        {superQ.isLoading ? <LoadingGrid cards={6} height="h-32" />
        : superQ.isError ? <ErrorState onRetry={() => superQ.refetch()} />
        : d && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Organizations" value={d.organizations} icon={Building2} color="bg-blue-50 text-blue-600" />
              <StatCard label="Total Users" value={d.users} icon={Users} color="bg-purple-50 text-purple-600" />
              <StatCard label="Institutes" value={d.institutes} icon={GraduationCap} color="bg-green-50 text-green-600" />
              <StatCard label="Companies" value={d.companies} icon={Briefcase} color="bg-orange-50 text-orange-600" />
              <StatCard label="Admins" value={d.admins} icon={ShieldCheck} color="bg-red-50 text-red-500" />
              <StatCard label="HR Managers" value={d.hr} icon={UserCog} color="bg-yellow-50 text-yellow-600" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Teachers" value={d.teachers} icon={GraduationCap} color="bg-teal-50 text-teal-600" />
              <StatCard label="Students" value={d.students} icon={GraduationCap} color="bg-indigo-50 text-indigo-600" />
              <StatCard label="Employees" value={d.employees} icon={Briefcase} color="bg-cyan-50 text-cyan-600" />
            </div>
          </>
        )}
      </div>
    )
  }

  if (role === 'admin') {
    const d = adminQ.data
    return (
      <div className="space-y-6">
        <PageHeader title="Organization Reports" subtitle="Your organization at a glance" />
        {adminQ.isLoading ? <LoadingGrid cards={6} height="h-32" />
        : adminQ.isError ? <ErrorState onRetry={() => adminQ.refetch()} />
        : d && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Teachers" value={d.teachers} icon={GraduationCap} color="bg-teal-50 text-teal-600" />
            <StatCard label="Students" value={d.students} icon={GraduationCap} color="bg-indigo-50 text-indigo-600" />
            <StatCard label="Employees" value={d.employees} icon={Briefcase} color="bg-cyan-50 text-cyan-600" />
            <StatCard label="HR Managers" value={d.hr} icon={UserCog} color="bg-yellow-50 text-yellow-600" />
            <StatCard label="Active Announcements" value={d.announcements} icon={Megaphone} color="bg-blue-50 text-blue-600" />
            <StatCard label="Pending Leaves" value={d.pendingLeaves} icon={FileText} color="bg-orange-50 text-orange-600" />
          </div>
        )}
      </div>
    )
  }

  // hr
  const d = hrQ.data
  return (
    <div className="space-y-6">
      <PageHeader title="HR Reports" subtitle="Workforce and leave analytics" />
      {hrQ.isLoading ? <LoadingGrid cards={4} height="h-32" />
      : hrQ.isError ? <ErrorState onRetry={() => hrQ.refetch()} />
      : d && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Employees" value={d.employees} icon={Briefcase} color="bg-cyan-50 text-cyan-600" />
          <StatCard label="Pending Leaves" value={d.pendingLeaves} icon={FileText} color="bg-orange-50 text-orange-600" />
          <StatCard label="Payrolls Processed" value={d.processedPayrolls} icon={FileText} color="bg-green-50 text-green-600" />
          <StatCard label="Departments" value={d.departments} icon={Building2} color="bg-blue-50 text-blue-600" />
        </div>
      )}
    </div>
  )
}
