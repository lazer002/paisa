import { useMemo, useState } from 'react'
import { Plus, Trash2, ClipboardList, Send, Check } from 'lucide-react'

import {
  useGetTestsQuery,
  useCreateTestMutation,
  useDeleteTestMutation,
  useUpdateTestMutation,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useDeleteQuestionMutation,
  useGetAttemptsQuery,
  useGradeAttemptMutation,
  type SchoolTest,
  type TestAttempt,
} from '@/features/assessment/assessmentApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, SelectFilter, StatusBadge, Tabs, SectionCard, ModalShell, Field, inputCls, Toast,
  type Column,
} from '@/components/ui/kit'

type TabId = 'tests' | 'questions' | 'grading'

const QUESTION_TYPES = ['single_choice', 'true_false', 'short_answer', 'numeric']

export default function TestsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const isStaff = ['super_admin', 'admin', 'teacher'].includes(role ?? '')
  const isStudent = role === 'student'

  const [tab, setTab] = useState<TabId>('tests')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: tests, isLoading, isError, refetch } = useGetTestsQuery()
  const { data: questions } = useGetQuestionsQuery(undefined, { skip: !isStaff })
  const { data: attempts } = useGetAttemptsQuery(undefined, { skip: !isStaff })
  const { data: classes } = useGetClassesQuery(undefined, { skip: !isStaff })

  const [createTest] = useCreateTestMutation()
  const [updateTest] = useUpdateTestMutation()
  const [deleteTest] = useDeleteTestMutation()
  const [createQuestion] = useCreateQuestionMutation()
  const [deleteQuestion] = useDeleteQuestionMutation()
  const [gradeAttempt] = useGradeAttemptMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)

  // ── Create test form ──
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState('')
  const [type, setType] = useState('quiz')
  const [duration, setDuration] = useState('30')
  const [totalPoints, setTotalPoints] = useState('100')
  const [passingScore, setPassingScore] = useState('40')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

  // ── Create question form ──
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState('single_choice')
  const [qPoints, setQPoints] = useState('1')
  const [qOptions, setQOptions] = useState<string[]>(['', ''])
  const [qCorrect, setQCorrect] = useState('0')

  const resetTestForm = () => {
    setTitle(''); setClassId(''); setType('quiz'); setDuration('30')
    setTotalPoints('100'); setPassingScore('40'); setSelectedQuestions([])
  }

  const handleCreateTest = async () => {
    if (!title) return
    try {
      await createTest({
        title,
        classId: classId || undefined,
        type,
        durationMinutes: Number(duration) || 30,
        totalPoints: Number(totalPoints) || 100,
        passingScore: Number(passingScore) || 40,
        questionIds: selectedQuestions,
      }).unwrap()
      setShowCreate(false)
      resetTestForm()
      setToast({ msg: 'Test created as draft', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create test', tone: 'critical' })
    }
  }

  const handleCreateQuestion = async () => {
    if (!qText) return
    try {
      await createQuestion({
        text: qText,
        type: qType,
        points: Number(qPoints) || 1,
        status: 'published',
        options:
          qType === 'single_choice'
            ? qOptions.filter(Boolean).map((text, i) => ({ text, isCorrect: String(i) === qCorrect }))
            : [],
        correctAnswer:
          qType === 'single_choice'
            ? qOptions[Number(qCorrect)] ?? null
            : qType === 'true_false'
              ? 'true'
              : null,
      }).unwrap()
      setShowQuestion(false)
      setQText(''); setQOptions(['', '']); setQCorrect('0')
      setToast({ msg: 'Question added to bank', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create question', tone: 'critical' })
    }
  }

  const publish = async (t: SchoolTest) => {
    try {
      await updateTest({ id: rid(t), payload: { status: 'published' } }).unwrap()
      setToast({ msg: `"${t.title}" is now live for students`, tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to publish', tone: 'critical' })
    }
  }

  const remove = async (t: SchoolTest) => {
    try {
      await deleteTest(rid(t)).unwrap()
      setToast({ msg: 'Test deleted', tone: 'success' })
    } catch {
      setToast({ msg: 'Failed to delete test', tone: 'critical' })
    }
  }

  const grade = async (a: TestAttempt, score: number) => {
    try {
      await gradeAttempt({ id: a.publicId ?? a._id, score }).unwrap()
      setToast({ msg: 'Attempt graded', tone: 'success' })
    } catch {
      setToast({ msg: 'Failed to grade', tone: 'critical' })
    }
  }

  const filteredTests = useMemo(
    () =>
      (tests ?? []).filter(
        (t) =>
          (!statusFilter || t.status === statusFilter) &&
          (!search || t.title.toLowerCase().includes(search.toLowerCase())),
      ),
    [tests, search, statusFilter],
  )

  const pendingGrading = (attempts ?? []).filter((a) => a.status === 'submitted')

  // ── Table columns ──
  const testColumns: Column<SchoolTest>[] = [
    {
      key: 'title',
      header: 'Test',
      render: (t) => (
        <div>
          <p className="font-medium text-gray-900">{t.title}</p>
          <p className="text-xs text-gray-400">
            {typeof t.classId === 'object' ? t.classId?.name ?? '—' : 'No class'} · {t.type.replace('_', ' ')}
          </p>
        </div>
      ),
    },
    { key: 'questions', header: 'Questions', render: (t) => <span className="text-gray-500">{(t.questionIds as unknown[])?.length ?? 0}</span> },
    { key: 'points', header: 'Points', render: (t) => <span className="text-gray-500">{t.grading?.totalPoints ?? '—'}</span> },
    { key: 'duration', header: 'Duration', render: (t) => <span className="text-gray-500">{t.schedule?.durationMinutes ?? 30} min</span> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) =>
        isStaff && (
          <div className="flex justify-end gap-1.5">
            {t.status === 'draft' && (
              <button
                onClick={(e) => { e.stopPropagation(); publish(t) }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                title="Publish to students"
              >
                <Send size={12} /> Publish
              </button>
            )}
            {['super_admin', 'admin'].includes(role ?? '') && (
              <button
                onClick={(e) => { e.stopPropagation(); remove(t) }}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ),
    },
  ]

  const questionColumns: Column<{ _id: string; publicId?: string; text: string; type: string; points?: number; difficulty: string }>[] = [
    { key: 'text', header: 'Question', render: (q) => <p className="max-w-md truncate text-gray-800">{q.text}</p> },
    { key: 'type', header: 'Type', render: (q) => <span className="text-gray-500">{q.type.replace(/_/g, ' ')}</span> },
    { key: 'points', header: 'Points', render: (q) => <span className="text-gray-500">{q.points ?? 1}</span> },
    { key: 'difficulty', header: 'Difficulty', render: (q) => <StatusBadge status={q.difficulty} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (q) => (
        <button
          onClick={() => deleteQuestion(q.publicId ?? q._id)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  const attemptColumns: Column<TestAttempt>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (a) => (typeof a.studentId === 'object' ? a.studentId?.name ?? '—' : '—'),
    },
    {
      key: 'test',
      header: 'Test',
      render: (a) => (typeof a.testId === 'object' ? a.testId?.title ?? '—' : '—'),
    },
    {
      key: 'score',
      header: 'Score',
      render: (a) =>
        a.score ? (
          <span className={a.score.passed ? 'font-medium text-emerald-700' : 'font-medium text-rose-600'}>
            {a.score.earned}/{a.score.total} ({a.score.percentage}%)
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) =>
        a.status === 'submitted' ? (
          <button
            onClick={() => grade(a, a.score?.total ?? 0)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            title="Accept auto-grade and finalize"
          >
            <Check size={12} /> Finalize
          </button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={isStudent ? 'My Tests' : 'Tests & Assessments'}
        subtitle={isStudent ? 'Published tests for your classes' : 'Build tests from the question bank and grade attempts'}
        actions={isStaff ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowQuestion(true)}><Plus size={15} /> Question</Button>
            <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Test</Button>
          </div>
        ) : undefined}
      />

      <Tabs<TabId>
        tabs={[
          { id: 'tests', label: 'Tests', count: tests?.length },
          ...(isStaff ? [{ id: 'questions' as TabId, label: 'Question Bank', count: questions?.length }] : []),
          ...(isStaff ? [{ id: 'grading' as TabId, label: 'Grading', count: pendingGrading.length }] : []),
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'tests' && (
        <>
          <Toolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search tests..."
            filters={
              <SelectFilter
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            }
          />
          <DataTable
            columns={testColumns}
            rows={filteredTests}
            keyOf={(t) => rid(t)}
            loading={isLoading}
            error={isError}
            onRetry={refetch}
            emptyTitle="No tests yet"
            emptyHint={isStaff ? 'Create a test, attach questions from the bank, then publish it' : 'Published tests will appear here'}
            emptyAction={isStaff ? <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Test</Button> : undefined}
          />
        </>
      )}

      {tab === 'questions' && isStaff && (
        <DataTable
          columns={questionColumns}
          rows={questions}
          keyOf={(q) => q.publicId ?? q._id}
          emptyTitle="Question bank is empty"
          emptyHint="Add questions first, then attach them to tests"
          emptyAction={<Button onClick={() => setShowQuestion(true)}><Plus size={15} /> Add Question</Button>}
        />
      )}

      {tab === 'grading' && isStaff && (
        <DataTable
          columns={attemptColumns}
          rows={attempts}
          keyOf={(a) => a.publicId ?? a._id}
          emptyTitle="No attempts yet"
          emptyHint="Student attempts will appear here for grading"
        />
      )}

      {/* Create test */}
      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Test"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateTest}>Create Draft</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 3 — Algebra" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">— None —</option>
                {(classes ?? []).map((c) => (
                  <option key={rid(c)} value={rid(c)}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {['quiz', 'class_test', 'unit_test', 'mock_exam', 'practice_test'].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Duration (min)">
              <input type="number" className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field>
            <Field label="Passing score">
              <input type="number" className={inputCls} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
            </Field>
          </div>
          <Field label="Attach questions">
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {(questions ?? []).length === 0 && (
                <p className="p-2 text-xs text-gray-400">Question bank is empty — add questions first.</p>
              )}
              {(questions ?? []).map((q) => {
                const id = q.publicId ?? q._id
                const checked = selectedQuestions.includes(id)
                return (
                  <label key={id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedQuestions((prev) => (checked ? prev.filter((x) => x !== id) : [...prev, id]))
                      }
                      className="mt-0.5"
                    />
                    <span className="line-clamp-1 text-gray-700">{q.text}</span>
                    <span className="ml-auto flex-shrink-0 text-xs text-gray-400">{q.points ?? 1}p</span>
                  </label>
                )
              })}
            </div>
          </Field>
          <p className="text-xs text-gray-400">
            Total points: {(questions ?? [])
              .filter((q) => selectedQuestions.includes(q.publicId ?? q._id))
              .reduce((sum, q) => sum + (q.points ?? 1), 0)}
          </p>
        </div>
      </ModalShell>

      {/* Create question */}
      <ModalShell
        open={showQuestion}
        onClose={() => setShowQuestion(false)}
        title="New Question"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowQuestion(false)}>Cancel</Button>
            <Button onClick={handleCreateQuestion}>Add to Bank</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Question text" required>
            <textarea className={inputCls} rows={3} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="What is the derivative of x²?" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className={inputCls} value={qType} onChange={(e) => setQType(e.target.value)}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Points">
              <input type="number" className={inputCls} value={qPoints} onChange={(e) => setQPoints(e.target.value)} />
            </Field>
          </div>
          {qType === 'single_choice' && (
            <Field label="Options (mark the correct one)" required>
              <div className="space-y-2">
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={qCorrect === String(i)}
                      onChange={() => setQCorrect(String(i))}
                      className="flex-shrink-0"
                    />
                    <input
                      className={inputCls}
                      value={opt}
                      onChange={(e) =>
                        setQOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))
                      }
                      placeholder={`Option ${i + 1}`}
                    />
                  </div>
                ))}
                {qOptions.length < 6 && (
                  <button type="button" onClick={() => setQOptions((p) => [...p, ''])} className="text-xs font-medium text-gray-500 hover:text-gray-800">
                    + Add option
                  </button>
                )}
              </div>
            </Field>
          )}
          {qType === 'true_false' && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Correct answer is recorded as “true”.</p>
          )}
          {['short_answer', 'numeric'].includes(qType) && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Answer is graded manually after submission.</p>
          )}
        </div>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
