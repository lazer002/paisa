import { useState, useEffect } from 'react'
import {
  Users as UsersIcon,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserX,
  Pencil,
  Lock,
} from 'lucide-react'

import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  type OrgUser,
} from '@/features/users/usersApi'
import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import { useAppSelector } from '@/app/store'
import type { Organization } from '@/features/organizations/types'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

// ─── Role ↔ Org-type compatibility (mirrors server/src/models/User.js) ───────

const ROLES_BY_ORG_TYPE: Record<string, string[]> = {
  school: ['admin', 'teacher', 'student'],
  college: ['admin', 'teacher', 'student'],
  coaching: ['admin', 'teacher', 'student'],
  company: ['admin', 'hr', 'employee'],
  institute: ['admin', 'teacher', 'student', 'hr', 'employee'],
  startup: ['admin', 'hr', 'employee'],
  ngo: ['admin', 'hr', 'employee'],
  others: ['admin', 'teacher', 'student', 'hr', 'employee'],
}

const ROLE_COLOR: Record<string, 'blue' | 'purple' | 'green' | 'orange' | 'yellow' | 'gray'> = {
  super_admin: 'purple',
  admin: 'blue',
  teacher: 'green',
  student: 'yellow',
  hr: 'orange',
  employee: 'gray',
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder = '', type = 'text', required = false, disabled = false,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
    />
  )
}

