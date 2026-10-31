import { useState } from 'react'
import { ArrowRight, CheckSquare, History, Plus, Square } from 'lucide-react'

import {
  useChangeEmployeeStageMutation,
  useGetEmployeeLifecycleQuery,
  useUpdateEmployeeChecklistMutation,
  type ChecklistItem,
  type ExitType,
  type LifecycleStage,
} from '@/features/people/peopleApi'
import Button from '@/components/ui/button'
import { ErrorState, LoadingList } from '@/components/ui/StateViews'
import { StageBadge } from './stage'
import { stageLabel } from './stageMeta'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-black focus:bg-white'
const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

const errMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

const DATE_LABELS: [keyof ReturnType<typeof emptyDates>, string][] = [
  ['joiningDate', 'Joined'],
  ['probationEndDate', 'Probation ends'],
  ['confirmationDate', 'Confirmed'],
  ['resignationDate', 'Resigned'],
  ['lastWorkingDate', 'Last working day'],
  ['terminationDate', 'Terminated'],
  ['retirementDate', 'Retired'],
]

function emptyDates() {
  return {
    joiningDate: null as string | null,
    probationEndDate: null as string | null,
    confirmationDate: null as string | null,
    resignationDate: null as string | null,
    lastWorkingDate: null as string | null,
    terminationDate: null as string | null,
    retirementDate: null as string | null,
  }
}

