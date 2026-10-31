import { useState } from 'react'
import { FileText, Plus, Check, X, Ban } from 'lucide-react'

import {
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useCancelLeaveMutation,
  useGetMyLeaveBalancesQuery,
  type Leave,
  type LeaveBalance,
  type LeaveType,
} from '@/features/leaves/leavesApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import { rid } from '@/features/users/usersApi'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import { Tabs } from '@/components/ui/kit'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'
import LeaveBalanceCards from '@/components/hr-payroll/LeaveBalanceCards'
import LeavePoliciesPanel from '@/components/hr-payroll/LeavePoliciesPanel'
import TeamLeaveBalances from '@/components/hr-payroll/TeamLeaveBalances'

const STATUS_COLOR: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
  pending: 'yellow', approved: 'green', rejected: 'red', cancelled: 'gray',
}

const TYPES: LeaveType[] = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'comp_off', 'unpaid', 'other']

function ApplyLeaveModal({ open, onClose, balances }: { open: boolean; onClose: () => void; balances: LeaveBalance[] }) {
  const [applyLeave, { isLoading }] = useApplyLeaveMutation()
  const [error, setError] = useState('')

  const [type, setType] = useState<LeaveType>('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [halfDay, setHalfDay] = useState(false)
  const [reason, setReason] = useState('')

  const balance = balances.find((b) => b.leaveType === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await applyLeave({
        type,
        startDate,
        endDate: halfDay ? startDate : endDate,
        reason,
        duration: halfDay ? 'half_day_morning' : undefined,
      }).unwrap()
      onClose()
    } catch (e) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Failed to apply for leave')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Leave Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as LeaveType)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize outline-none focus:border-black">
            {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {type === 'unpaid'
              ? 'Unpaid leave is not limited but is deducted from salary (loss of pay).'
              : balance
                ? `${balance.remaining} day(s) remaining of ${balance.total} this year.`
                : 'This leave type is not limited by a balance.'}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} />
          Half day
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{halfDay ? 'Date *' : 'From *'}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          {!halfDay && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">To *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Reason *</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3}
            placeholder="Why do you need this leave?"
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
        </div>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isLoading}>Submit Application</Button>
        </div>
      </form>
    </Modal>
  )
}

type Tab = 'requests' | 'balances' | 'policies'

export default function LeavesPage() {
  const user = useAppSelector((s) => s.auth.user)
  const { can } = usePermission()
  const isApprover = can('leave:approve')
  const canManagePolicies = can('leave:manage')
  const canApply = can('leave:create')
  const [tab, setTab] = useState<Tab>('requests')

  const { data: leaves, isLoading, isError, refetch } = useGetLeavesQuery()
  const { data: myBalances } = useGetMyLeaveBalancesQuery(undefined, { skip: !canApply })
  const [updateStatus] = useUpdateLeaveStatusMutation()
  const [cancelLeave] = useCancelLeaveMutation()
  const [showApply, setShowApply] = useState(false)
  const [actionError, setActionError] = useState('')

  const pending = (leaves ?? []).filter((l) => l.status === 'pending')
  const other = (leaves ?? []).filter((l) => l.status !== 'pending')
  const balances = myBalances?.balances ?? []

  const person = (l: Leave) => (typeof l.userId === 'object' ? l.userId?.name ?? '—' : '—')
  const isMine = (l: Leave) =>
    typeof l.userId === 'object'
      ? user?.publicId === l.userId.publicId || user?._id === l.userId._id
      : user?.publicId === l.userId

  const run = async (action: () => Promise<unknown>) => {
    setActionError('')
    try {
      await action()
    } catch (e) {
      setActionError((e as { data?: { message?: string } })?.data?.message ?? 'Action failed')
    }
  }

  const canCancel = (l: Leave) =>
    (l.status === 'pending' && (isMine(l) || isApprover)) ||
    (l.status === 'approved' && (isApprover || (isMine(l) && new Date(l.startDate) > new Date())))

  const renderRow = (l: Leave) => (
    <div key={rid(l)} className="flex items-center justify-between gap-3 border-b border-gray-50 px-5 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">
          {isApprover ? `${person(l)} · ` : ''}<span className="capitalize">{l.type.replace(/_/g, ' ')} leave</span>{' '}
          <span className="font-normal text-gray-400">· {l.days} day{l.days !== 1 ? 's' : ''}</span>
        </p>
        <p className="truncate text-xs text-gray-400">
          {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()} · {l.reason}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Badge color={STATUS_COLOR[l.status]}>{l.status}</Badge>
        {isApprover && l.status === 'pending' && (
          <>
            <button onClick={() => run(() => updateStatus({ id: rid(l), status: 'approved' }).unwrap())}
              className="rounded-lg p-1.5 text-green-600 transition hover:bg-green-50" title="Approve">
              <Check size={16} />
            </button>
            <button onClick={() => run(() => updateStatus({ id: rid(l), status: 'rejected', rejectionReason: 'Not approved' }).unwrap())}
              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50" title="Reject">
              <X size={16} />
            </button>
          </>
        )}
        {canCancel(l) && (
          <button onClick={() => run(() => cancelLeave(rid(l)).unwrap())}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100" title="Cancel">
            <Ban size={15} />
          </button>
        )}
      </div>
    </div>
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'requests', label: 'Requests' },
    ...(isApprover ? [{ id: 'balances' as const, label: 'Team balances' }] : []),
    ...(canManagePolicies ? [{ id: 'policies' as const, label: 'Policies' }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={isApprover ? 'Leave Requests' : 'My Leaves'}
        subtitle={isApprover ? 'Review and approve leave applications' : 'Apply for and track your leaves'}
        actions={canApply ? <Button onClick={() => setShowApply(true)}><Plus size={16} /> Apply for Leave</Button> : undefined}
      />

      {canApply && balances.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">My balance {myBalances?.year}</p>
          <LeaveBalanceCards balances={balances} year={myBalances?.year ?? new Date().getFullYear()} />
        </div>
      )}

      {tabs.length > 1 && <Tabs tabs={tabs} active={tab} onChange={setTab} />}

      {actionError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>}

      {tab === 'balances' && isApprover && <TeamLeaveBalances canAdjust={canManagePolicies} />}
      {tab === 'policies' && canManagePolicies && <LeavePoliciesPanel />}

      {tab === 'requests' && (isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !leaves?.length ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No leave requests"
          hint={isApprover ? 'Nothing to review right now' : 'You have not applied for any leave'}
          action={canApply ? <Button onClick={() => setShowApply(true)}><Plus size={16} /> Apply for Leave</Button> : undefined}
        />
      ) : (
        <>
          {isApprover && pending.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Pending ({pending.length})
              </p>
              <div className="rounded-2xl bg-white shadow-sm">{pending.map(renderRow)}</div>
            </div>
          )}
          <div>
            {isApprover && pending.length > 0 && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">History</p>
            )}
            <div className="rounded-2xl bg-white shadow-sm">{(isApprover ? other : leaves).map(renderRow)}</div>
          </div>
        </>
      ))}

      {showApply && <ApplyLeaveModal open={showApply} onClose={() => setShowApply(false)} balances={balances} />}
    </div>
  )
}
