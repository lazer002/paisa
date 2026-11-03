import { useState } from 'react'
import { Plus, X } from 'lucide-react'

import {
  useUpdateReviewMutation,
  useUpdateReviewProgressMutation,
  type ImprovementPlan,
  type PerformanceReview,
  type ReviewGoal,
} from '@/features/platform/platformApi'
import { rid } from '@/features/users/usersApi'
import Button from '@/components/ui/button'
import { ModalShell, Field, inputCls } from '@/components/ui/kit'

const GOAL_STATUSES = ['not_started', 'in_progress', 'completed', 'partially_completed', 'cancelled', 'deferred']
const PIP_STATUSES = ['planned', 'active', 'completed', 'failed', 'cancelled']
const OBJECTIVE_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled']
const REVIEW_STATUSES = ['draft', 'scheduled', 'in_progress', 'submitted', 'under_review', 'completed', 'cancelled']
const OUTCOMES = [
  'exceeds_expectations', 'meets_expectations', 'partially_meets_expectations', 'does_not_meet_expectations',
  'promotion_recommended', 'salary_revision_recommended', 'pip_recommended', 'no_change',
]

const label = (s: string) => s.replace(/_/g, ' ')
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')
const errMsg = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message ?? fallback

/** Weighted average progress — same rule as the server's goalScoreOf. */
const goalScore = (goals: ReviewGoal[]) => {
  const active = goals.filter((g) => g.status !== 'cancelled')
  if (!active.length) return null
  const total = active.reduce((s, g) => s + (Number(g.weight) || 0), 0)
  const score = total
    ? active.reduce((s, g) => s + (Number(g.progress) || 0) * (Number(g.weight) || 0), 0) / total
    : active.reduce((s, g) => s + (Number(g.progress) || 0), 0) / active.length
  return Math.round(score * 10) / 10
}

/**
 * One review: managers edit rating, outcome, goals and the improvement plan;
 * the reviewed employee updates progress on their own goals and objectives.
 */
