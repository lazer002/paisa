import { useState } from 'react'

import {
  useGetTestQuery,
  useSubmitAttemptMutation,
  type SchoolTest,
  type TestAttempt,
  type TestQuestion,
} from '@/features/assessment/assessmentApi'
import Button from '@/components/ui/button'
import { ModalShell, inputCls } from '@/components/ui/kit'

interface TakeTestModalProps {
  test: SchoolTest | null
  attempt: TestAttempt | null
  onClose: () => void
  onSubmitted: (attempt: TestAttempt) => void
}

const OPTION_TYPES = ['single_choice', 'multiple_choice']

// localStorage can be unavailable (private windows, blocked storage).
const readDraft = (key: string): Record<string, string> => {
  if (!key) return {}
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

const writeDraft = (key: string, value: Record<string, string>) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Draft saving is best-effort.
  }
}

const clearDraft = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to clear.
  }
}

/**
 * Student test-taking flow. The attempt is already started;
 * this collects one answer per question and submits them for auto-grading.
 */
export default function TakeTestModal({
  test,
  attempt,
  onClose,
  onSubmitted,
}: TakeTestModalProps) {
  const testId = test ? (test.publicId ?? test._id) : ''
  const { data: full, isLoading } = useGetTestQuery(testId, { skip: !testId })
  const [submitAttempt, { isLoading: submitting }] = useSubmitAttemptMutation()

  // Answers are kept as a draft in this browser so "Save & close" and
  // Resume really do keep them. The parent mounts this component with
  // key=<attempt id>, so state starts fresh for every attempt.
  const draftKey = attempt ? `paisa-test-draft:${attempt.publicId ?? attempt._id}` : ''
  const [answers, setAnswers] = useState<Record<string, string>>(() => readDraft(draftKey))
  const [error, setError] = useState('')

  const changeAnswer = (id: string, value: string) =>
    setAnswers((prev) => {
      const next = { ...prev, [id]: value }
      writeDraft(draftKey, next)
      return next
    })

  const questions = (full?.questionIds ?? []) as TestQuestion[]
  const answered = questions.filter((q) => answers[q.publicId ?? q._id]).length

  const submit = async () => {
    if (!attempt) return
    setError('')
    try {
      const result = await submitAttempt({
        id: attempt.publicId ?? attempt._id,
        answers: questions.map((q) => {
          const id = q.publicId ?? q._id
          return { questionId: id, answer: answers[id] ?? null }
        }),
      }).unwrap()
      clearDraft(draftKey)
      onSubmitted(result)
    } catch (e) {
      const message = (e as { data?: { message?: string } })?.data?.message
      setError(message ?? 'Could not submit the test. Please try again.')
    }
  }

  return (
    <ModalShell
      open={!!test && !!attempt}
      onClose={onClose}
      title={test?.title ?? 'Test'}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-xs text-gray-500">
            {answered}/{questions.length} answered
            {test?.schedule?.durationMinutes ? ` · ${test.schedule.durationMinutes} min` : ''}
          </span>
          <Button variant="secondary" onClick={onClose}>Save &amp; close</Button>
          <Button onClick={submit} disabled={submitting || isLoading || questions.length === 0}>
            {submitting ? 'Submitting…' : 'Submit test'}
          </Button>
        </>
      }
    >
      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        {test?.instructions && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">{test.instructions}</p>
        )}
        {isLoading && <p className="text-sm text-gray-400">Loading questions…</p>}
        {!isLoading && questions.length === 0 && (
          <p className="text-sm text-gray-400">This test has no questions yet.</p>
        )}

        {questions.map((q, index) => {
          const id = q.publicId ?? q._id
          const value = answers[id] ?? ''
          const set = (v: string) => changeAnswer(id, v)

          return (
            <fieldset key={id} className="space-y-2">
              <legend className="text-sm font-medium text-gray-900">
                {index + 1}. {q.text}
                <span className="ml-2 text-xs font-normal text-gray-400">{q.points ?? 1} pt</span>
              </legend>

              {OPTION_TYPES.includes(q.type) &&
                (q.options ?? []).map((opt, i) => (
                  <label key={i} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={id}
                      checked={value === opt.text}
                      onChange={() => set(opt.text)}
                    />
                    {opt.text}
                  </label>
                ))}

              {q.type === 'true_false' &&
                ['true', 'false'].map((v) => (
                  <label key={v} className="flex cursor-pointer items-center gap-2 text-sm capitalize text-gray-700">
                    <input type="radio" name={id} checked={value === v} onChange={() => set(v)} />
                    {v}
                  </label>
                ))}

              {!OPTION_TYPES.includes(q.type) && q.type !== 'true_false' && (
                <input
                  className={inputCls}
                  type={q.type === 'numeric' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="Your answer"
                />
              )}
            </fieldset>
          )
        })}

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </ModalShell>
  )
}
