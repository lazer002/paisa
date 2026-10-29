import { useState } from 'react'
import { CalendarCheck, Check } from 'lucide-react'

import {
  useGetMyAttendanceQuery,
  useMarkAttendanceMutation,
  type AttendanceStatus,
  type AttendanceRecord,
} from '@/features/attendance/attendanceApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import {
  SelfCheckPanel,
  ClassCodePanel,
  OpenSessionPanel,
  GeofencePanel,
} from '@/components/attendance/AttendanceTools'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: 'bg-green-500 text-white',
  absent: 'bg-red-500 text-white',
  late: 'bg-yellow-500 text-white',
}

function MarkPanel() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const { data: users } = useGetUsersQuery()
  const [markAttendance, { isLoading }] = useMarkAttendanceMutation()
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})
  const [saved, setSaved] = useState(false)

  const people = (users ?? []).filter((u) => u.status !== 'inactive')

  const setAll = (s: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    people.forEach((p) => { next[rid(p)] = s })
    setRecords(next)
  }

  const handleSave = async () => {
    const payload = Object.entries(records).map(([userId, status]) => ({ userId, status }))
    if (!payload.length) return
    await markAttendance({ date, records: payload }).unwrap()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAll('present')}>All Present</Button>
          <Button variant="secondary" size="sm" onClick={() => setAll('absent')}>All Absent</Button>
          <Button size="sm" onClick={handleSave} loading={isLoading} disabled={!Object.keys(records).length}>
            {saved ? <><Check size={14} /> Saved</> : 'Save Attendance'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        {people.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">
            No users in your organization yet — create accounts on the Users page first.
          </p>
        ) : (
          people.map((p) => (
            <div key={rid(p)} className="flex items-center justify-between border-b border-gray-50 px-4 py-2.5 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">{p.userCode ?? p.email} · {p.role}</p>
              </div>
              <div className="flex gap-1.5">
                {(['present', 'late', 'absent'] as AttendanceStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setRecords((prev) => ({ ...prev, [rid(p)]: s }))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                      records[rid(p)] === s ? STATUS_STYLE[s] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MyAttendancePanel({ isParent }: { isParent: boolean }) {
  const { data, isLoading, isError, refetch } = useGetMyAttendanceQuery()
  const [child, setChild] = useState('')

  if (isLoading) return <LoadingList rows={4} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const childName = (r: AttendanceRecord) => (typeof r.userId === 'object' ? r.userId.name : '')
  const allRecords = data?.records ?? []
  const children = isParent ? [...new Set(allRecords.map(childName).filter(Boolean))] : []

  // A parent can have several children, so the summary is recomputed for
  // whichever child is selected (the server total mixes them together).
  const records = child ? allRecords.filter((r) => childName(r) === child) : allRecords
  const count = (status: string) => records.filter((r) => r.status === status).length
  const s = isParent
    ? {
        total: records.length,
        present: count('present'),
        late: count('late'),
        absent: count('absent'),
        percentage: records.length ? Math.round((count('present') / records.length) * 100) : 0,
      }
    : data?.summary

  return (
    <div className="space-y-4">
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {['', ...children].map((name) => (
            <button
              key={name || 'all'}
              onClick={() => setChild(name)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                child === name ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {name || 'All children'}
            </button>
          ))}
        </div>
      )}
      {s && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{s.percentage}%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">{s.present}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{s.late}</p>
            <p className="text-xs text-gray-500">Late</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-red-500">{s.absent}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm">
        {records.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CalendarCheck size={40} className="mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">No attendance records yet</p>
          </div>
        ) : (
          records.map((r) => (
            <div key={r.publicId ?? r._id} className="flex items-center justify-between border-b border-gray-50 px-5 py-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400">
                  {isParent && childName(r) ? `${childName(r)} · ` : ''}
                  {typeof r.classId === 'object' && r.classId ? `${r.classId.name}` : 'General'}
                </p>
              </div>
              <Badge color={r.status === 'present' ? 'green' : r.status === 'late' ? 'yellow' : 'red'}>
                {r.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const user = useAppSelector((s) => s.auth.user)
  const canMark = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'teacher'
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canMark })

  const { can } = usePermission()
  const canOpenSession = can('qr_session:create')
  const canSelfCheck = can('attendance:create') && user?.role !== 'super_admin'
  const isStudent = user?.role === 'student'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle={canMark ? 'Mark and review attendance' : 'Your attendance history'}
      />

      {canSelfCheck && <SelfCheckPanel />}
      {isStudent && <ClassCodePanel />}
      {canOpenSession && <OpenSessionPanel />}
      {can('geofence:create') && <GeofencePanel />}

      {canMark ? (
        <>
          <MarkPanel />
          {(classes?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-400">
              Tip: pick a class from the Classes page context — currently marking general (org-wide) attendance for {classes?.length} classes.
            </p>
          )}
        </>
      ) : (
        <MyAttendancePanel isParent={user?.role === 'parent'} />
      )}
    </div>
  )
}