export default function ReviewModal({
  review,
  canManage,
  onClose,
  onToast,
}: {
  review: PerformanceReview
  canManage: boolean
  onClose: () => void
  onToast: (t: { msg: string; tone: 'success' | 'critical' }) => void
}) {
  const [updateReview, { isLoading: saving }] = useUpdateReviewMutation()
  const [updateProgress, { isLoading: savingProgress }] = useUpdateReviewProgressMutation()

  const [status, setStatus] = useState(review.status)
  const [rating, setRating] = useState(review.overallRating != null ? String(review.overallRating) : '')
  const [outcome, setOutcome] = useState(review.outcome ?? '')
  const [strengths, setStrengths] = useState((review.strengths ?? []).join('\n'))
  const [improve, setImprove] = useState((review.areasForImprovement ?? []).join('\n'))
  const [goals, setGoals] = useState<ReviewGoal[]>(review.goals ?? [])
  const [plan, setPlan] = useState<ImprovementPlan>(review.performanceImprovementPlan ?? { status: 'planned', objectives: [] })
  const [showPlan, setShowPlan] = useState(!!review.performanceImprovementPlan?.enabled)

  const setGoal = (i: number, patch: Partial<ReviewGoal>) => setGoals(goals.map((g, j) => (j === i ? { ...g, ...patch } : g)))
  const objectives = plan.objectives ?? []
  const setObjective = (i: number, patch: Partial<NonNullable<ImprovementPlan['objectives']>[number]>) =>
    setPlan({ ...plan, objectives: objectives.map((o, j) => (j === i ? { ...o, ...patch } : o)) })

  const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

  const saveManager = async () => {
    try {
      await updateReview({
        id: rid(review),
        payload: {
          status,
          overallRating: rating === '' ? undefined : Number(rating),
          outcome: outcome || undefined,
          strengths: lines(strengths),
          areasForImprovement: lines(improve),
          goals: goals.filter((g) => g.title.trim()).map((g) => ({
            title: g.title.trim(), description: g.description || undefined, dueDate: g.dueDate || undefined,
            status: g.status, progress: Number(g.progress) || 0, weight: Number(g.weight) || 0,
          })),
          ...(showPlan
            ? {
                improvementPlan: {
                  enabled: true,
                  status: plan.status ?? 'planned',
                  startDate: plan.startDate || undefined,
                  endDate: plan.endDate || undefined,
                  reviewFrequency: plan.reviewFrequency || undefined,
                  outcome: plan.outcome || undefined,
                  objectives: objectives.filter((o) => o.title.trim()).map((o) => ({
                    title: o.title.trim(), description: o.description || undefined, targetDate: o.targetDate || undefined,
                    status: o.status, progress: Number(o.progress) || 0,
                  })),
                },
              }
            : review.performanceImprovementPlan?.enabled
              ? { improvementPlan: { enabled: false, status: 'cancelled' } }
              : {}),
        },
      }).unwrap()
      onToast({ msg: 'Review saved', tone: 'success' })
      onClose()
    } catch (e) {
      onToast({ msg: errMsg(e, 'Could not save the review'), tone: 'critical' })
    }
  }

  const saveProgress = async () => {
    try {
      await updateProgress({
        id: rid(review),
        goals: goals.map((g, index) => ({ index, progress: Number(g.progress) || 0, status: g.status })),
        objectives: objectives.map((o, index) => ({ index, progress: Number(o.progress) || 0, status: o.status })),
      }).unwrap()
      onToast({ msg: 'Progress saved', tone: 'success' })
      onClose()
    } catch (e) {
      onToast({ msg: errMsg(e, 'Could not save your progress'), tone: 'critical' })
    }
  }

  const score = goalScore(goals)

  return (
    <ModalShell
      open
      onClose={onClose}
      title={review.title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {canManage ? (
            <Button onClick={saveManager} loading={saving}>Save review</Button>
          ) : (goals.length > 0 || objectives.length > 0) ? (
            <Button onClick={saveProgress} loading={savingProgress}>Save my progress</Button>
          ) : null}
        </>
      }
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        {canManage ? (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </Field>
            <Field label={`Overall rating (of ${review.maxRating ?? 5})`}>
              <input type="number" min={0} max={review.maxRating ?? 5} step="0.5" className={inputCls} value={rating} onChange={(e) => setRating(e.target.value)} />
            </Field>
            <Field label="Outcome">
              <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option value="">—</option>
                {OUTCOMES.map((o) => <option key={o} value={o}>{label(o)}</option>)}
              </select>
            </Field>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Status <b>{label(review.status)}</b>
            {review.overallRating != null && <> · rating <b>{review.overallRating}</b></>}
            {review.outcome && <> · outcome <b>{label(review.outcome)}</b></>}
          </p>
        )}

        {/* Goals */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Goals</h3>
            <span className="text-xs text-gray-500">{score !== null ? `Goal score ${score}%` : 'No goals yet'}</span>
          </div>
          {goals.map((g, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                {canManage ? (
                  <input className={inputCls} placeholder="Goal" value={g.title} onChange={(e) => setGoal(i, { title: e.target.value })} />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{g.title}{g.dueDate && <span className="ml-2 text-xs font-normal text-gray-400">due {day(g.dueDate)}</span>}</p>
                )}
                {canManage && (
                  <button type="button" onClick={() => setGoals(goals.filter((_, j) => j !== i))} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove goal">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="text-xs text-gray-500">Progress %
                  <input type="number" min={0} max={100} className={inputCls} value={g.progress ?? 0} onChange={(e) => setGoal(i, { progress: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-gray-500">Status
                  <select className={inputCls} value={g.status ?? 'not_started'} onChange={(e) => setGoal(i, { status: e.target.value })}>
                    {GOAL_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                </label>
                {canManage && (
                  <>
                    <label className="text-xs text-gray-500">Weight %
                      <input type="number" min={0} max={100} className={inputCls} value={g.weight ?? 0} onChange={(e) => setGoal(i, { weight: Number(e.target.value) })} />
                    </label>
                    <label className="text-xs text-gray-500">Due
                      <input type="date" className={inputCls} value={day(g.dueDate)} onChange={(e) => setGoal(i, { dueDate: e.target.value || null })} />
                    </label>
                  </>
                )}
              </div>
            </div>
          ))}
          {canManage && (
            <button type="button" onClick={() => setGoals([...goals, { title: '', status: 'not_started', progress: 0, weight: 0 }])} className="inline-flex items-center gap-1 text-sm text-gray-600 underline hover:text-black">
              <Plus size={13} /> Add goal
            </button>
          )}
        </section>

        {canManage && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Strengths (one per line)">
              <textarea rows={3} className={inputCls} value={strengths} onChange={(e) => setStrengths(e.target.value)} />
            </Field>
            <Field label="Areas to improve (one per line)">
              <textarea rows={3} className={inputCls} value={improve} onChange={(e) => setImprove(e.target.value)} />
            </Field>
          </div>
        )}

        {/* Performance improvement plan */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Performance improvement plan</h3>
            {canManage && (
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={showPlan} onChange={(e) => setShowPlan(e.target.checked)} /> Plan in place
              </label>
            )}
          </div>
          {!showPlan ? (
            <p className="text-xs text-gray-400">No improvement plan.</p>
          ) : (
            <>
              {canManage ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="text-xs text-gray-500">Status
                    <select className={inputCls} value={plan.status ?? 'planned'} onChange={(e) => setPlan({ ...plan, status: e.target.value as ImprovementPlan['status'] })}>
                      {PIP_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-gray-500">Starts
                    <input type="date" className={inputCls} value={day(plan.startDate)} onChange={(e) => setPlan({ ...plan, startDate: e.target.value || null })} />
                  </label>
                  <label className="text-xs text-gray-500">Ends
                    <input type="date" className={inputCls} value={day(plan.endDate)} onChange={(e) => setPlan({ ...plan, endDate: e.target.value || null })} />
                  </label>
                  <label className="text-xs text-gray-500">Check-ins
                    <input className={inputCls} placeholder="e.g. weekly" value={plan.reviewFrequency ?? ''} onChange={(e) => setPlan({ ...plan, reviewFrequency: e.target.value })} />
                  </label>
                </div>
              ) : (
                <p className="text-xs text-gray-600">
                  {label(plan.status ?? 'planned')} · {day(plan.startDate) || '—'} to {day(plan.endDate) || '—'}
                  {plan.reviewFrequency && ` · check-ins ${plan.reviewFrequency}`}
                </p>
              )}
              {objectives.map((o, i) => (
                <div key={i} className="grid grid-cols-[1fr_6rem_9rem_auto] items-end gap-2">
                  {canManage ? (
                    <input className={inputCls} placeholder="Objective" value={o.title} onChange={(e) => setObjective(i, { title: e.target.value })} />
                  ) : (
                    <p className="text-sm text-gray-800">{o.title}</p>
                  )}
                  <input type="number" min={0} max={100} aria-label="Progress %" className={inputCls} value={o.progress ?? 0} onChange={(e) => setObjective(i, { progress: Number(e.target.value) })} />
                  <select aria-label="Status" className={inputCls} value={o.status ?? 'planned'} onChange={(e) => setObjective(i, { status: e.target.value })}>
                    {OBJECTIVE_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                  {canManage ? (
                    <button type="button" onClick={() => setPlan({ ...plan, objectives: objectives.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove objective">
                      <X size={14} />
                    </button>
                  ) : <span />}
                </div>
              ))}
              {canManage && (
                <button type="button" onClick={() => setPlan({ ...plan, objectives: [...objectives, { title: '', status: 'planned', progress: 0 }] })} className="inline-flex items-center gap-1 text-sm text-gray-600 underline hover:text-black">
                  <Plus size={13} /> Add objective
                </button>
              )}
              {canManage && (
                <Field label="Plan outcome / notes">
                  <textarea rows={2} className={inputCls} value={plan.outcome ?? ''} onChange={(e) => setPlan({ ...plan, outcome: e.target.value })} />
                </Field>
              )}
            </>
          )}
        </section>
      </div>
    </ModalShell>
  )
}
