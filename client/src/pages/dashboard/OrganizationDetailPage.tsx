import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Globe, Mail, MapPin, Phone, Users, Layers,
  Network, ShieldCheck, Calendar, ArrowUp,
} from 'lucide-react'
import {
  useGetOrganizationsQuery,
} from '@/features/organizations/organizationsApi'
import { useGetUsersQuery } from '@/features/users/usersApi'
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'
import StatCard from '@/components/ui/StatCard'

const PLAN_COLOR = { free: 'gray', pro: 'blue', enterprise: 'purple' } as const
const STATUS_COLOR = { active: 'green', inactive: 'yellow', suspended: 'red' } as const

/**
 * Modern org chart — clean connector lines, avatar cards, expand/collapse.
 * Hierarchy: Admin → (HR | Teachers) → (Employees | Students)
 */
const ROLE_THEME: Record<string, { chip: string; ring: string; dot: string; label: string }> = {
  admin: { chip: 'bg-blue-600', ring: 'ring-blue-200', dot: 'bg-blue-500', label: 'Leadership' },
  hr: { chip: 'bg-amber-500', ring: 'ring-amber-200', dot: 'bg-amber-500', label: 'Human Resources' },
  teacher: { chip: 'bg-teal-600', ring: 'ring-teal-200', dot: 'bg-teal-500', label: 'Faculty' },
  employee: { chip: 'bg-cyan-600', ring: 'ring-cyan-200', dot: 'bg-cyan-500', label: 'Employees' },
  student: { chip: 'bg-indigo-600', ring: 'ring-indigo-200', dot: 'bg-indigo-500', label: 'Students' },
}

function PersonCard({ p, accent }: { p: any; accent: string }) {
  return (
    <Link
      to={`/dashboard/users/${p._id}`}
      className="group flex w-44 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
    >
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xs font-bold text-white`}>
        {p.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-gray-800 group-hover:text-black">{p.name}</p>
        <p className="truncate text-[10px] text-gray-400">{p.userCode ?? p.email}</p>
      </div>
    </Link>
  )
}

function RoleGroup({
  role, people, max = 4,
}: {
  role: string
  people: any[]
  max?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const theme = ROLE_THEME[role]
  if (!people.length) return null

  const shown = expanded ? people : people.slice(0, max)
  const hidden = people.length - max

  return (
    <div className="flex flex-col items-center">
      {/* Level chip */}
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${theme.chip}`}>
        <span className={`h-1.5 w-1.5 rounded-full bg-white/70`} />
        {theme.label} · {people.length}
      </div>

      {/* Connector stem */}
      <div className="h-4 w-px bg-gradient-to-b from-gray-200 to-gray-100" />

      {/* People cards */}
      <div className="flex max-w-full flex-wrap justify-center gap-2">
        {shown.map((p) => (
          <PersonCard key={p._id} p={p} accent={
            role === 'admin' ? 'from-blue-500 to-blue-700'
            : role === 'hr' ? 'from-amber-400 to-amber-600'
            : role === 'teacher' ? 'from-teal-500 to-teal-700'
            : role === 'employee' ? 'from-cyan-500 to-cyan-700'
            : 'from-indigo-500 to-indigo-700'
          } />
        ))}
      </div>

      {/* Expand / collapse */}
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-500 ring-1 ring-gray-100 transition hover:bg-gray-100 hover:text-gray-700"
        >
          +{hidden} more
        </button>
      )}
      {expanded && people.length > max && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-2 rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-500 ring-1 ring-gray-100 transition hover:bg-gray-100 hover:text-gray-700"
        >
          Show less
        </button>
      )}
    </div>
  )
}