function StageChangeForm({
  publicId,
  current,
  allowed,
}: {
  publicId: string
  current: string
  allowed: LifecycleStage[]
}) {
  const [changeStage, { isLoading }] = useChangeEmployeeStageMutation()
  const [target, setTarget] = useState<LifecycleStage | ''>('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [lastWorkingDate, setLastWorkingDate] = useState('')
  const [probationEndDate, setProbationEndDate] = useState('')
  const [exitType, setExitType] = useState<ExitType>('resigned')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [deactivateUser, setDeactivateUser] = useState(false)
  const [reactivateUser, setReactivateUser] = useState(false)
  const [error, setError] = useState('')

  if (!allowed.length) {
    return <p className="text-sm text-gray-500">No further stage changes are allowed from here.</p>
  }

  const submit = async () => {
    if (!target) {
      setError('Pick the next stage.')
      return
    }
    setError('')
    try {
      await changeStage({
        publicId,
        stage: target,
        note: note.trim() || undefined,
        effectiveDate: effectiveDate || undefined,
        lastWorkingDate:
          target === 'notice_period' || target === 'exited' ? lastWorkingDate || undefined : undefined,
        probationEndDate: target === 'probation' ? probationEndDate || undefined : undefined,
        exitType: target === 'exited' ? exitType : undefined,
        reason: target === 'exited' || target === 'notice_period' ? reason.trim() || undefined : undefined,
        deactivateUser: target === 'exited' ? deactivateUser : undefined,
        reactivateUser: current === 'exited' ? reactivateUser : undefined,
      }).unwrap()
      setTarget('')
      setNote('')
      setReason('')
      setEffectiveDate('')
      setLastWorkingDate('')
      setProbationEndDate('')
      setDeactivateUser(false)
      setReactivateUser(false)
    } catch (e) {
      setError(errMessage(e, 'Could not change stage.'))
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Move to</label>
          <select
            className={inputCls}
            value={target}
            onChange={(e) => setTarget(e.target.value as LifecycleStage | '')}
          >
            <option value="">Select stage…</option>
            {allowed.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Effective date</label>
          <input
            type="date"
            className={inputCls}
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
        </div>

        {target === 'probation' && (
          <div>
            <label className={labelCls}>Probation end date (default +90 days)</label>
            <input
              type="date"
              className={inputCls}
              value={probationEndDate}
              onChange={(e) => setProbationEndDate(e.target.value)}
            />
          </div>
        )}

        {(target === 'notice_period' || target === 'exited') && (
          <div>
            <label className={labelCls}>
              Last working day{target === 'notice_period' ? ' (default: notice period)' : ''}
            </label>
            <input
              type="date"
              className={inputCls}
              value={lastWorkingDate}
              onChange={(e) => setLastWorkingDate(e.target.value)}
            />
          </div>
        )}

        {target === 'exited' && (
          <div>
            <label className={labelCls}>Exit type</label>
            <select
              className={inputCls}
              value={exitType}
              onChange={(e) => setExitType(e.target.value as ExitType)}
            >
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        )}
      </div>

      {(target === 'exited' || target === 'notice_period') && (
        <div>
          <label className={labelCls}>Reason</label>
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}

      <div>
        <label className={labelCls}>Note (saved in history)</label>
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {target === 'exited' && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={deactivateUser}
            onChange={(e) => setDeactivateUser(e.target.checked)}
          />
          Also deactivate their login account and sign them out
        </label>
      )}

      {current === 'exited' && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={reactivateUser}
            onChange={(e) => setReactivateUser(e.target.checked)}
          />
          Reactivate their login account
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={submit} loading={isLoading} disabled={!target}>
          <ArrowRight size={15} /> Change stage
        </Button>
      </div>
    </div>
  )
}

function ChecklistSection({
  publicId,
  items,
  editable,
}: {
  publicId: string
  items: ChecklistItem[]
  editable: boolean
}) {
  const [updateChecklist, { isLoading }] = useUpdateEmployeeChecklistMutation()
  const [draft, setDraft] = useState<Record<'onboarding' | 'exit', string>>({ onboarding: '', exit: '' })
  const [error, setError] = useState('')

  const save = async (next: ChecklistItem[]) => {
    setError('')
    try {
      await updateChecklist({
        publicId,
        items: next.map(({ key, label, phase, done }) => ({ key, label, phase, done })),
      }).unwrap()
    } catch (e) {
      setError(errMessage(e, 'Could not update checklist.'))
    }
  }

  const toggle = (key: string) =>
    save(items.map((it) => (it.key === key ? { ...it, done: !it.done } : it)))

  const add = (phase: 'onboarding' | 'exit') => {
    const label = draft[phase].trim()
    if (!label) return
    const taken = new Set(items.map((it) => it.key))
    let n = items.length + 1
    while (taken.has(`custom_${phase}_${n}`)) n++
    const key = `custom_${phase}_${n}`
    setDraft((d) => ({ ...d, [phase]: '' }))
    save([...items, { key, label, phase, done: false }])
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(['onboarding', 'exit'] as const).map((phase) => {
        const list = items.filter((it) => it.phase === phase)
        const done = list.filter((it) => it.done).length
        return (
          <div key={phase} className="rounded-xl border border-gray-100 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {phase === 'onboarding' ? 'Onboarding' : 'Exit'} checklist{' '}
              <span className="font-normal text-gray-400">
                ({done}/{list.length})
              </span>
            </p>
            <ul className="space-y-1.5">
              {list.map((it) => (
                <li key={it.key}>
                  <button
                    type="button"
                    disabled={!editable || isLoading}
                    onClick={() => toggle(it.key)}
                    className="flex w-full items-start gap-2 text-left text-sm text-gray-700 disabled:cursor-default"
                    title={it.done && it.doneAt ? `Done ${fmtDateTime(it.doneAt)}` : undefined}
                  >
                    {it.done ? (
                      <CheckSquare size={16} className="mt-0.5 shrink-0 text-green-700" />
                    ) : (
                      <Square size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    )}
                    <span className={it.done ? 'text-gray-400 line-through' : ''}>{it.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            {editable && (
              <div className="mt-2 flex gap-2">
                <input
                  className={inputCls}
                  placeholder="Add item…"
                  value={draft[phase]}
                  onChange={(e) => setDraft((d) => ({ ...d, [phase]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') add(phase)
                  }}
                />
                <Button variant="secondary" size="sm" onClick={() => add(phase)} disabled={isLoading}>
                  <Plus size={14} />
                </Button>
              </div>
            )}
          </div>
        )
      })}
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </div>
  )
}

/**
 * Lifecycle stage, stage change form, onboarding/exit checklist and history
 * for one employee (identified by the User publicId).
 */
export default function EmployeeLifecyclePanel({
  publicId,
  canManage,
}: {
  publicId: string
  canManage: boolean
}) {
  const { data, isLoading, isError, refetch } = useGetEmployeeLifecycleQuery(publicId)

  if (isLoading) return <LoadingList rows={3} />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />

  const dates = { ...emptyDates(), ...data.dates }
  const shownDates = DATE_LABELS.filter(([key]) => dates[key])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">Current stage</span>
        <StageBadge stage={data.stage} />
        {data.status && data.stage === 'exited' && (
          <span className="text-xs capitalize text-gray-500">({data.status})</span>
        )}
        {data.employee.accountStatus && data.employee.accountStatus !== 'active' && (
          <span className="text-xs text-red-600">Login account {data.employee.accountStatus}</span>
        )}
      </div>

      {shownDates.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          {shownDates.map(([key, label]) => (
            <div key={key}>
              <dt className="text-xs text-gray-400">{label}</dt>
              <dd className="text-gray-800">{fmtDate(dates[key])}</dd>
            </div>
          ))}
        </dl>
      )}

      {canManage && (
        <StageChangeForm
          key={data.stage}
          publicId={publicId}
          current={data.stage}
          allowed={data.allowedNext}
        />
      )}

      <div>
        <ChecklistSection
          publicId={publicId}
          items={data.checklist}
          editable={canManage && data.hasProfile}
        />
        {canManage && !data.hasProfile && (
          <p className="mt-2 text-xs text-gray-500">
            Set a stage first; the checklist is saved once the employee has a lifecycle record.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <History size={15} /> Stage history
        </p>
        {!data.history.length ? (
          <p className="text-sm text-gray-500">No stage changes recorded yet.</p>
        ) : (
          <ol className="space-y-2">
            {data.history.map((h) => (
              <li key={h.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge stage={h.from ?? 'none'} />
                  <ArrowRight size={13} className="text-gray-400" />
                  <StageBadge stage={h.to} />
                  {h.to === 'exited' && h.status && (
                    <span className="text-xs capitalize text-gray-500">({h.status})</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {fmtDateTime(h.at)} by {h.byName ?? 'unknown'}
                </p>
                {h.note && <p className="mt-0.5 text-gray-700">{h.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
