import { useState } from 'react'
import { Plus, LifeBuoy, Send, Trash2, FileText, Lock } from 'lucide-react'

import {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAddTicketMessageMutation,
  useDeleteTicketMutation,
  useGetTicketAssigneesQuery,
  useGetTicketTemplatesQuery,
  type SupportTicket,
  type TicketMessageT,
} from '@/features/platform/platformApi'
import SlaBadge from '@/components/tickets/SlaBadge'
import TicketTemplatesModal from '@/components/tickets/TicketTemplatesModal'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, SelectFilter, StatusBadge, ModalShell, Field, inputCls, Toast, SectionCard,
  type Column,
} from '@/components/ui/kit'

const STAFF_ROLES = ['super_admin', 'admin', 'hr', 'support']
// ticketController.deleteTicket also requires one of these roles on top of ticket:delete
const DELETE_ROLES = ['super_admin', 'admin']
// ticketController: staff read reply templates, these roles manage them
const TEMPLATE_MANAGER_ROLES = ['super_admin', 'admin', 'support']

const isInternalMessage = (m: TicketMessageT) => m.type === 'internal_note' || m.isInternal === true

export default function TicketsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isStaff = STAFF_ROLES.includes(user?.role ?? '')
  const { can } = usePermission()
  const canDelete = can('ticket:delete') && DELETE_ROLES.includes(user?.role ?? '')
  const canAssign = isStaff && can('ticket:update')
  const canUseTemplates = isStaff && (can('ticket:update') || can('ticket:manage'))
  const canManageTemplates = canUseTemplates && TEMPLATE_MANAGER_ROLES.includes(user?.role ?? '')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: tickets, isLoading, isError, refetch } = useGetTicketsQuery(overdueOnly ? { overdue: true } : undefined)
  const { data: ticketDetail } = useGetTicketQuery(openTicketId!, { skip: !openTicketId })
  const { data: assignees } = useGetTicketAssigneesQuery(openTicketId!, { skip: !openTicketId || !canAssign })
  const { data: templates } = useGetTicketTemplatesQuery(undefined, { skip: !openTicketId || !canUseTemplates })

  const insertTemplate = (templateId: string) => {
    const t = (templates ?? []).find((x) => rid(x) === templateId)
    if (!t) return
    setReply((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')}\n\n${t.body}` : t.body))
  }

  const [createTicket] = useCreateTicketMutation()
  const [updateTicket] = useUpdateTicketMutation()
  const [addMessage] = useAddTicketMessageMutation()
  const [deleteTicket] = useDeleteTicketMutation()

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')

  const filtered = (tickets ?? []).filter(
    (t) =>
      (!statusFilter || t.status === statusFilter) &&
      (!search || t.subject.toLowerCase().includes(search.toLowerCase())),
  )

  const submit = async () => {
    if (!subject) return
    try {
      await createTicket({ subject, description: description || undefined, priority }).unwrap()
      setShowCreate(false)
      setSubject(''); setDescription(''); setPriority('normal')
      setToast({ msg: 'Ticket submitted', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create ticket', tone: 'critical' })
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !openTicketId) return
    try {
      await addMessage({ id: openTicketId, body: reply.trim(), isInternal: isStaff && internalNote }).unwrap()
      setReply('')
      if (internalNote) setToast({ msg: 'Internal note added', tone: 'success' })
      setInternalNote(false)
    } catch {
      setToast({ msg: 'Failed to send reply', tone: 'critical' })
    }
  }

  const setStatus = async (t: SupportTicket, status: string) => {
    try {
      await updateTicket({ id: rid(t), status }).unwrap()
      setToast({ msg: `Ticket ${status.replace('_', ' ')}`, tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Update failed', tone: 'critical' })
    }
  }

  const assign = async (ticketId: string, assigneeId: string) => {
    try {
      await updateTicket({ id: ticketId, assigneeId: assigneeId || null }).unwrap()
      setToast({ msg: assigneeId ? 'Ticket assigned' : 'Ticket unassigned', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Assignment failed', tone: 'critical' })
    }
  }

  const removeTicket = async (t: SupportTicket) => {
    if (!window.confirm(`Delete ticket "${t.subject}" and its whole conversation? This cannot be undone.`)) return
    try {
      await deleteTicket(rid(t)).unwrap()
      if (openTicketId === rid(t)) setOpenTicketId(null)
      setToast({ msg: 'Ticket deleted', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Delete failed', tone: 'critical' })
    }
  }

  const columns: Column<SupportTicket>[] = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (t) => (
        <div>
          <p className="font-medium text-gray-900">{t.subject}</p>
          <p className="max-w-sm truncate text-xs text-gray-400">{t.description ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'requester',
      header: 'Requested by',
      render: (t) => (
        <span className="text-gray-500">{typeof t.requesterId === 'object' ? t.requesterId?.name ?? '—' : '—'}</span>
      ),
    },
    ...(isStaff
      ? [{
          key: 'assignee',
          header: 'Assigned to',
          render: (t: SupportTicket) => (
            <span className="text-gray-500">{typeof t.assigneeId === 'object' ? t.assigneeId?.name ?? '—' : '—'}</span>
          ),
        }]
      : []),
    { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    ...(isStaff
      ? [{ key: 'sla', header: 'SLA', render: (t: SupportTicket) => <SlaBadge sla={t.slaState} compact /> }]
      : []),
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-1.5">
          {isStaff && t.status === 'open' && (
            <button
              onClick={(e) => { e.stopPropagation(); setStatus(t, 'resolved') }}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Resolve
            </button>
          )}
          {!isStaff && t.status !== 'closed' && (
            <button
              onClick={(e) => { e.stopPropagation(); setStatus(t, 'closed') }}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); removeTicket(t) }}
              className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
              aria-label="Delete ticket"
              title="Delete ticket"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={isStaff ? 'Support Tickets' : 'My Tickets'}
        subtitle={isStaff ? 'Respond to and resolve organization requests' : 'Get help from your organization'}
        actions={
          <div className="flex gap-2">
            {canManageTemplates && (
              <Button variant="secondary" onClick={() => setShowTemplates(true)}>
                <FileText size={15} /> Templates
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Ticket</Button>
          </div>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search tickets..."
        filters={
          <>
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            {isStaff && (
              <SelectFilter
                label="SLA"
                value={overdueOnly ? 'overdue' : ''}
                onChange={(v) => setOverdueOnly(v === 'overdue')}
                options={[
                  { value: '', label: 'Any SLA' },
                  { value: 'overdue', label: 'Overdue only' },
                ]}
              />
            )}
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        keyOf={(t) => rid(t)}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onRowClick={(t) => setOpenTicketId(rid(t))}
        emptyTitle="No tickets"
        emptyHint="Open a ticket when you need help — your team will respond here"
        emptyAction={<Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Ticket</Button>}
      />

      {/* Thread drawer */}
      <ModalShell
        open={!!openTicketId}
        onClose={() => setOpenTicketId(null)}
        title={ticketDetail?.ticket?.subject ?? 'Ticket'}
        size="lg"
      >
        {ticketDetail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={ticketDetail.ticket.status} />
              <StatusBadge status={ticketDetail.ticket.priority} />
              {canAssign && (
                <select
                  aria-label="Assign ticket"
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-gray-900"
                  value={
                    typeof ticketDetail.ticket.assigneeId === 'object'
                      ? ticketDetail.ticket.assigneeId?.publicId ?? ticketDetail.ticket.assigneeId?._id ?? ''
                      : ticketDetail.ticket.assigneeId ?? ''
                  }
                  onChange={(e) => openTicketId && assign(openTicketId, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {(assignees ?? []).map((a) => (
                    <option key={a._id} value={a.publicId ?? a._id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {typeof ticketDetail.ticket.requesterId === 'object'
                  ? ticketDetail.ticket.requesterId?.name
                  : ''}
              </span>
            </div>

            {isStaff && ticketDetail.ticket.slaState && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <SlaBadge sla={ticketDetail.ticket.slaState} />
                <span>Resolve by {new Date(ticketDetail.ticket.slaState.dueAt).toLocaleString()}</span>
                <span>
                  {ticketDetail.ticket.slaState.firstResponseAt
                    ? `First response ${new Date(ticketDetail.ticket.slaState.firstResponseAt).toLocaleString()}`
                    : ticketDetail.ticket.slaState.responseOverdue
                      ? 'First response overdue'
                      : `Respond by ${new Date(ticketDetail.ticket.slaState.responseDueAt).toLocaleString()}`}
                </span>
              </div>
            )}

            <SectionCard title="Conversation" padded={false}>
              <div className="max-h-80 space-y-3 overflow-y-auto p-4">
                {ticketDetail.messages.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">No messages yet</p>
                )}
                {ticketDetail.messages.map((m) => {
                  const isMine = typeof m.authorId === 'object' && m.authorId?._id === user?._id
                  const internal = isInternalMessage(m)
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          internal
                            ? 'border border-amber-200 bg-amber-50 text-amber-800'
                            : isMine
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {internal && (
                          <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase">
                            <Lock size={10} /> Internal note · staff only
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${isMine && !internal ? 'text-white/60' : 'text-gray-400'}`}>
                          {typeof m.authorId === 'object' ? m.authorId?.name : '—'} ·{' '}
                          {new Date(m.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {isStaff && (
              <div className="flex flex-wrap items-center gap-3">
                {canUseTemplates && (templates ?? []).length > 0 && (
                  <select
                    aria-label="Insert reply template"
                    className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-gray-900"
                    value=""
                    onChange={(e) => insertTemplate(e.target.value)}
                  >
                    <option value="">Insert template…</option>
                    {(templates ?? []).map((t) => (
                      <option key={rid(t)} value={rid(t)}>{t.name}</option>
                    ))}
                  </select>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                  />
                  <Lock size={12} /> Internal note (hidden from requester)
                </label>
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                className={`${inputCls} ${internalNote ? 'bg-amber-50' : ''}`}
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={internalNote ? 'Write an internal note for staff...' : 'Write a reply...'}
              />
              <Button onClick={sendReply} disabled={!reply.trim()}>
                <Send size={14} /> {internalNote ? 'Add note' : 'Send'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-10">
            <LifeBuoy size={24} className="animate-spin text-gray-300" />
          </div>
        )}
      </ModalShell>

      {/* New ticket */}
      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Ticket"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit}>Submit Ticket</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject" required>
            <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of the issue" />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem in detail..." />
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {['low', 'normal', 'high', 'urgent'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
      </ModalShell>

      {canManageTemplates && (
        <TicketTemplatesModal
          open={showTemplates}
          onClose={() => setShowTemplates(false)}
          onToast={(msg, tone) => setToast({ msg, tone })}
        />
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
