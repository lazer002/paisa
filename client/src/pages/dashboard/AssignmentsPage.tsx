import { useState } from 'react'
import { BookOpen, Plus, Trash2, Send, Pencil, ClipboardCheck } from 'lucide-react'
import {
  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  type Assignment,
  type Submission,
} from '@/features/assignments/assignmentsApi'
import {
  useGetSubmissionsQuery,
  useSubmitAssignmentMutation,
} from '@/features/assignments/assignmentsApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'
import SubmissionsGradingModal from '@/components/learning/SubmissionsGradingModal'
import FileUpload from '@/components/ui/FileUpload'
import type { StoredFile } from '@/lib/api/files'

export default function AssignmentsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const { can } = usePermission()
  const canCreate = can('assignment:create')
  const canEdit = can('assignment:update')
  // Mirrors PUT /submissions/:id/grade (submission:update).
  const canGrade = can('submission:update')
  const isStudent = role === 'student'

  const { data: assignments, isLoading, isError, refetch } = useGetAssignmentsQuery()
  const { data: classes } = useGetClassesQuery(undefined, { skip: !canCreate })
  // Parents get their linked children's submissions from the same endpoint.
  const isParent = role === 'parent'
  const { data: submissions } = useGetSubmissionsQuery(undefined, { skip: !isStudent && !isParent })

  const [createAssignment, { isLoading: createPending }] = useCreateAssignmentMutation()
  const [updateAssignment, { isLoading: updatePending }] = useUpdateAssignmentMutation()
  const [deleteAssignment] = useDeleteAssignmentMutation()
  const [submitAssignment, { isLoading: submitPending }] = useSubmitAssignmentMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [gradingFor, setGradingFor] = useState<Assignment | null>(null)
  const [error, setError] = useState('')
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxScore, setMaxScore] = useState('100')

  const [submitFor, setSubmitFor] = useState<Assignment | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submissionFile, setSubmissionFile] = useState<StoredFile | null>(null)
  const [uploadingSubmission, setUploadingSubmission] = useState(false)

  const submissionsFor = (assignment: Assignment) =>
    (submissions ?? []).filter((s: Submission) =>
      (typeof s.assignmentId === 'object' ? s.assignmentId?.publicId ?? s.assignmentId?._id : s.assignmentId) === rid(assignment),
    )
  const mySubmissionFor = (assignment: Assignment) => submissionsFor(assignment)[0]

  const resetForm = () => {
    setClassId(''); setTitle(''); setDescription(''); setDueDate(''); setMaxScore('100'); setError('')
  }

  const openCreate = () => {
    resetForm()
    setEditing(null)
    setShowCreate(true)
  }

  const openEdit = (a: Assignment) => {
    setError('')
    setEditing(a)
    setTitle(a.title)
    setDescription(a.description ?? '')
    setDueDate(a.dueDate ? a.dueDate.slice(0, 10) : '')
    setMaxScore(String(a.maxScore ?? 100))
    setShowCreate(true)
  }

  const closeForm = () => {
    setShowCreate(false)
    setEditing(null)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await updateAssignment({
          id: rid(editing),
          payload: { title, description, dueDate: dueDate || null, maxScore: Number(maxScore) || 100 },
        }).unwrap()
      } else {
        await createAssignment({
          classId, title, description, dueDate: dueDate || undefined, maxScore: Number(maxScore) || 100,
        }).unwrap()
      }
      closeForm()
      resetForm()
    } catch (e) {
      setError(
        (e as { data?: { message?: string } })?.data?.message
          ?? (editing ? 'Failed to update assignment' : 'Failed to create assignment'),
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStudent ? 'My Assignments' : 'Assignments'}
        subtitle={isStudent ? 'Submit your work before the deadline' : 'Create assignments and grade submissions'}
        actions={canCreate ? <Button onClick={openCreate}><Plus size={16} /> New Assignment</Button> : undefined}
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
          action={canCreate ? <Button onClick={openCreate}><Plus size={16} /> New Assignment</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const clsName = typeof a.classId === 'object' ? a.classId?.name : '—'
            const sub = isStudent ? mySubmissionFor(a) : null
            const overdue = a.dueDate && new Date(a.dueDate) < new Date()

            return (
              <div key={rid(a)} className="rounded-2xl bg-white p-5 shadow-sm">
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
                        <Button size="sm" onClick={() => { setSubmitFor(a); setSubmissionText(''); setSubmissionFile(null) }}>
                          <Send size={13} /> Submit
                        </Button>
                      )
                    )}
                    {isParent && (() => {
                      const childSubs = submissionsFor(a)
                      return childSubs.length === 0 ? (
                        <Badge color="gray">No submission yet</Badge>
                      ) : (
                        childSubs.map((s: Submission) => (
                          <Badge key={rid(s)} color={s.status === 'graded' ? 'green' : 'blue'}>
                            {typeof s.studentId === 'object' && s.studentId?.name ? `${s.studentId.name}: ` : ''}
                            {s.status === 'graded' ? `Graded ${s.score}/${a.maxScore ?? 100}` : 'Submitted'}
                          </Badge>
                        ))
                      )
                    })()}
                    {canGrade && !isStudent && (
                      <Button size="sm" variant="secondary" onClick={() => setGradingFor(a)}>
                        <ClipboardCheck size={13} /> Submissions
                      </Button>
                    )}
                    {canEdit && (
                      <button onClick={() => openEdit(a)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    {can('assignment:delete') && (
                      <button onClick={() => deleteAssignment(rid(a))}
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

      {/* Create / edit modal */}
      <Modal open={showCreate} onClose={closeForm} title={editing ? 'Edit Assignment' : 'New Assignment'} size="md">
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Class *</label>
            {editing ? (
              <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {typeof editing.classId === 'object' ? editing.classId?.name : '—'}
                <span className="ml-2 text-xs text-gray-400">(the class cannot be changed)</span>
              </p>
            ) : (
              <select value={classId} onChange={(e) => setClassId(e.target.value)} required
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black">
                <option value="">— Select class —</option>
                {(classes ?? []).map((c) => (
                  <option key={rid(c)} value={rid(c)}>{c.name} · {c.subject}</option>
                ))}
              </select>
            )}
            {!editing && (classes ?? []).length === 0 && (
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
              <input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={createPending || updatePending}>{editing ? 'Save changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Grade submissions (graders) */}
      <SubmissionsGradingModal assignment={gradingFor} onClose={() => setGradingFor(null)} />

      {/* Submit modal (students) */}
      <Modal open={!!submitFor} onClose={() => setSubmitFor(null)} title={`Submit — ${submitFor?.title ?? ''}`} size="md">
        <form onSubmit={async (e) => {
          e.preventDefault()
          if (!submitFor) return
          try {
            await submitAssignment({
              assignmentId: rid(submitFor),
              content: submissionText,
              ...(submissionFile ? { attachments: [{ fileId: submissionFile.publicId }] } : {}),
            }).unwrap()
            setSubmissionFile(null)
            setSubmitFor(null)
          } catch (e) {
            alert((e as { data?: { message?: string } })?.data?.message ?? 'Failed to submit')
          }
        }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Your work *</label>
            <textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} required rows={6}
              placeholder="Paste your answer or describe your work..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Attachment (optional)</label>
            <FileUpload purpose="submission" value={submissionFile} onChange={setSubmissionFile}
              onBusyChange={setUploadingSubmission} />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={() => setSubmitFor(null)}>Cancel</Button>
            <Button type="submit" loading={submitPending} disabled={uploadingSubmission}><Send size={14} /> Submit Work</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