function SelectInput({
  value, onChange, options, disabled = false,
}: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── CreateUserModal ──────────────────────────────────────────────────────────

function CreateUserModal({
  open, onClose, onSubmit, loading, error, isSuperAdmin, orgs,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (d: { name: string; email: string; password: string; role: string; instituteId?: string }) => void
  loading: boolean
  error: string
  isSuperAdmin: boolean
  orgs: Organization[]
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [instituteId, setInstituteId] = useState('')

  useEffect(() => {
    if (open) { setName(''); setEmail(''); setPassword(''); setRole('admin'); setInstituteId('') }
  }, [open])

  const selectedOrg = orgs.find((o) => o._id === instituteId)

  // Roles valid for the selected org's type; all roles when no org is picked
  const allowedRoles = selectedOrg
    ? ROLES_BY_ORG_TYPE[selectedOrg.type] ?? ['admin']
    : isSuperAdmin
      ? ['super_admin', 'admin', 'teacher', 'student', 'hr', 'employee']
      : ['teacher', 'student', 'hr', 'employee']

  const roleOptions = allowedRoles.map((r) => ({
    value: r,
    label: r.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
  }))

  return (
    <Modal open={open} onClose={onClose} title="New User" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ name, email, password, role, instituteId: instituteId || undefined })
        }}
        className="space-y-4"
      >
        <Field label="Full Name *">
          <TextInput value={name} onChange={setName} placeholder="e.g. Rahul Verma" required />
        </Field>

        <Field label="Login Email *">
          <TextInput value={email} onChange={setEmail} type="email" placeholder="user@example.com" required />
        </Field>

        <Field label="Password *">
          <TextInput value={password} onChange={setPassword} type="text" placeholder="Min 6 characters — share this with the user" required />
        </Field>

        {isSuperAdmin && (
          <Field label="Organization">
            <SelectInput
              value={instituteId}
              onChange={setInstituteId}
              options={[
                { value: '', label: '— No organization (platform user) —' },
                ...orgs.map((o) => ({ value: o._id, label: `${o.name} (${o.type})` })),
              ]}
            />
          </Field>
        )}

        <Field label="Role *">
          <SelectInput
            value={allowedRoles.includes(role) ? role : allowedRoles[0]}
            onChange={setRole}
            options={roleOptions}
          />
        </Field>

        {selectedOrg && (
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
            Roles available for a <strong>{selectedOrg.type}</strong> organization are filtered
            automatically. This user will log in with email + password and manage{' '}
            <strong>{selectedOrg.name}</strong>.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create User</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── EditUserModal ───────────────────────────────────────────────────────

function EditUserModal({
  user, onClose, onSubmit, loading, error, canEditEmail,
}: {
  user: OrgUser | null
  onClose: () => void
  onSubmit: (d: { name?: string; email?: string; password?: string }) => void
  loading: boolean
  error: string
  canEditEmail: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setEmail(user.email ?? '')
      setPassword('')
    }
  }, [user])

  if (!user) return null

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit — ${user.name}`} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({
            name,
            email: canEditEmail ? email : undefined,
            password: password || undefined,
          })
        }}
        className="space-y-4"
      >
        <Field label="Full Name">
          <TextInput value={name} onChange={setName} />
        </Field>

        <Field label="Login Email">
          <TextInput
            value={email}
            onChange={setEmail}
            type="email"
            disabled={!canEditEmail}
          />
          {!canEditEmail && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <Lock size={12} /> Your email can only be changed by a super admin
            </p>
          )}
        </Field>

        <Field label="Reset Password">
          <TextInput
            value={password}
            onChange={setPassword}
            type="text"
            placeholder="Leave empty to keep current password"
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── DeactivateConfirmModal ───────────────────────────────────────────────────

function DeactivateConfirmModal({
  user, onClose, onConfirm, loading,
}: {
  user: OrgUser | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <Modal open={!!user} onClose={onClose} title="Deactivate User" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            Deactivate <strong>{user?.name}</strong>? They will no longer be able to log in.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Deactivate</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── UserRow ──────────────────────────────────────────────────────────────────

function UserRow({
  user, canDeactivate, canEdit, onDeactivate, onEdit,
}: {
  user: OrgUser
  canDeactivate: boolean
  canEdit: boolean
  onDeactivate: () => void
  onEdit: (() => void) | null
}) {
  const orgName =
    typeof user.instituteId === 'object' && user.instituteId
      ? user.instituteId.name
      : 'Platform'

  return (
    <tr
      onClick={() => window.location.assign(`/dashboard/users/${user._id}`)}
      className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{user.userCode ?? '—'}</td>
      <td className="px-4 py-3">
        <Badge color={ROLE_COLOR[user.role] ?? 'gray'}>{user.role}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{orgName}</td>
      <td className="px-4 py-3">
        <Badge color={user.status === 'active' ? 'green' : 'red'}>{user.status ?? 'active'}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        {canEdit && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="mr-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-black"
            title="Edit user"
          >
            <Pencil size={15} />
          </button>
        )}
        {canDeactivate && user.status === 'active' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeactivate() }}
            className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50"
            title="Deactivate"
          >
            <UserX size={15} />
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const currentUser = useAppSelector((s) => s.auth.user)
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [deactivateUser, setDeactivateUser] = useState<OrgUser | null>(null)
  const [editUser, setEditUser] = useState<OrgUser | null>(null)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data: users, isLoading, isError, refetch } = useGetUsersQuery({
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  })

  // Org list for the dropdown (super admin only)
  const { data: orgData } = useGetOrganizationsQuery({ limit: 100 }, { skip: !isSuperAdmin })
  const orgs: Organization[] = orgData?.data ?? []

  const [createUser, { isLoading: createPending }] = useCreateUserMutation()
  const [updateUser, { isLoading: updatePending }] = useUpdateUserMutation()

  // 🔒 Who can I edit, and can I change their email?
  // super_admin → anyone (email included)
  // admin       → roles below admin (teacher/student/hr/employee) + OWN row
  //               (own row: name/password only — email locked)
  //               other admins / super_admins → off-limits entirely
  const isSelf = (u: OrgUser) => currentUser?._id === u._id

  const canEditUser = (u: OrgUser): boolean => {
    if (!currentUser) return false
    if (isSuperAdmin) return true
    if (isSelf(u)) return true // own name/password
    if (currentUser.role !== 'admin') return false
    return u.role !== 'admin' && u.role !== 'super_admin'
  }

  const canEditEmailOf = (u: OrgUser): boolean => {
    if (isSuperAdmin) return true
    if (isSelf(u)) return false // 🔒 own email: super admin only
    return currentUser?.role === 'admin' && (u.role === 'teacher' || u.role === 'student' || u.role === 'hr' || u.role === 'employee')
  }

  const handleEdit = async (d: { name?: string; email?: string; password?: string }) => {
    if (!editUser) return
    setEditError('')
    try {
      await updateUser({ id: editUser._id, payload: d }).unwrap()
      setEditUser(null)
    } catch (e: any) {
      setEditError(e?.data?.message ?? 'Failed to update user')
    }
  }

  const handleCreate = async (d: { name: string; email: string; password: string; role: string; instituteId?: string }) => {
    setCreateError('')
    try {
      await createUser(d).unwrap()
      setShowCreate(false)
    } catch (e: any) {
      setCreateError(e?.data?.message ?? 'Failed to create user')
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateUser) return
    try {
      await updateUser({ id: deactivateUser._id, payload: { status: 'inactive' } }).unwrap()
      setDeactivateUser(null)
    } catch {
      /* list refreshes via tag invalidation */
    }
  }

  const hasFilters = !!(debouncedSearch || roleFilter || statusFilter)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">
            {users && users.length > 0
              ? `${users.length} user${users.length !== 1 ? 's' : ''}`
              : 'Create org admins, teachers, HR and staff accounts'}
          </p>
        </div>
        <Button onClick={() => { setShowCreate(true); setCreateError('') }}>
          <Plus size={16} />
          New User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or code..."
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="hr">HR</option>
          <option value="employee">Employee</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter('') }}
            className="text-sm text-gray-400 transition hover:text-black"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
          <AlertTriangle size={40} className="mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Failed to load users</p>
          <p className="mt-1 text-sm text-gray-400">Check that the backend is running</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
            <RefreshCw size={15} /> Retry
          </Button>
        </div>
      ) : !users?.length ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
          <UsersIcon size={48} className="mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-500">
            {hasFilters ? 'No users match your filters' : 'No users yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {hasFilters ? 'Try adjusting or clearing your filters' : 'Create the first user account'}
          </p>
          {!hasFilters && (
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New User
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u._id}
                  user={u}
                  canEdit={canEditUser(u)}
                  canDeactivate={canEditUser(u) && u.status === 'active'}
                  onDeactivate={() => setDeactivateUser(u)}
                  onEdit={() => { setEditUser(u); setEditError('') }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Super admin hint */}
      {isSuperAdmin && users && users.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-600">
          <ShieldCheck size={14} />
          Tip: create an admin for a specific organization from this page (pick the org in the form)
          or via the 👤+ icon on an organization card.
        </div>
      )}

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        loading={createPending}
        error={createError}
        isSuperAdmin={isSuperAdmin}
        orgs={orgs}
      />

      <DeactivateConfirmModal
        user={deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onConfirm={handleDeactivate}
        loading={updatePending}
      />

      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSubmit={handleEdit}
        loading={updatePending}
        error={editError}
        canEditEmail={editUser ? canEditEmailOf(editUser) : false}
      />
    </div>
  )
}
