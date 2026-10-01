import { useState } from 'react'
import { Plus, LifeBuoy, Send } from 'lucide-react'

import {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAddTicketMessageMutation,
  type SupportTicket,
} from '@/features/platform/platformApi'
import { rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, SelectFilter, StatusBadge, ModalShell, Field, inputCls, Toast, SectionCard,
  type Column,
} from '@/components/ui/kit'

const STAFF_ROLES = ['super_admin', 'admin', 'hr', 'support']

export default function TicketsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isStaff = STAFF_ROLES.includes(user?.role ?? '')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: tickets, isLoading, isError, refetch } = useGetTicketsQuery()
  const { data: ticketDetail } = useGetTicketQuery(openTicketId!, { skip: !openTicketId })

  const [createTicket] = useCreateTicketMutation()
  const [updateTicket] = useUpdateTicketMutation()
  const [addMessage] = useAddTicketMessageMutation()

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
      await addMessage({ id: openTicketId, body: reply.trim() }).unwrap()
      setReply('')
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
    { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={isStaff ? 'Support Tickets' : 'My Tickets'}
        subtitle={isStaff ? 'Respond to and resolve organization requests' : 'Get help from your organization'}
        actions={<Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Ticket</Button>}
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search tickets..."
        filters={
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
              <span className="ml-auto text-xs text-gray-400">
                {typeof ticketDetail.ticket.requesterId === 'object'
                  ? ticketDetail.ticket.requesterId?.name
                  : ''}
              </span>
            </div>

            <SectionCard title="Conversation" padded={false}>
              <div className="max-h-80 space-y-3 overflow-y-auto p-4">
                {ticketDetail.messages.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">No messages yet</p>
                )}
                {ticketDetail.messages.map((m) => {
                  const isMine = typeof m.authorId === 'object' && m.authorId?._id === user?._id
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          m.isInternalNote
                            ? 'border border-amber-200 bg-amber-50 text-amber-800'
                            : isMine
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {m.isInternalNote && <p className="mb-0.5 text-[10px] font-semibold uppercase">Internal note</p>}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                          {typeof m.authorId === 'object' ? m.authorId?.name : '—'} ·{' '}
                          {new Date(m.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            <div className="flex items-end gap-2">
              <textarea
                className={inputCls}
                rows={2}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
              />
              <Button onClick={sendReply} disabled={!reply.trim()}>
                <Send size={14} /> Send
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

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
