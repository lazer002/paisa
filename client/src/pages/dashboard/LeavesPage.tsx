import { useState } from 'react'
import { FileText, Plus, Check, X, Ban } from 'lucide-react'

import {
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useCancelLeaveMutation,
  type Leave,
} from '@/features/leaves/leavesApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

const STATUS_COLOR: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
  pending: 'yellow', approved: 'green', rejected: 'red', cancelled: 'gray',
}

const TYPES = ['casual', 'sick', 'earned', 'unpaid', 'other']

function ApplyLeaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [applyLeave, { isLoading }] = useApplyLeaveMutation()
  const [error, setError] = useState('')

  const [type, setType] = useState('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await applyLeave({ type: type as any, startDate, endDate, reason }).unwrap()
      onClose()
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to apply for leave')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Leave Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize outline-none focus:border-black">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">From *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">To *</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
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

export default function LeavesPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isApprover = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr'

  const { data: leaves, isLoading, isError, refetch } = useGetLeavesQuery()
  const [updateStatus] = useUpdateLeaveStatusMutation()
  const [cancelLeave] = useCancelLeaveMutation()
  const [showApply, setShowApply] = useState(false)

  const pending = (leaves ?? []).filter((l) => l.status === 'pending')
  const other = (leaves ?? []).filter((l) => l.status !== 'pending')

  const person = (l: Leave) => (typeof l.userId === 'object' ? l.userId?.name ?? '—' : '—')

  const renderRow = (l: Leave) => (
    <div key={l._id} className="flex items-center justify-between gap-3 border-b border-gray-50 px-5 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">
          {isApprover ? person(l) : `${l.type} leave`}{' '}
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
            <button onClick={() => updateStatus({ id: l._id, status: 'approved' })}
              className="rounded-lg p-1.5 text-green-600 transition hover:bg-green-50" title="Approve">
              <Check size={16} />
            </button>
            <button onClick={() => updateStatus({ id: l._id, status: 'rejected', rejectionReason: 'Not approved' })}
              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50" title="Reject">
              <X size={16} />
            </button>
          </>
        )}
        {!isApprover && l.status === 'pending' && user?._id === (typeof l.userId === 'object' ? l.userId?._id : l.userId) && (
          <button onClick={() => cancelLeave(l._id)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100" title="Cancel">
            <Ban size={15} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={isApprover ? 'Leave Requests' : 'My Leaves'}
        subtitle={isApprover ? 'Review and approve leave applications' : 'Apply for and track your leaves'}
        actions={<Button onClick={() => setShowApply(true)}><Plus size={16} /> Apply for Leave</Button>}
      />

      {isLoading ? (
        <LoadingList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !leaves?.length ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No leave requests"
          hint={isApprover ? 'Nothing to review right now' : 'You have not applied for any leave'}
          action={<Button onClick={() => setShowApply(true)}><Plus size={16} /> Apply for Leave</Button>}
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
      )}

      {showApply && <ApplyLeaveModal open={showApply} onClose={() => setShowApply(false)} />}
    </div>
  )
}
