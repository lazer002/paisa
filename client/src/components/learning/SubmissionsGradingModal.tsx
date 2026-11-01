import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import {
  useGetSubmissionsQuery,
  useGradeSubmissionMutation,
  type Assignment,
  type Submission,
} from '@/features/assignments/assignmentsApi'
import { rid } from '@/features/users/usersApi'
import Modal from '@/components/ui/Modal'
import { FileLink } from '@/components/ui/FileUpload'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'

const errorMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

interface GradeFormProps {
  submission: Submission
  maxScore: number
}

/** Score + feedback for one submission. Re-grading an already graded one is allowed. */
function GradeForm({ submission, maxScore }: GradeFormProps) {
  const [gradeSubmission, { isLoading }] = useGradeSubmissionMutation()
  const [score, setScore] = useState(submission.score != null ? String(submission.score) : '')
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    const value = Number(score)
    if (score.trim() === '' || !Number.isFinite(value) || value < 0 || value > maxScore) {
      setError(`Score must be between 0 and ${maxScore}`)
      return
    }
    try {
      await gradeSubmission({ id: rid(submission), score: value, feedback: feedback.trim() || undefined }).unwrap()
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err, 'Failed to save grade'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Score (max {maxScore})</label>
          <input
            type="number"
            min={0}
            max={maxScore}
            step="any"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Optional comments for the student"
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-emerald-700">Grade saved</span>}
        <Button size="sm" type="submit" loading={isLoading}>
          {submission.status === 'graded' ? 'Update grade' : 'Save grade'}
        </Button>
      </div>
    </form>
  )
}

interface SubmissionsGradingModalProps {
  assignment: Assignment | null
  onClose: () => void
}

/** Lists one assignment's submissions and lets a grader score each of them. */
export default function SubmissionsGradingModal({ assignment, onClose }: SubmissionsGradingModalProps) {
  const maxScore = assignment?.maxScore ?? 100
  const { data: submissions, isLoading, isError, refetch } = useGetSubmissionsQuery(
    assignment ? { assignmentId: rid(assignment) } : undefined,
    { skip: !assignment },
  )

  const gradedCount = (submissions ?? []).filter((s) => s.status === 'graded').length

  return (
    <Modal open={!!assignment} onClose={onClose} title={`Submissions — ${assignment?.title ?? ''}`} size="xl">
      {isLoading ? (
        <LoadingList rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !submissions?.length ? (
        <EmptyState
          icon={<ClipboardCheck size={40} />}
          title="No submissions yet"
          hint="Student work will appear here once they submit"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {gradedCount} of {submissions.length} graded · max score {maxScore}
          </p>
          {submissions.map((s) => {
            const student = typeof s.studentId === 'object' ? s.studentId : null
            return (
              <div key={rid(s)} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{student?.name ?? 'Student'}</p>
                    <p className="text-xs text-gray-400">
                      {student?.email ?? ''}
                      {s.submittedAt ? ` · submitted ${new Date(s.submittedAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <Badge color={s.status === 'graded' ? 'green' : 'blue'}>
                    {s.status === 'graded' ? `Graded: ${s.score}/${maxScore}` : 'Awaiting grade'}
                  </Badge>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {s.content || 'No text submitted'}
                </p>
                {!!s.attachments?.length && (
                  <ul className="mt-2 space-y-1">
                    {s.attachments.map((att, i) => (
                      <li key={`${att.url}-${i}`} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="truncate">{att.name || 'Attachment'}</span>
                        <FileLink url={att.url} fileName={att.name ?? undefined}
                          className="font-medium text-black hover:underline" />
                      </li>
                    ))}
                  </ul>
                )}
                {s.status === 'graded' && s.feedback && (
                  <p className="mt-2 text-xs text-gray-500">Feedback: {s.feedback}</p>
                )}
                <GradeForm
                  key={rid(s)}
                  submission={s}
                  maxScore={maxScore}
                />
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
