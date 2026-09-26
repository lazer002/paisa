import { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Mail,
  MapPin,
  Users,
  Search,
  Building2,
  Globe,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Lock,
} from 'lucide-react'

import {
  useGetOrganizationsQuery,
  useAddOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '@/features/organizations/organizationsApi'
import { useCreateUserMutation } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import type {
  Organization,
  CreateOrgPayload,
  OrgType,
  OrgStatus,
  OrgPlan,
} from '@/features/organizations/types'
import Button from '@/components/ui/button'
import Badge, { BadgeColor } from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

// ─── Constants ────────────────────────────────────────────────────────────────

const ORG_TYPES: OrgType[] = [
  'school', 'college', 'coaching', 'company',
  'institute', 'startup', 'ngo', 'others',
]

const TYPE_COLOR: Record<OrgType, BadgeColor> = {
  school: 'blue', college: 'purple', coaching: 'orange',
  company: 'gray', institute: 'blue', startup: 'green',
  ngo: 'yellow', others: 'gray',
}
const STATUS_COLOR: Record<OrgStatus, BadgeColor> = {
  active: 'green', inactive: 'yellow', suspended: 'red',
}
const PLAN_COLOR: Record<OrgPlan, BadgeColor> = {
  free: 'gray', pro: 'blue', enterprise: 'purple',
}

const EMPTY_FORM: CreateOrgPayload = {
  name: '',
  type: 'company',
  description: '',
  website: '',
  contact: { email: '', phone: '', address: '', city: '', state: '', country: 'India', pincode: '' },
  meta: { industry: '', registrationNo: '', gstNumber: '', board: '', affiliationNo: '', establishedYear: undefined },
  plan: 'free',
  settings: { allowPublicJoin: false, requireApproval: true, maxMembers: 50 },
}

// ─── Form Helpers ─────────────────────────────────────────────────────────────

function Field({ label, locked = false, children }: { label: string; locked?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={`mb-1 flex items-center gap-1 text-sm font-medium ${locked ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
        {locked && <Lock size={11} className="text-amber-500" />}
      </label>
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
      className={`w-full rounded-xl border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-400 italic ${disabled ? 'cursor-not-allowed' : ''}`}
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
      className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 border-b pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </h3>
  )
}

// ─── OrgFormModal ─────────────────────────────────────────────────────────────

function OrgFormModal({
  open, onClose, initialData, onSubmit, loading, error, isSuperAdmin,
}: {
  open: boolean
  onClose: () => void
  initialData: Organization | null
  onSubmit: (data: CreateOrgPayload) => void
  loading: boolean
  error: string
  isSuperAdmin: boolean
}) {
  const [form, setForm] = useState<CreateOrgPayload>(EMPTY_FORM)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setForm({
        name: initialData.name ?? '',
        type: initialData.type,
        description: initialData.description ?? '',
        website: initialData.website ?? '',
        contact: {
          email: initialData.contact?.email ?? '',
          phone: initialData.contact?.phone ?? '',
          address: initialData.contact?.address ?? '',
          city: initialData.contact?.city ?? '',
          state: initialData.contact?.state ?? '',
          country: initialData.contact?.country ?? 'India',
          pincode: initialData.contact?.pincode ?? '',
        },
        meta: {
          industry: initialData.meta?.industry ?? '',
          registrationNo: initialData.meta?.registrationNo ?? '',
          gstNumber: initialData.meta?.gstNumber ?? '',
          board: initialData.meta?.board ?? '',
          affiliationNo: initialData.meta?.affiliationNo ?? '',
          establishedYear: initialData.meta?.establishedYear,
        },
        plan: initialData.plan,
        settings: {
          allowPublicJoin: initialData.settings?.allowPublicJoin ?? false,
          requireApproval: initialData.settings?.requireApproval ?? true,
          maxMembers: initialData.settings?.maxMembers ?? 50,
        },
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [initialData, open])

  const setField = (field: keyof CreateOrgPayload, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }))

  const setContact = (field: string, value: string) =>
    setForm((p) => ({ ...p, contact: { ...p.contact, [field]: value } }))

  const setMeta = (field: string, value: string | number | undefined) =>
    setForm((p) => ({ ...p, meta: { ...p.meta, [field]: value } }))

  const setSettings = (field: string, value: boolean | number) =>
    setForm((p) => ({ ...p, settings: { ...p.settings, [field]: value } }))

  // Admins editing an existing org: name/type/plan are locked (super admin only).
  const lockProtectedFields = !!initialData && !isSuperAdmin

  // Admins only submit the fields they're allowed to change — avoids
  // accidentally sending protected values back to the server
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialData || isSuperAdmin) {
      onSubmit(form)
      return
    }
    onSubmit({
      description: form.description,
      website: form.website,
      contact: form.contact,
      meta: form.meta,
      settings: form.settings,
    } as CreateOrgPayload)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? `Edit — ${initialData.name}` : 'New Organization'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-7">

        {lockProtectedFields && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            🔒 Name, Type and Plan can only be changed by the platform (super admin).
            You can update all other details of your organization.
          </div>
        )}

        {/* Basic Info */}
        <div>
          <SectionTitle>Basic Information</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Field label="Organization Name *" locked={lockProtectedFields}>
                <TextInput value={form.name} onChange={(v) => setField('name', v)} placeholder="Acme Corp" required disabled={lockProtectedFields} />
              </Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Type *" locked={lockProtectedFields}>
                <SelectInput
                  value={form.type}
                  onChange={(v) => setField('type', v as OrgType)}
                  disabled={lockProtectedFields}
                  options={ORG_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Brief description of the organization..."
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black"
                />
              </Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Website">
                <TextInput value={form.website ?? ''} onChange={(v) => setField('website', v)} placeholder="https://example.com" />
              </Field>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <SectionTitle>Contact Information</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email">
              <TextInput value={form.contact?.email ?? ''} onChange={(v) => setContact('email', v)} placeholder="contact@org.com" type="email" />
            </Field>
            <Field label="Phone">
              <TextInput value={form.contact?.phone ?? ''} onChange={(v) => setContact('phone', v)} placeholder="9876543210" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <TextInput value={form.contact?.address ?? ''} onChange={(v) => setContact('address', v)} placeholder="Street address" />
              </Field>
            </div>
            <Field label="City">
              <TextInput value={form.contact?.city ?? ''} onChange={(v) => setContact('city', v)} placeholder="Mumbai" />
            </Field>
            <Field label="State">
              <TextInput value={form.contact?.state ?? ''} onChange={(v) => setContact('state', v)} placeholder="Maharashtra" />
            </Field>
            <Field label="Country">
              <TextInput value={form.contact?.country ?? 'India'} onChange={(v) => setContact('country', v)} placeholder="India" />
            </Field>
            <Field label="Pincode">
              <TextInput value={form.contact?.pincode ?? ''} onChange={(v) => setContact('pincode', v)} placeholder="400001" />
            </Field>
          </div>
        </div>

        {/* Meta */}
        <div>
          <SectionTitle>Organization Details</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <TextInput value={form.meta?.industry ?? ''} onChange={(v) => setMeta('industry', v)} placeholder="Technology" />
            </Field>
            <Field label="GST Number">
              <TextInput value={form.meta?.gstNumber ?? ''} onChange={(v) => setMeta('gstNumber', v)} placeholder="22AAAAA0000A1Z5" />
            </Field>
            <Field label="Registration No.">
              <TextInput value={form.meta?.registrationNo ?? ''} onChange={(v) => setMeta('registrationNo', v)} placeholder="REG-12345" />
            </Field>
            <Field label="Established Year">
              <TextInput
                value={form.meta?.establishedYear != null ? String(form.meta.establishedYear) : ''}
                onChange={(v) => setMeta('establishedYear', v ? parseInt(v) : undefined)}
                placeholder="2010"
                type="number"
              />
            </Field>
            <Field label="Board (Education)">
              <TextInput value={form.meta?.board ?? ''} onChange={(v) => setMeta('board', v)} placeholder="CBSE / ICSE" />
            </Field>
            <Field label="Affiliation No.">
              <TextInput value={form.meta?.affiliationNo ?? ''} onChange={(v) => setMeta('affiliationNo', v)} placeholder="AFF-00123" />
            </Field>
          </div>
        </div>

        {/* Plan & Settings */}
        <div>
          <SectionTitle>Plan & Settings</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Plan" locked={lockProtectedFields}>
              <SelectInput
                value={form.plan ?? 'free'}
                onChange={(v) => setField('plan', v as OrgPlan)}
                disabled={lockProtectedFields}
                options={[
                  { value: 'free', label: 'Free' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
              />
            </Field>
            <Field label="Max Members">
              <TextInput
                value={String(form.settings?.maxMembers ?? 50)}
                onChange={(v) => setSettings('maxMembers', parseInt(v) || 50)}
                type="number"
                placeholder="50"
              />
            </Field>
            <div className="sm:col-span-2 space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.settings?.allowPublicJoin ?? false}
                  onChange={(e) => setSettings('allowPublicJoin', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-gray-700">Allow public join (anyone can request to join)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.settings?.requireApproval ?? true}
                  onChange={(e) => setSettings('requireApproval', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-gray-700">Require admin approval for new members</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Save Changes' : 'Create Organization'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── OrgCard ──────────────────────────────────────────────────────────────────

function OrgCard({
  org, onEdit, onDelete, onAddAdmin, isSuperAdmin,
}: {
  org: Organization
  onEdit: () => void
  onDelete: () => void
  onAddAdmin: () => void
  isSuperAdmin: boolean
}) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white">
            {org.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-gray-900">{org.name}</h3>
            <p className="text-xs text-gray-400">{org.orgCode}</p>
          </div>
        </div>
        <div className="ml-2 flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isSuperAdmin && (
            <button onClick={onAddAdmin} className="rounded-lg p-1.5 text-blue-500 transition hover:bg-blue-50" title="Add Admin">
              <UserPlus size={14} />
            </button>
          )}
          <button onClick={onEdit} className="rounded-lg p-1.5 transition hover:bg-gray-100" title="Edit">
            <Edit2 size={14} />
          </button>
          {isSuperAdmin && (
            <button onClick={onDelete} className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50" title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge color={TYPE_COLOR[org.type]}>{org.type}</Badge>
        <Badge color={STATUS_COLOR[org.status]}>{org.status}</Badge>
        <Badge color={PLAN_COLOR[org.plan]}>{org.plan}</Badge>
      </div>

      <div className="space-y-1.5 text-sm text-gray-500">
        {org.contact?.email && (
          <div className="flex items-center gap-2">
            <Mail size={12} className="flex-shrink-0" />
            <span className="truncate">{org.contact.email}</span>
          </div>
        )}
        {(org.contact?.city || org.contact?.state) && (
          <div className="flex items-center gap-2">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">
              {[org.contact.city, org.contact.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {org.website && (
          <div className="flex items-center gap-2">
            <Globe size={12} className="flex-shrink-0" />
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-black hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {org.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Users size={12} className="flex-shrink-0" />
          <span>
            {org.membersCount ?? 1} member{(org.membersCount ?? 1) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({
  org, onClose, onConfirm, loading,
}: {
  org: Organization | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <Modal open={!!org} onClose={onClose} title="Delete Organization" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            Are you sure you want to delete <strong>{org?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── AddAdminModal ──────────────────────────────────────────────────────

function AddAdminModal({
  org, onClose, onSubmit, loading, error,
}: {
  org: Organization | null
  onClose: () => void
  onSubmit: (d: { name: string; email: string; password: string }) => void
  loading: boolean
  error: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (org) { setName(''); setEmail(''); setPassword('') }
  }, [org])

  return (
    <Modal
      open={!!org}
      onClose={onClose}
      title={`Add Admin — ${org?.name ?? ''}`}
      size="md"
    >
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, password }) }}
        className="space-y-4"
      >
        <Field label="Admin Name *">
          <TextInput value={name} onChange={setName} placeholder="e.g. Priya Sharma" required />
        </Field>
        <Field label="Login Email *">
          <TextInput value={email} onChange={setEmail} type="email" placeholder="admin@org.com" required />
        </Field>
        <Field label="Password *">
          <TextInput value={password} onChange={setPassword} type="text" placeholder="Min 6 characters" required />
        </Field>

        <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          This person will be able to log in with this email + password and manage
          <strong> {org?.name}</strong> (role: <strong>admin</strong>, below super admin).
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Admin</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LIMIT = 12

export default function OrganizationsPage() {
  const currentUser = useAppSelector((s) => s.auth.user)
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [showCreate, setShowCreate] = useState(false)
  const [editOrg, setEditOrg] = useState<Organization | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null)
  const [adminOrg, setAdminOrg] = useState<Organization | null>(null)
  const [mutError, setMutError] = useState('')
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError, refetch } = useGetOrganizationsQuery({
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit: LIMIT,
  })

  const orgs: Organization[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const [createOrg, { isLoading: createPending }] = useAddOrganizationMutation()
  const [updateOrg, { isLoading: updatePending }] = useUpdateOrganizationMutation()
  const [deleteOrgMut, { isLoading: deletePending }] = useDeleteOrganizationMutation()
  const [createUser, { isLoading: createUserPending }] = useCreateUserMutation()

  const handleAddAdmin = async (d: { name: string; email: string; password: string }) => {
    if (!adminOrg) return
    setAdminError('')
    try {
      await createUser({ ...d, role: 'admin', instituteId: adminOrg._id }).unwrap()
      setAdminOrg(null) // closes modal
    } catch (e: any) {
      setAdminError(e?.data?.message ?? 'Failed to create admin user')
    }
  }

  const handleCreate = async (d: CreateOrgPayload) => {
    setMutError('')
    try {
      await createOrg(d).unwrap()
      setShowCreate(false)
      setMutError('')
    } catch (e: any) {
      setMutError(e?.data?.message ?? 'Failed to create organization')
    }
  }

  const handleUpdate = async (id: string, d: CreateOrgPayload) => {
    setMutError('')
    try {
      await updateOrg({ id, payload: d }).unwrap()
      setEditOrg(null)
      setMutError('')
    } catch (e: any) {
      setMutError(e?.data?.message ?? 'Failed to update organization')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteOrgMut(id).unwrap()
      setDeleteOrg(null)
    } catch {
      /* list refreshes; silent for delete */
    }
  }

  const hasFilters = !!(debouncedSearch || typeFilter || statusFilter)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500">
            {total > 0
              ? `${total} organization${total !== 1 ? 's' : ''}`
              : 'Manage all organizations on the platform'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setShowCreate(true); setMutError('') }}>
            <Plus size={16} />
            New Organization
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black"
        >
          <option value="">All Types</option>
          {ORG_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-black"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setPage(1) }}
            className="text-sm text-gray-400 transition hover:text-black"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
          <AlertTriangle size={40} className="mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Failed to load organizations</p>
          <p className="mt-1 text-sm text-gray-400">Check that the backend is running at localhost:5000</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
            <RefreshCw size={15} /> Retry
          </Button>
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
          <Building2 size={48} className="mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-500">
            {hasFilters ? 'No results match your filters' : 'No organizations yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {hasFilters ? 'Try adjusting or clearing your filters' : 'Create your first organization to get started'}
          </p>
          {!hasFilters && isSuperAdmin && (
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New Organization
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orgs.map((org) => (
              <OrgCard
                key={org._id}
                org={org}
                isSuperAdmin={isSuperAdmin}
                onEdit={() => { setEditOrg(org); setMutError('') }}
                onDelete={() => setDeleteOrg(org)}
                onAddAdmin={() => { setAdminOrg(org); setAdminError('') }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <OrgFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        initialData={null}
        onSubmit={handleCreate}
        loading={createPending}
        error={mutError}
        isSuperAdmin={isSuperAdmin}
      />

      <OrgFormModal
        open={!!editOrg}
        onClose={() => setEditOrg(null)}
        initialData={editOrg}
        onSubmit={(d) => {
          if (!editOrg) return
          handleUpdate(editOrg._id, d)
        }}
        loading={updatePending}
        error={mutError}
        isSuperAdmin={isSuperAdmin}
      />

      <DeleteConfirmModal
        org={deleteOrg}
        onClose={() => setDeleteOrg(null)}
        onConfirm={() => { if (deleteOrg) handleDelete(deleteOrg._id) }}
        loading={deletePending}
      />

      <AddAdminModal
        org={adminOrg}
        onClose={() => setAdminOrg(null)}
        onSubmit={handleAddAdmin}
        loading={createUserPending}
        error={adminError}
      />
    </div>
  )
}
