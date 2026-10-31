import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import {
  useGetLeavePoliciesQuery,
  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
  useDeleteLeavePolicyMutation,
  POLICY_LEAVE_TYPES,
  type LeavePolicy,
  type LeaveType,
} from '@/features/leaves/leavesApi'
import { SectionCard, Field, inputCls, ModalShell } from '@/components/ui/kit'
import Button from '@/components/ui/button'

const ROLE_OPTIONS = ['admin', 'principal', 'hr', 'accountant', 'counselor', 'teacher', 'support', 'employee', 'student']
const DEFAULT_ROLES = ROLE_OPTIONS.filter((r) => r !== 'student')

const errorText = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

interface FormState {
  leaveType: LeaveType
  name: string
  yearlyAllocation: string
  carryForwardCap: string
  appliesToRoles: string[]
  isActive: boolean
}

const emptyForm = (taken: string[]): FormState => ({
  leaveType: POLICY_LEAVE_TYPES.find((t) => !taken.includes(t)) ?? 'casual',
  name: '',
  yearlyAllocation: '12',
  carryForwardCap: '0',
  appliesToRoles: DEFAULT_ROLES,
  isActive: true,
})

/** Admin/HR: yearly leave allocation per leave type for the organization. */
export default function LeavePoliciesPanel() {
  const { data: policies } = useGetLeavePoliciesQuery()
  const [createPolicy, { isLoading: creating }] = useCreateLeavePolicyMutation()
  const [updatePolicy, { isLoading: updating }] = useUpdateLeavePolicyMutation()
  const [deletePolicy] = useDeleteLeavePolicyMutation()

  const [editing, setEditing] = useState<LeavePolicy | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm([]))
  const [error, setError] = useState('')

  const taken = (policies ?? []).map((p) => p.leaveType)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm(taken))
    setError('')
    setOpen(true)
  }

  const openEdit = (p: LeavePolicy) => {
    setEditing(p)
    setForm({
      leaveType: p.leaveType,
      name: p.name ?? '',
      yearlyAllocation: String(p.yearlyAllocation),
      carryForwardCap: String(p.carryForwardCap ?? 0),
      appliesToRoles: p.appliesToRoles,
      isActive: p.isActive,
    })
    setError('')
    setOpen(true)
  }

  const save = async () => {
    setError('')
    const payload = {
      name: form.name || null,
      yearlyAllocation: Number(form.yearlyAllocation),
      carryForwardCap: Number(form.carryForwardCap) || 0,
      appliesToRoles: form.appliesToRoles,
      isActive: form.isActive,
    }
    try {
      if (editing) await updatePolicy({ id: editing.publicId, payload }).unwrap()
      else await createPolicy({ ...payload, leaveType: form.leaveType }).unwrap()
      setOpen(false)
    } catch (e) {
      setError(errorText(e, 'Could not save the policy'))
    }
  }

  const toggleRole = (role: string) =>
    setForm((f) => ({
      ...f,
      appliesToRoles: f.appliesToRoles.includes(role)
        ? f.appliesToRoles.filter((r) => r !== role)
        : [...f.appliesToRoles, role],
    }))

  return (
    <SectionCard
      title="Leave policies"
      subtitle="Days per calendar year for each leave type. Unpaid leave is never limited and counts as loss of pay."
      actions={<Button size="sm" onClick={openCreate} disabled={taken.length >= POLICY_LEAVE_TYPES.length}><Plus size={14} /> Add policy</Button>}
    >
      {!policies?.length ? (
        <p className="text-sm text-gray-500">No policies yet. Without a policy, leave types are not limited.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Days / year</th>
                <th className="py-2 font-medium">Carry forward cap</th>
                <th className="py-2 font-medium">Roles</th>
                <th className="py-2 font-medium">Active</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.publicId} className="border-b border-gray-50">
                  <td className="py-2 capitalize">{(p.name || p.leaveType).replace(/_/g, ' ')}</td>
                  <td className="py-2">{p.yearlyAllocation}</td>
                  <td className="py-2">{p.carryForwardCap || '—'}</td>
                  <td className="py-2 text-xs text-gray-500">{p.appliesToRoles.join(', ')}</td>
                  <td className="py-2">{p.isActive ? 'Yes' : 'No'}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => deletePolicy(p.publicId)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit leave policy' : 'Add leave policy'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={creating || updating}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Leave type" required>
            <select className={inputCls} value={form.leaveType} disabled={!!editing}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveType })}>
              {POLICY_LEAVE_TYPES.filter((t) => t === form.leaveType || !taken.includes(t)).map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Display name">
            <input className={inputCls} value={form.name} placeholder="e.g. Casual leave" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Days per year" required>
              <input type="number" min={0} max={366} step={0.5} className={inputCls} value={form.yearlyAllocation}
                onChange={(e) => setForm({ ...form, yearlyAllocation: e.target.value })} />
            </Field>
            <Field label="Carry forward cap">
              <input type="number" min={0} max={366} step={0.5} className={inputCls} value={form.carryForwardCap}
                onChange={(e) => setForm({ ...form, carryForwardCap: e.target.value })} />
            </Field>
          </div>
          <Field label="Applies to roles">
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex items-center gap-1 text-sm capitalize text-gray-700">
                  <input type="checkbox" checked={form.appliesToRoles.includes(role)} onChange={() => toggleRole(role)} />
                  {role}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        </div>
      </ModalShell>
    </SectionCard>
  )
}