function OrgChart({ members }: { members: any[] }) {
  const byRole = (r: string) => members.filter((m) => m.role === r)
  const admins = byRole('admin')
  const midLayer = [
    { role: 'hr', people: byRole('hr') },
    { role: 'teacher', people: byRole('teacher') },
  ].filter((g) => g.people.length > 0)
  const baseLayer = [
    { role: 'employee', people: byRole('employee') },
    { role: 'student', people: byRole('student') },
  ].filter((g) => g.people.length > 0)

  if (!members.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center">
        <Network size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm text-gray-400">No members yet — the chart will build itself as people join</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-gradient-to-b from-gray-50 via-white to-gray-50 p-8 shadow-sm">
      <div className="mx-auto flex min-w-fit flex-col items-center">
        {/* ROOT — the organization */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-900 px-5 py-2.5 shadow-lg">
            <Building2 size={15} className="text-white/80" />
            <span className="text-sm font-bold text-white">Organization</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90">
              {members.length} people
            </span>
          </div>
        </div>

        {/* Trunk down to leadership */}
        <div className="h-6 w-px bg-gradient-to-b from-gray-300 to-gray-200" />

        {/* LEVEL 1 — Admins */}
        <RoleGroup role="admin" people={admins} max={4} />

        {/* Branch to mid layer */}
        {midLayer.length > 0 && (
          <>
            <div className="h-5 w-px bg-gray-200" />
            <div className="relative flex items-start justify-center gap-16">
              {/* horizontal rail */}
              {midLayer.length > 1 && (
                <div className="absolute top-0 h-px bg-gray-200" style={{ width: `${(midLayer.length - 1) * 8}rem`, left: '50%', transform: 'translateX(-50%)' }} />
              )}
              {midLayer.map((g, i) => (
                <div key={g.role} className="relative flex flex-col items-center">
                  {/* drop line from rail */}
                  {midLayer.length > 1 && <div className="h-4 w-px bg-gray-200" />}
                  <RoleGroup role={g.role} people={g.people} max={4} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Branch to base layer */}
        {baseLayer.length > 0 && (
          <>
            <div className="h-5 w-px bg-gray-200" />
            <div className="relative flex items-start justify-center gap-16">
              {baseLayer.length > 1 && (
                <div className="absolute top-0 h-px bg-gray-200" style={{ width: `${(baseLayer.length - 1) * 8}rem`, left: '50%', transform: 'translateX(-50%)' }} />
              )}
              {baseLayer.map((g) => (
                <div key={g.role} className="relative flex flex-col items-center">
                  {baseLayer.length > 1 && <div className="h-4 w-px bg-gray-200" />}
                  <RoleGroup role={g.role} people={g.people} max={6} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function OrganizationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const isSuperAdmin = user?.role === 'super_admin'

  const { data, isLoading, isError, refetch } = useGetOrganizationsQuery({ limit: 100 })
  const { data: members } = useGetUsersQuery()
  const { data: departments } = useGetDepartmentsQuery()

  const org = (data?.data ?? []).find((o) => o._id === id)
  const orgMembers = (members ?? []).filter((m) =>
    typeof m.instituteId === 'object'
      ? m.instituteId?._id === id
      : m.instituteId === id,
  )
  const orgDepartments = (departments ?? []).filter((d: any) =>
    typeof d.instituteId === 'object' ? d.instituteId?._id === id : d.instituteId === id,
  )

  const [tab, setTab] = useState<'overview' | 'members' | 'departments' | 'chart'>('overview')

  if (isLoading) return <LoadingList rows={6} />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!org) {
    return (
      <div className="rounded-2xl bg-white p-16 text-center shadow-sm">
        <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="font-medium text-gray-500">Organization not found</p>
        <button onClick={() => navigate('/dashboard/organizations')} className="mt-3 text-sm text-black underline">
          Back to organizations
        </button>
      </div>
    )
  }

  const contact = org.contact ?? {}

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard/organizations')}
        className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-black"
      >
        <ArrowLeft size={14} /> Back to Organizations
      </button>

      {/* Header card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-black text-2xl font-bold text-white">
              {org.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <p className="text-sm text-gray-400">{org.orgCode} · created {new Date(org.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge color="blue">{org.type}</Badge>
                <Badge color={STATUS_COLOR[org.status]}>{org.status}</Badge>
                <Badge color={PLAN_COLOR[org.plan]}>{org.plan} plan</Badge>
              </div>
            </div>
          </div>
          {isSuperAdmin && (
            <Link
              to="/dashboard/organizations"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Manage
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={orgMembers.length} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Departments" value={orgDepartments.length} icon={Layers} color="bg-purple-50 text-purple-600" />
        <StatCard label="Students" value={orgMembers.filter((m) => m.role === 'student').length} icon={Users} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Staff" value={orgMembers.filter((m) => m.role !== 'student').length} icon={ShieldCheck} color="bg-teal-50 text-teal-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm">
        {(['overview', 'members', 'departments', 'chart'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t === 'chart' ? 'Org Chart' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">About</h3>
            <p className="text-sm text-gray-600">{org.description || 'No description provided.'}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              {org.website && (
                <p className="flex items-center gap-2"><Globe size={14} /> {org.website}</p>
              )}
              {contact.email && <p className="flex items-center gap-2"><Mail size={14} /> {contact.email}</p>}
              {contact.phone && <p className="flex items-center gap-2"><Phone size={14} /> {contact.phone}</p>}
              {(contact.city || contact.state || contact.address) && (
                <p className="flex items-center gap-2">
                  <MapPin size={14} /> {[contact.address, contact.city, contact.state, contact.country].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="flex items-center gap-2"><Calendar size={14} /> Established {org.meta?.establishedYear ?? '—'}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Organization Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-400">Industry</p><p className="font-medium text-gray-700">{org.meta?.industry || '—'}</p></div>
              <div><p className="text-xs text-gray-400">Registration No.</p><p className="font-medium text-gray-700">{org.meta?.registrationNo || '—'}</p></div>
              <div><p className="text-xs text-gray-400">GST Number</p><p className="font-medium text-gray-700">{org.meta?.gstNumber || '—'}</p></div>
              <div><p className="text-xs text-gray-400">Board</p><p className="font-medium text-gray-700">{org.meta?.board || '—'}</p></div>
              <div><p className="text-xs text-gray-400">Max Members</p><p className="font-medium text-gray-700">{org.settings?.maxMembers ?? 50}</p></div>
              <div><p className="text-xs text-gray-400">Public Join</p><p className="font-medium text-gray-700">{org.settings?.allowPublicJoin ? 'Allowed' : 'Invite only'}</p></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orgMembers.map((m) => (
                <tr key={m._id} className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50" onClick={() => navigate(`/dashboard/users/${m._id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m.userCode ?? '—'}</td>
                  <td className="px-4 py-3"><Badge color="blue">{m.role}</Badge></td>
                  <td className="px-4 py-3"><Badge color={m.status === 'inactive' ? 'red' : 'green'}>{m.status ?? 'active'}</Badge></td>
                </tr>
              ))}
              {orgMembers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">No members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'departments' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgDepartments.map((d: any) => (
            <div key={d._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{d.name}</h3>
                <Badge color={d.status === 'active' ? 'green' : 'gray'}>{d.status}</Badge>
              </div>
              {d.code && <p className="mt-1 text-xs text-gray-400">Code: {d.code}</p>}
              <p className="mt-2 text-sm text-gray-500">{d.description || 'No description'}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                <ArrowUp size={12} /> Head: {typeof d.head === 'object' ? d.head?.name ?? '—' : '—'}
              </p>
            </div>
          ))}
          {orgDepartments.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white p-10 text-center shadow-sm">
              <Layers size={36} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No departments created yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'chart' && <OrgChart members={orgMembers} />}
    </div>
  )
}
