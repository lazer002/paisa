import { useState } from 'react'
import { CalendarCheck, Check } from 'lucide-react'

import {
  useGetAttendanceQuery,
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
import ExportMenu from '@/components/ui/ExportMenu'
import { fmtDate, humanize, type ExportColumn } from '@/lib/export'

const recordPerson = (r: AttendanceRecord) => (typeof r.userId === 'object' ? r.userId.name : '')
const recordClass = (r: AttendanceRecord) =>
  typeof r.classId === 'object' && r.classId ? r.classId.name : 'General'

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: 'bg-green-500 text-white',
  absent: 'bg-red-500 text-white',
  late: 'bg-yellow-500 text-white',
}

type ClassOption = { _id: string; publicId?: string; name: string; studentIds?: (string | { _id: string })[] }

const idOf = (v: string | { _id: string }) => (typeof v === 'string' ? v : v._id)

function MarkPanel({ classes }: { classes: ClassOption[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  // '' = staff / general register; otherwise a class publicId.
  const [classRef, setClassRef] = useState('')
  const { data: users } = useGetUsersQuery()
  const [markAttendance, { isLoading }] = useMarkAttendanceMutation()
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})
  const [saved, setSaved] = useState(false)

  const cls = classes.find((c) => rid(c) === classRef)
  const memberIds = new Set((cls?.studentIds ?? []).map(idOf))
  const people = (users ?? []).filter(
    // Class register: its members. Staff register: everyone but students and parents.
    (u) => u.status !== 'inactive' && (cls ? memberIds.has(u._id) : u.role !== 'student' && u.role !== 'parent'),
  )

  // Prefill with what is already saved for this register and date.
  const { data: existing } = useGetAttendanceQuery({ date, classId: classRef || undefined })
  const [loadedKey, setLoadedKey] = useState('')
  const key = `${date}|${classRef}`
  if (existing && loadedKey !== key) {
    const next: Record<string, AttendanceStatus> = {}
    for (const r of existing) {
      const recordClassId = typeof r.classId === 'object' && r.classId ? r.classId._id : r.classId ?? null
      if ((cls ? recordClassId === cls._id : !recordClassId) && typeof r.userId === 'object') {
        const person = (users ?? []).find((u) => u._id === (r.userId as { _id: string })._id)
        if (person) next[rid(person)] = r.status
      }
    }
    setRecords(next)
    setLoadedKey(key)
  }

  type SheetRow = (typeof people)[number]
  const sheetColumns: ExportColumn<SheetRow>[] = [
    { header: 'Name', value: (p) => p.name },
    { header: 'Code / email', value: (p) => p.userCode ?? p.email },
    { header: 'Role', value: (p) => humanize(p.role) },
    { header: 'Date', value: () => fmtDate(date) },
    { header: 'Status', value: (p) => humanize(records[rid(p)] ?? 'not marked') },
  ]

  const setAll = (s: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    people.forEach((p) => { next[rid(p)] = s })
    setRecords(next)
  }

  const handleSave = async () => {
    const payload = Object.entries(records).map(([userId, status]) => ({ userId, status }))
    if (!payload.length) return
    await markAttendance({ date, classId: classRef || null, records: payload }).unwrap()
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
          <label className="ml-2 text-sm font-medium text-gray-700">Register:</label>
          <select
            value={classRef}
            onChange={(e) => setClassRef(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          >
            <option value="">Staff (general)</option>
            {classes.map((c) => (
              <option key={rid(c)} value={rid(c)}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            title={`Attendance sheet ${date}`}
            subtitle={`Date: ${fmtDate(date)}`}
            note="Shows the marks currently selected on screen, saved or not."
            columns={sheetColumns}
            rows={people}
          />
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
            {cls ? 'No students enrolled in this class yet.' : 'No staff accounts in your organization yet.'}
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

  const historyColumns: ExportColumn<AttendanceRecord>[] = [
    { header: 'Date', value: (r) => fmtDate(r.date) },
    ...(isParent ? [{ header: 'Child', value: (r: AttendanceRecord) => recordPerson(r) }] : []),
    { header: 'Class', value: (r) => recordClass(r) },
    { header: 'Status', value: (r) => humanize(r.status) },
    { header: 'Notes', value: (r) => r.notes ?? '' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportMenu
          title="Attendance history"
          subtitle={child ? `Child: ${child}` : undefined}
          columns={historyColumns}
          rows={records}
        />
      </div>
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

// Org-wide records for one day: for roles that may list attendance
// (GET /attendance needs attendance:update) but don't mark registers.
function RecordsPanel() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const { data, isLoading, isError, refetch } = useGetAttendanceQuery({ date })
  const records = data ?? []

  const columns: ExportColumn<AttendanceRecord>[] = [
    { header: 'Name', value: (r) => recordPerson(r) },
    { header: 'Register', value: (r) => recordClass(r) },
    { header: 'Date', value: (r) => fmtDate(r.date) },
    { header: 'Status', value: (r) => humanize(r.status) },
  ]

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Organization attendance</h3>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <ExportMenu title={`Attendance ${date}`} subtitle={`Date: ${fmtDate(date)}`} columns={columns} rows={records} />
      </div>
      {isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : records.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No attendance recorded for this day</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          {records.map((r) => (
            <div key={r.publicId ?? r._id} className="flex items-center justify-between border-b border-gray-50 px-4 py-2.5 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{recordPerson(r) || '—'}</p>
                <p className="text-xs text-gray-400">{recordClass(r)}</p>
              </div>
              <Badge color={r.status === 'present' ? 'green' : r.status === 'late' ? 'yellow' : 'red'}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AttendancePage() {
  const user = useAppSelector((s) => s.auth.user)
  const { can } = usePermission()
  // Same permissions as POST /attendance (mark) and GET /attendance (list).
  const canMark = can('attendance:mark')
  const canViewRecords = !canMark && can('attendance:update')
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canMark })
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
        <MarkPanel classes={(classes ?? []) as ClassOption[]} />
      ) : (
        <>
          {canViewRecords && <RecordsPanel />}
          <MyAttendancePanel isParent={user?.role === 'parent'} />
        </>
      )}
    </div>
  )
}
