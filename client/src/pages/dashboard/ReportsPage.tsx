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
  useGetReportTrendsQuery,
  type ReportSeries,
  type ReportTrends,
} from '@/features/stats/statsApi'
import { useState } from 'react'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { LoadingGrid, ErrorState, EmptyState } from '@/components/ui/StateViews'
import ExportMenu from '@/components/ui/ExportMenu'
import { SectionCard } from '@/components/ui/kit'
import { TrendChart, BreakdownBars } from '@/components/reports/charts'
import { formatValue } from '@/components/reports/format'
import { fmtDateTime, type ExportColumn, type ExportSection } from '@/lib/export'

type Stat = {
  label: string
  value: number | string
  icon: typeof Users
  color: string
}

const REPORT_EXPORT_COLUMNS: ExportColumn<Stat>[] = [
  { header: 'Metric', value: (s) => s.label.replace(' (₹)', ' (INR)') },
  {
    header: 'Value',
    value: (s) =>
      typeof s.value === 'number'
        ? s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : s.value ?? '',
  },
]

// Roles the server builds a trends report for (reportController REPORTS).
const TREND_ROLES = {
  super_admin: true, admin: true, principal: true, teacher: true,
  hr: true, accountant: true, counselor: true, support: true,
}

const PRESETS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '12m', label: '12 months', days: 365 },
]

/** Local calendar date as YYYY-MM-DD. */
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const today = () => dateKey(new Date())

/** The last `days` days, today included. */
function presetRange(days: number) {
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: dateKey(from), to: today() }
}

/** "Total 1,240" for counts and money; rates and hours have no meaningful total. */
function seriesTotal(s: ReportSeries): string | undefined {
  if (s.format !== 'count' && s.format !== 'currency') return undefined
  return s.datasets
    .map((d) => `${d.label} ${formatValue(d.data.reduce<number>((a, b) => a + (b ?? 0), 0), s.format)}`)
    .join(' · ')
}

/** One export table per chart: bucket rows × dataset columns, and label/value rows for breakdowns. */
function trendExportSections(trends: ReportTrends): ExportSection<unknown>[] {
  const seriesSections = trends.series.map((s) => ({
    title: s.title,
    columns: [
      { header: trends.range.unit === 'day' ? 'Date' : 'Month', value: (i: number) => trends.range.buckets[i] },
      ...s.datasets.map((d) => ({ header: d.label, value: (i: number) => d.data[i] })),
    ],
    rows: trends.range.buckets.map((_, i) => i),
  }))

  const breakdownSections = trends.breakdowns.map((b) => ({
    title: b.title,
    columns: [
      { header: 'Item', value: (row: { label: string }) => row.label },
      { header: b.format === 'currency' ? 'Value (INR)' : 'Value', value: (row: { value: number }) => row.value },
    ],
    rows: b.items,
  }))

  return [...seriesSections, ...breakdownSections] as ExportSection<unknown>[]
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

  const [range, setRange] = useState(() => presetRange(30))
  const trendsQ = useGetReportTrendsQuery(range, { skip: !role || !(role in TREND_ROLES) })
  const trends = trendsQ.data

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

  // Principal reads the same organization stats as admin.
  const statsFor = stats[role === 'principal' ? 'admin' : role ?? ''] ?? (() => [])
  const shown: Stat[] = data ? statsFor(data as unknown as Record<string, number>) : []

  const exportSections: ExportSection<unknown>[] = [
    { title: 'Summary', columns: REPORT_EXPORT_COLUMNS, rows: shown } as ExportSection<unknown>,
    ...(trends ? trendExportSections(trends) : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={h.title}
        subtitle={h.subtitle}
        actions={
          <ExportMenu
            title={h.title}
            subtitle={`${h.subtitle} · ${trends ? `${trends.range.from} to ${trends.range.to} · ` : ''}as of ${fmtDateTime(new Date())}`}
            sections={exportSections}
            disabled={!data}
          />
        }
      />
      {isLoading ? (
        <LoadingGrid cards={6} height="h-32" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
          ))}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Trends</h2>
            <p className="text-xs text-gray-500">
              {trends
                ? `${trends.range.from} to ${trends.range.to} · by ${trends.range.unit}`
                : 'Pick a period'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5" role="group" aria-label="Period">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRange(presetRange(p.days))}
                  aria-pressed={range.from === presetRange(p.days).from && range.to === today()}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    range.from === presetRange(p.days).from && range.to === today()
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              aria-label="From"
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700"
              value={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })}
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              aria-label="To"
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700"
              value={range.to}
              min={range.from}
              max={today()}
              onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })}
            />
          </div>
        </div>

        {trendsQ.isLoading || (trendsQ.isFetching && !trends) ? (
          <LoadingGrid cards={2} height="h-64" />
        ) : trendsQ.isError ? (
          <ErrorState
            message={(trendsQ.error as { data?: { message?: string } })?.data?.message ?? 'Could not load trends'}
            onRetry={() => trendsQ.refetch()}
          />
        ) : trends ? (
          <div className={`grid gap-4 lg:grid-cols-2 ${trendsQ.isFetching ? 'opacity-60' : ''}`}>
            {trends.series.map((s) => (
              <SectionCard key={s.key} title={s.title} subtitle={seriesTotal(s)}>
                <TrendChart series={s} buckets={trends.range.buckets} />
              </SectionCard>
            ))}
            {trends.breakdowns.map((b) => (
              <SectionCard key={b.key} title={b.title}>
                <BreakdownBars breakdown={b} />
              </SectionCard>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
