import { useMemo, useState } from 'react'
import { Plus, Trash2, IndianRupee, Wallet, FileText, Clock3 } from 'lucide-react'

import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useRecordPaymentMutation,
  useDeleteInvoiceMutation,
  type Invoice,
} from '@/features/platform/platformApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, SelectFilter, StatusBadge, ModalShell, Field, inputCls, Toast,
  type Column,
} from '@/components/ui/kit'

export default function InvoicesPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = ['super_admin', 'admin', 'accountant'].includes(user?.role ?? '')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [payFor, setPayFor] = useState<Invoice | null>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: invoices, isLoading, isError, refetch } = useGetInvoicesQuery()
  const { data: users } = useGetUsersQuery(undefined, { skip: !canManage })

  const [createInvoice] = useCreateInvoiceMutation()
  const [recordPayment] = useRecordPaymentMutation()
  const [deleteInvoice] = useDeleteInvoiceMutation()

  const [studentId, setStudentId] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')

  const filtered = useMemo(
    () =>
      (invoices ?? []).filter(
        (i) =>
          (!statusFilter || i.status === statusFilter) &&
          (!search || (i.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase())),
      ),
    [invoices, search, statusFilter],
  )

  const totals = useMemo(() => {
    const all = invoices ?? []
    return {
      collected: all.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.grandTotal ?? 0), 0),
      outstanding: all.reduce((s, i) => s + (i.amountDue ?? 0), 0),
      count: all.length,
    }
  }, [invoices])

  const submit = async () => {
    const price = Number(itemPrice)
    if (!itemDesc || !price) return
    try {
      await createInvoice({
        studentId: studentId || undefined,
        dueDate: dueDate || undefined,
        lineItems: [
          {
            description: itemDesc,
            quantity: Number(itemQty) || 1,
            unitPrice: price,
          },
        ],
      }).unwrap()
      setShowCreate(false)
      setStudentId(''); setItemDesc(''); setItemQty('1'); setItemPrice(''); setDueDate('')
      setToast({ msg: 'Invoice created as draft', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create invoice', tone: 'critical' })
    }
  }

  const pay = async () => {
    const amount = Number(payAmount)
    if (!payFor || !amount) return
    try {
      await recordPayment({ id: rid(payFor), amount, method: payMethod }).unwrap()
      setPayFor(null)
      setPayAmount('')
      setToast({ msg: 'Payment recorded', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Payment failed', tone: 'critical' })
    }
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (i) => (
        <div>
          <p className="font-medium text-gray-900">{i.invoiceNumber ?? i.publicId ?? i._id.slice(-8)}</p>
          <p className="text-xs text-gray-400">
            {typeof i.studentId === 'object' ? i.studentId?.name ?? '' : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (i) => <span className="font-medium text-gray-800">₹{(i.grandTotal ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      render: (i) => (
        <span className={(i.amountDue ?? 0) > 0 ? 'font-medium text-rose-600' : 'text-emerald-600'}>
          ₹{(i.amountDue ?? 0).toLocaleString()}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (i) =>
        canManage && (
          <div className="flex justify-end gap-1.5">
            {!['paid', 'cancelled', 'void'].includes(i.status) && (
              <button
                onClick={(e) => { e.stopPropagation(); setPayFor(i) }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <IndianRupee size={12} /> Payment
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); deleteInvoice(rid(i)) }}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={canManage ? 'Billing' : 'My Invoices'}
        subtitle={canManage ? 'Create invoices and record payments' : 'Your invoices and payment history'}
        actions={canManage ? <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Invoice</Button> : undefined}
      />

      {canManage && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Collected', value: totals.collected, icon: Wallet, cls: 'bg-emerald-50 text-emerald-600' },
            { label: 'Outstanding', value: totals.outstanding, icon: Clock3, cls: 'bg-amber-50 text-amber-600' },
            { label: 'Invoices', value: totals.count, icon: FileText, cls: 'bg-sky-50 text-sky-600' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`rounded-lg p-2.5 ${s.cls}`}><s.icon size={18} /></div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {typeof s.value === 'number' && s.label !== 'Invoices' ? `₹${s.value.toLocaleString()}` : s.value}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search invoice #..."
        filters={
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
            ]}
          />
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        keyOf={(i) => i.publicId ?? i._id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No invoices"
        emptyHint={canManage ? 'Create your first invoice to start billing' : 'Invoices will appear here'}
        emptyAction={canManage ? <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Invoice</Button> : undefined}
      />

      {/* New invoice */}
      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Invoice"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit}>Create Invoice</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Bill to (student)">
            <select className={inputCls} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— No student linked —</option>
              {(users ?? []).filter((u) => u.role === 'student').map((u) => (
                <option key={rid(u)} value={rid(u)}>{u.name} ({u.userCode ?? u.email})</option>
              ))}
            </select>
          </Field>
          <Field label="Line item description" required>
            <input className={inputCls} value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="e.g. Term 2 tuition fee" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty">
              <input type="number" className={inputCls} value={itemQty} onChange={(e) => setItemQty(e.target.value)} />
            </Field>
            <Field label="Unit price (₹)" required>
              <input type="number" className={inputCls} value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
            </Field>
            <Field label="Due date">
              <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          {itemPrice && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">
                ₹{((Number(itemQty) || 1) * (Number(itemPrice) || 0)).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </ModalShell>

      {/* Record payment */}
      <ModalShell
        open={!!payFor}
        onClose={() => setPayFor(null)}
        title="Record Payment"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayFor(null)}>Cancel</Button>
            <Button onClick={pay}>Record</Button>
          </>
        }
      >
        <div className="space-y-4">
          {payFor && (
            <p className="text-sm text-gray-600">
              Outstanding: <span className="font-semibold text-rose-600">₹{(payFor.amountDue ?? 0).toLocaleString()}</span>
            </p>
          )}
          <Field label="Amount (₹)" required>
            <input type="number" className={inputCls} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(payFor?.amountDue ?? '')} />
          </Field>
          <Field label="Method">
            <select className={inputCls} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {['cash', 'upi', 'bank_transfer', 'card', 'cheque'].map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </Field>
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
