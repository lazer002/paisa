import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, ShieldCheck, CalendarCheck, Wallet, FileText,
  ClipboardList, GraduationCap, Clock, BadgeCheck,
} from 'lucide-react'
import { useGetUserDetailQuery } from '@/features/users/userDetailApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-2.5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-700">{value ?? '—'}</span>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = useAppSelector((s) => s.auth.user)

  const { data, isLoading, isError, refetch } = useGetUserDetailQuery(id!)

  const [tab, setTab] = useState<'profile' | 'activity' | 'permissions'>('profile')

  if (isLoading) return <LoadingList rows={6} />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!data) return null

  const { user: u, permissions, activity } = data
  const orgName = typeof u.instituteId === 'object' ? u.instituteId?.name : 'Platform account'

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-black"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-black text-2xl font-bold text-white">
              {u.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{u.name}</h1>
              <p className="flex items-center gap-1 text-sm text-gray-400"><Mail size={13} /> {u.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge color="blue">{u.role?.replace('_', ' ')}</Badge>
                <Badge color={u.status === 'inactive' ? 'red' : 'green'}>{u.status ?? 'active'}</Badge>
                {u.userCode && <Badge color="gray">{u.userCode}</Badge>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Organization</p>
            <p className="font-semibold text-gray-800">{orgName}</p>
            {typeof u.instituteId === 'object' && u.instituteId && (
              <Link
                to="/dashboard/organizations"
                className="text-xs text-gray-400 underline hover:text-black"
              >
                view org →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm">
        {(['profile', 'activity', 'permissions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Account</h3>
            <InfoRow label="User code" value={u.userCode} />
            <InfoRow label="Role" value={<span className="capitalize">{u.role?.replace('_', ' ')}</span>} />
            <InfoRow label="Status" value={<Badge color={u.status === 'inactive' ? 'red' : 'green'}>{u.status ?? 'active'}</Badge>} />
            <InfoRow label="Joined" value={u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'} />
            <InfoRow label="Last login" value={u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Contact</h3>
            <InfoRow label="Email" value={u.email} />
            <InfoRow label="Phone" value={u.profile?.phone} />
            <InfoRow label="Address" value={u.profile?.address} />
            <InfoRow label="Organization" value={orgName} />
            {typeof u.instituteId === 'object' && u.instituteId && (
              <InfoRow label="Org type" value={<span className="capitalize">{u.instituteId.type}</span>} />
            )}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Attendance summary */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <CalendarCheck size={16} /> Attendance
            </h3>
            {activity.attendancePercent != null ? (
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                  <span className="text-xl font-bold text-green-600">{activity.attendancePercent}%</span>
                </div>
                <p className="text-sm text-gray-500">Last {activity.recentAttendance.length} records</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No attendance records</p>
            )}
          </div>

          {/* Classes */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <GraduationCap size={16} /> Classes
            </h3>
            {activity.teachingClasses?.length > 0 && (
              <>
                <p className="mb-1 text-xs text-gray-400">Teaching</p>
                {activity.teachingClasses.map((c: any) => (
                  <p key={c._id} className="flex items-center gap-2 py-0.5 text-sm text-gray-600">
                    <BadgeCheck size={12} className="text-teal-500" /> {c.name} · {c.subject}
                  </p>
                ))}
              </>
            )}
            {activity.enrolledClasses?.length > 0 && (
              <>
                <p className="mb-1 mt-3 text-xs text-gray-400">Enrolled</p>
                {activity.enrolledClasses.map((c: any) => (
                  <p key={c._id} className="flex items-center gap-2 py-0.5 text-sm text-gray-600">
                    <BadgeCheck size={12} className="text-indigo-500" /> {c.name} · {c.subject}
                  </p>
                ))}
              </>
            )}
            {!activity.teachingClasses?.length && !activity.enrolledClasses?.length && (
              <p className="text-sm text-gray-400">No class memberships</p>
            )}
          </div>

          {/* Leaves */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <FileText size={16} /> Recent Leaves
            </h3>
            {activity.leaves?.length ? (
              activity.leaves.slice(0, 5).map((l: any) => (
                <div key={l._id} className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0">
                  <div>
                    <p className="text-sm capitalize text-gray-700">{l.type} · {l.days}d</p>
                    <p className="text-xs text-gray-400">{new Date(l.startDate).toLocaleDateString()}</p>
                  </div>
                  <Badge color={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : l.status === 'cancelled' ? 'gray' : 'yellow'}>
                    {l.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No leave history</p>
            )}
          </div>

          {/* Payroll */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <Wallet size={16} /> Payslips
            </h3>
            {activity.payrolls?.length ? (
              activity.payrolls.slice(0, 5).map((p: any) => (
                <div key={p._id} className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0">
                  <p className="text-sm text-gray-700">{p.month}/{p.year}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">₹{p.netSalary?.toLocaleString()}</span>
                    <Badge color={p.status === 'paid' ? 'green' : 'blue'}>{p.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No payslips</p>
            )}
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <ShieldCheck size={16} /> Role permissions
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {permissions.map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                <BadgeCheck size={13} className="text-green-500" /> {p.replace(/_/g, ' ')}
              </div>
            ))}
            {!permissions.length && <p className="text-sm text-gray-400">No special permissions</p>}
          </div>
        </div>
      )}
    </div>
  )
}
