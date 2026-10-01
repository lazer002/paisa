import { useState } from 'react'
import { Wallet, Plus, DollarSign } from 'lucide-react'

import {
  useGetPayrollsQuery,
  useCreatePayrollMutation,
  useUpdatePayrollStatusMutation,
  type Payroll,
} from '@/features/payroll/payrollApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

const STATUS_COLOR: Record<string, 'green' | 'blue' | 'gray'> = {
  paid: 'green', processed: 'blue', draft: 'gray',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function ProcessPayrollModal({
  open, onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { data: users } = useGetUsersQuery()
  const [createPayroll, { isLoading }] = useCreatePayrollMutation()
  const [error, setError] = useState('')

  const now = new Date()
  const [employeeId, setEmployeeId] = useState('')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [basicSalary, setBasicSalary] = useState('')
  const [hra, setHra] = useState('0')
  const [transport, setTransport] = useState('0')
  const [deduction, setDeduction] = useState('0')

  const employees = (users ?? []).filter((u) => u.role === 'employee' || u.role === 'hr' || u.role === 'teacher')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createPayroll({
        employeeId,
        month,
        year,
        basicSalary: Number(basicSalary),
        allowances: { hra: Number(hra) || 0, transport: Number(transport) || 0 },
        deductions: { other: Number(deduction) || 0 },
      }).unwrap()
      onClose()
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to process payroll')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Process Payroll" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Employee *</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
            <option value="">— Select employee —</option>
            {employees.map((u) => (
              <option key={rid(u)} value={rid(u)}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Month *</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Year *</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Basic Salary *</label>
            <input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} required placeholder="40000"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">HRA</label>
            <input type="number" value={hra} onChange={(e) => setHra(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Transport</label>
            <input type="number" value={transport} onChange={(e) => setTransport(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Deductions</label>
            <input type="number" value={deduction} onChange={(e) => setDeduction(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
        </div>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isLoading}>Process</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function PayrollPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr'
  const isOwnOnly = user?.role === 'employee'

  const { data: payrolls, isLoading, isError, refetch } = useGetPayrollsQuery()
  const [updateStatus] = useUpdatePayrollStatusMutation()
  const [showProcess, setShowProcess] = useState(false)

  const empName = (p: Payroll) =>
    typeof p.employeeId === 'object' ? p.employeeId?.name ?? '—' : '—'

  const totalPaid = (payrolls ?? []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.netSalary ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={isOwnOnly ? 'My Payslips' : 'Payroll'}
        subtitle={isOwnOnly ? 'Your salary slips' : 'Process salaries and track payments'}
        actions={canManage ? (
          <Button onClick={() => setShowProcess(true)}><Plus size={16} /> Process Payroll</Button>
        ) : undefined}
      />

      {canManage && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-green-50 p-3 text-green-600"><DollarSign size={20} /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total paid</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Wallet size={20} /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{payrolls?.filter((p) => p.status === 'processed').length ?? 0}</p>
              <p className="text-xs text-gray-500">Pending payment</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600"><Wallet size={20} /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{payrolls?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Total records</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !payrolls?.length ? (
        <EmptyState
          icon={<Wallet size={48} />}
          title={isOwnOnly ? 'No payslips yet' : 'No payroll records'}
          hint={canManage ? 'Process the first payroll' : 'Your payslips will appear here'}
          action={canManage ? <Button onClick={() => setShowProcess(true)}><Plus size={16} /> Process Payroll</Button> : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Basic</th>
                <th className="px-4 py-3 font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={rid(p)} className="border-b border-gray-50 transition hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{empName(p)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{MONTHS[p.month - 1]} {p.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">₹{p.basicSalary?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{p.netSalary?.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge color={STATUS_COLOR[p.status]}>{p.status}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {p.status !== 'paid' && (
                        <Button size="sm" variant="secondary" onClick={() => updateStatus({ id: rid(p), status: 'paid' })}>
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && showProcess && <ProcessPayrollModal open={showProcess} onClose={() => setShowProcess(false)} />}
    </div>
  )
}
