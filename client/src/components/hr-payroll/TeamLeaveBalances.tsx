import { useState } from 'react'

import { useGetAllLeaveBalancesQuery, useAdjustLeaveBalanceMutation } from '@/features/leaves/leavesApi'
import { SectionCard, ModalShell, Field, inputCls } from '@/components/ui/kit'
import Button from '@/components/ui/button'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Approvers: everyone's remaining days per leave type; managers can adjust. */
export default function TeamLeaveBalances({ canAdjust }: { canAdjust: boolean }) {
  const year = new Date().getFullYear()
  const { data, isLoading } = useGetAllLeaveBalancesQuery({ year })
  const [adjust, { isLoading: saving }] = useAdjustLeaveBalanceMutation()
  const [target, setTarget] = useState<{ userId: string; name: string; leaveType: string; adjustment: number } | null>(null)
  const [error, setError] = useState('')

  const save = async () => {
    if (!target) return
    setError('')
    try {
      await adjust({ userId: target.userId, year, leaveType: target.leaveType, adjustment: target.adjustment }).unwrap()
      setTarget(null)
    } catch (e) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Could not adjust the balance')
    }
  }

  return (
    <SectionCard title={`Team leave balances ${year}`} subtitle="Remaining / total days. Pending requests are already reserved.">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !data?.policies.length ? (
        <p className="text-sm text-gray-500">No active leave policies.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="py-2 font-medium">Person</th>
                {data.policies.map((p) => <th key={p.leaveType} className="py-2 font-medium capitalize">{p.name.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.users.map((row) => (
                <tr key={row.user.publicId} className="border-b border-gray-50">
                  <td className="py-2">{row.user.name}<span className="ml-1 text-xs capitalize text-gray-400">{row.user.role}</span></td>
                  {data.policies.map((p) => {
                    const b = row.balances.find((x) => x.leaveType === p.leaveType)
                    if (!b) return <td key={p.leaveType} className="py-2 text-gray-300">—</td>
                    return (
                      <td key={p.leaveType} className="py-2">
                        <button
                          disabled={!canAdjust}
                          onClick={() => setTarget({ userId: row.user.publicId, name: row.user.name, leaveType: p.leaveType, adjustment: b.adjustment })}
                          className={`text-left ${canAdjust ? 'hover:underline' : ''} ${b.remaining <= 0 ? 'text-red-600' : 'text-gray-800'}`}
                          title={`Used ${b.used}, pending ${b.pending}`}
                        >
                          {fmt(b.remaining)} / {fmt(b.total)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalShell
        open={!!target}
        onClose={() => setTarget(null)}
        title="Adjust leave balance"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        }
      >
        {target && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {target.name} · <span className="capitalize">{target.leaveType.replace(/_/g, ' ')}</span> · {year}
            </p>
            <Field label="Adjustment (days, may be negative)">
              <input type="number" step={0.5} className={inputCls} value={target.adjustment}
                onChange={(e) => setTarget({ ...target, adjustment: Number(e.target.value) })} />
            </Field>
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          </div>
        )}
      </ModalShell>
    </SectionCard>
  )
}
