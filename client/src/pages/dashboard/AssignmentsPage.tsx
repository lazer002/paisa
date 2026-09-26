import { useState } from 'react'
import { BookOpen, Plus, Trash2, Star, Send } from 'lucide-react'
import {
  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
  useDeleteAssignmentMutation,
} from '@/features/assignments/assignmentsApi'
import {
  useGetSubmissionsQuery,
  useSubmitAssignmentMutation,
  useGradeSubmissionMutation,
} from '@/features/assignments/assignmentsApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

export default function AssignmentsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const canCreate = ['super_admin', 'admin', 'teacher'].includes(role ?? '')
  const isStudent = role === 'student'

  const { data: assignments, isLoading, isError, refetch } = useGetAssignmentsQuery()
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canCreate })
  const { data: submissions } = useGetSubmissionsQuery(undefined, { skip: !isStudent })

  const [createAssignment, { isLoading: createPending }] = useCreateAssignmentMutation()
  const [deleteAssignment] = useDeleteAssignmentMutation()
  const [submitAssignment, { isLoading: submitPending }] = useSubmitAssignmentMutation()
  const [gradeSubmission] = useGradeSubmissionMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxScore, setMaxScore] = useState('100')

  const [submitFor, setSubmitFor] = useState<any>(null)
  const [submissionText, setSubmissionText] = useState('')

  const mySubmissionFor = (assignmentId: string) =>
    (submissions ?? []).find((s: any) =>
      (typeof s.assignmentId === 'object' ? s.assignmentId?._id : s.assignmentId) === assignmentId,
    )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createAssignment({
        classId, title, description, dueDate: dueDate || undefined, maxScore: Number(maxScore) || 100,
      }).unwrap()
      setShowCreate(false)
      setTitle(''); setDescription(''); setDueDate('')
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to create assignment')
    }
  }

  const handleGrade = async (sub: any, score: number) => {
    try {
      await gradeSubmission({ id: sub._id, score }).unwrap()
    } catch { /* errors surface via list refresh */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStudent ? 'My Assignments' : 'Assignments'}
        subtitle={isStudent ? 'Submit your work before the deadline' : 'Create assignments and grade submissions'}
        actions={canCreate ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Assignment</Button> : undefined}
      />

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !assignments?.length ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="No assignments yet"
          hint={canCreate ? 'Create the first assignment for a class' : 'Assignments will appear here'}
          action={canCreate ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Assignment</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const clsName = typeof a.classId === 'object' ? a.classId?.name : '—'
            const sub = isStudent ? mySubmissionFor(a._id) : null
            const overdue = a.dueDate && new Date(a.dueDate) < new Date()

            return (
              <div key={a._id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      {overdue && <Badge color="red">Overdue</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {clsName} · {a.maxScore ?? 100} points
                      {a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                    </p>
                    {a.description && <p className="mt-2 text-sm text-gray-600">{a.description}</p>}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {isStudent && (
                      sub ? (
                        <Badge color={sub.status === 'graded' ? 'green' : 'blue'}>
                          {sub.status === 'graded' ? `Graded: ${sub.score}/${a.maxScore ?? 100}` : 'Submitted'}
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => { setSubmitFor(a); setSubmissionText('') }}>
                          <Send size={13} /> Submit
                        </Button>
                      )
                    )}
                    {canCreate && (
                      <button onClick={() => deleteAssignment(a._id)}
                        className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Assignment" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Class *</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
              <option value="">— Select class —</option>
              {(classes ?? []).map((c) => (
                <option key={c._id} value={c._id}>{c.name} · {c.subject}</option>
              ))}
            </select>
            {(classes ?? []).length === 0 && (
              <p className="mt-1 text-xs text-amber-600">Create a class first on the Classes page.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Chapter 5 Exercises"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max score</label>
              <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createPending}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Submit modal (students) */}
      <Modal open={!!submitFor} onClose={() => setSubmitFor(null)} title={`Submit — ${submitFor?.title ?? ''}`} size="md">
        <form onSubmit={async (e) => {
          e.preventDefault()
          try {
            await submitAssignment({ assignmentId: submitFor._id, content: submissionText }).unwrap()
            setSubmitFor(null)
          } catch (e: any) {
            alert(e?.data?.message ?? 'Failed to submit')
          }
        }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Your work *</label>
            <textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} required rows={6}
              placeholder="Paste your answer or describe your work..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={() => setSubmitFor(null)}>Cancel</Button>
            <Button type="submit" loading={submitPending}><Send size={14} /> Submit Work</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
