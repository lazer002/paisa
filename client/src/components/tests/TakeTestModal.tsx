import { useEffect, useRef, useState } from 'react'

import {
  useGetTestQuery,
  useSubmitAttemptMutation,
  useRecordAttemptEventMutation,
  type AttemptEventType,
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

  // ── Time limit: a countdown from the server's deadline; at zero the
  // answers so far are submitted automatically.
  const deadline = attempt?.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null
  const [now, setNow] = useState(() => Date.now())
  const autoSubmitted = useRef(false)
  const open = !!test && !!attempt

  useEffect(() => {
    if (!open || !deadline) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open, deadline])

  const remaining = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : null

  // ── Integrity: leaving the page or copying/pasting is reported to the
  // teacher (the student is told on screen).
  const [recordEvent] = useRecordAttemptEventMutation()
  const attemptId = attempt ? (attempt.publicId ?? attempt._id) : ''

  useEffect(() => {
    if (!open || !attemptId) return
    const report = (type: AttemptEventType) => {
      void recordEvent({ id: attemptId, type })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') report('tab_switch')
    }
    // A tab switch also blurs the window; count blur only while the tab stays visible.
    const onBlur = () => {
      if (document.visibilityState === 'visible') report('window_blur')
    }
    const onCopy = () => report('copy')
    const onPaste = () => report('paste')
    const onContextMenu = () => report('right_click')

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [open, attemptId, recordEvent])

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
      const data = (e as { data?: { message?: string; code?: string } })?.data
      if (data?.code === 'TIME_UP') clearDraft(draftKey)
      setError(data?.message ?? 'Could not submit the test. Please try again.')
    }
  }

  // Latest submit for the timer (it closes over the newest answers).
  const submitRef = useRef(submit)
  useEffect(() => {
    submitRef.current = submit
  })

  useEffect(() => {
    if (remaining === 0 && !autoSubmitted.current && questions.length > 0) {
      autoSubmitted.current = true
      void submitRef.current()
    }
  }, [remaining, questions.length])

  const clock =
    remaining === null
      ? null
      : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`

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
            {clock !== null ? (
              <span
                role="timer"
                aria-label="Time left"
                className={`ml-2 rounded-md px-2 py-0.5 font-mono font-semibold ${
                  (remaining ?? 0) <= 60 ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {clock} left
              </span>
            ) : test?.scheduling?.durationMinutes ? ` · ${test.scheduling.durationMinutes} min` : ''}
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
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {deadline ? 'Answers are submitted automatically when the time runs out. ' : ''}
          Switching tabs or windows, copying and pasting are recorded for your teacher.
        </p>
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
