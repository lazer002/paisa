import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'

import {
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  type PartyKind,
  type PartyRecord,
} from '@/features/crm/crmApi'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, StatusBadge, ModalShell, Field, inputCls, Toast, type Column,
} from '@/components/ui/kit'

const TYPES: Record<PartyKind, string[]> = {
  contacts: ['individual', 'parent', 'student', 'guardian', 'business', 'institution', 'vendor', 'partner', 'other'],
  customers: ['individual', 'business', 'parent', 'guardian', 'student', 'alumni', 'partner', 'other'],
}

const STATUSES: Record<PartyKind, string[]> = {
  contacts: ['active', 'inactive', 'blocked', 'archived'],
  customers: ['lead', 'prospect', 'active', 'inactive', 'blocked', 'suspended', 'churned', 'archived'],
}

const LABEL: Record<PartyKind, { one: string; many: string; permission: 'contact' | 'customer' }> = {
  contacts: { one: 'Contact', many: 'contacts', permission: 'contact' },
  customers: { one: 'Customer', many: 'customers', permission: 'customer' },
}

const nameOf = (r: PartyRecord) => r.fullName ?? r.displayName ?? '—'
const emailOf = (r: PartyRecord) => r.email ?? r.communication?.primaryEmail ?? '—'
const phoneOf = (r: PartyRecord) => r.phone ?? r.communication?.primaryPhone ?? '—'

const errorMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

/** Shared list + create + edit + delete view for CRM contacts and customers. */
export default function PartiesPanel({ kind }: { kind: PartyKind }) {
  const label = LABEL[kind]
  const { can } = usePermission()
  const canCreate = can(`${label.permission}:create`)
  const canEdit = can(`${label.permission}:update`)
  const canDelete = can(`${label.permission}:delete`)

  const contacts = useGetContactsQuery(undefined, { skip: kind !== 'contacts' })
  const customers = useGetCustomersQuery(undefined, { skip: kind !== 'customers' })
  const { data, isLoading, isError, refetch } = kind === 'contacts' ? contacts : customers

  const [createContact] = useCreateContactMutation()
  const [createCustomer] = useCreateCustomerMutation()
  const [updateContact] = useUpdateContactMutation()
  const [updateCustomer] = useUpdateCustomerMutation()
  const [deleteContact] = useDeleteContactMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PartyRecord | null>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState('individual')
  const [status, setStatus] = useState('active')

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (r) => !search || `${nameOf(r)} ${emailOf(r)} ${phoneOf(r)}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  )

  const resetForm = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setType('individual'); setStatus('active')
    setEditing(null)
  }

  const closeModal = () => {
    setOpen(false)
    resetForm()
  }

  const startEdit = (r: PartyRecord) => {
    setEditing(r)
    // Stored records keep one combined name, so editing uses a single name field.
    setFirstName(r.fullName ?? r.displayName ?? '')
    setLastName('')
    setEmail(r.email ?? r.communication?.primaryEmail ?? '')
    setPhone(r.phone ?? r.communication?.primaryPhone ?? '')
    setType(r.type ?? 'individual')
    setStatus(r.status ?? 'active')
    setOpen(true)
  }

  const submit = async () => {
    if (!firstName.trim()) return
    try {
      if (editing) {
        const changes = {
          [kind === 'contacts' ? 'fullName' : 'displayName']: firstName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          type,
          status,
        }
        const id = editing.publicId ?? editing._id
        await (kind === 'contacts' ? updateContact({ id, changes }) : updateCustomer({ id, changes })).unwrap()
      } else {
        const body = {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          type,
        }
        await (kind === 'contacts' ? createContact(body) : createCustomer(body)).unwrap()
      }
      setToast({ msg: `${label.one} ${editing ? 'updated' : 'added'}`, tone: 'success' })
      closeModal()
    } catch (e) {
      setToast({ msg: errorMessage(e, `Could not save ${label.one.toLowerCase()}`), tone: 'critical' })
    }
  }

  const remove = async (r: PartyRecord) => {
    const id = r.publicId ?? r._id
    try {
      await (kind === 'contacts' ? deleteContact(id) : deleteCustomer(id)).unwrap()
      setToast({ msg: `${label.one} deleted`, tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Delete failed'), tone: 'critical' })
    }
  }

  const columns: Column<PartyRecord>[] = [
    {
      key: 'name',
      header: label.one,
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{nameOf(r)}</p>
          {r.companyName && <p className="text-xs text-gray-400">{r.companyName}</p>}
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (r) => <span className="text-gray-500">{emailOf(r)}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-gray-500">{phoneOf(r)}</span> },
    { key: 'type', header: 'Type', render: (r) => <span className="capitalize text-gray-500">{r.type ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {canEdit && (
            <button
              onClick={() => startEdit(r)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => remove(r)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder={`Search ${label.many}...`}
        actions={
          canCreate ? (
            <Button onClick={() => { resetForm(); setOpen(true) }}><Plus size={15} /> New {label.one}</Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(r) => r.publicId ?? r._id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle={`No ${label.many} yet`}
        emptyHint={`Add your first ${label.one.toLowerCase()} to get started`}
      />

      <ModalShell
        open={open}
        onClose={closeModal}
        title={editing ? `Edit ${label.one}` : `New ${label.one}`}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={editing ? 'Name' : 'First name'} required>
            <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          {!editing && (
            <Field label="Last name">
              <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          )}
          <Field label="Email">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES[kind].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {editing && (
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES[kind].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </>
  )
}
