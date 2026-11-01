import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, MessageSquare, Users, Plus, ArrowLeft, Pencil, Trash2, UserPlus, LogOut } from 'lucide-react'

import {
  useGetConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupConversationMutation,
  useMarkConversationReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useAddConversationParticipantsMutation,
  useLeaveConversationMutation,
  type Conversation,
  type ChatMessage,
} from '@/features/messaging/messagingApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'
import { useConversationRealtime, useRealtimeEvent } from '@/lib/realtime'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  ModalShell, Field, inputCls, Toast, StatusBadge,
} from '@/components/ui/kit'

function otherPartyName(c: Conversation, myId?: string): string {
  if (c.type === 'group') return c.title ?? 'Group'
  const view = c.participantView ?? c.participants ?? []
  for (const p of view) {
    const u = typeof p.userId === 'object' ? p.userId : null
    if (u && u._id && myId && u._id !== myId) return u.name ?? 'Member'
    if (u && !myId) return u.name ?? 'Member'
  }
  return c.title ?? 'Conversation'
}

// Server rule (messageController): only the sender may edit; the sender or an
// admin/super_admin may delete. No time window.
const MESSAGE_MODERATOR_ROLES = ['super_admin', 'admin']

const errMsg = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

function participantIds(c: Conversation): Set<string> {
  const ids = new Set<string>()
  for (const p of c.participantView ?? c.participants ?? []) {
    if (p.status && p.status !== 'active') continue
    if (typeof p.userId === 'object' && p.userId) {
      ids.add(p.userId._id)
      if (p.userId.publicId) ids.add(p.userId.publicId)
    } else if (typeof p.userId === 'string') {
      ids.add(p.userId)
    }
  }
  return ids
}

export default function MessagesPage() {
  const user = useAppSelector((s) => s.auth.user)
  const myId = user?._id
  const { can } = usePermission()
  const canEditMessages = can('message:update')
  const canDeleteMessages = can('message:delete')
  const canUpdateConversation = can('conversation:update')
  const isModerator = MESSAGE_MODERATOR_ROLES.includes(user?.role ?? '')

  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showGroup, setShowGroup] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: conversations, isLoading, isError, refetch } = useGetConversationsQuery()
  const { data: messages } = useGetMessagesQuery(
    { conversationId: activeId! },
    { skip: !activeId },
  )

  const [createDirect] = useCreateDirectConversationMutation()
  const [submitCreateGroup] = useCreateGroupConversationMutation()
  const [markRead] = useMarkConversationReadMutation()
  const [sendMessage] = useSendMessageMutation()
  const [editMessage, { isLoading: savingEdit }] = useEditMessageMutation()
  const [deleteMessage] = useDeleteMessageMutation()
  const [addParticipants, { isLoading: addingMembers }] = useAddConversationParticipantsMutation()
  const [leaveConversation] = useLeaveConversationMutation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [newMembers, setNewMembers] = useState<string[]>([])

  // user directory for "new chat" — only fetchable by managers; others pick from existing threads
  const canBrowseUsers = ['super_admin', 'admin', 'hr', 'principal', 'teacher', 'counselor', 'support'].includes(user?.role ?? '')
  const { data: users } = useGetUsersQuery(undefined, { skip: !canBrowseUsers })

  const [directUserId, setDirectUserId] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [groupMembers, setGroupMembers] = useState<string[]>([])

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const sorted = useMemo(
    () =>
      [...(conversations ?? [])].sort(
        (a, b) =>
          new Date(b.lastActivityAt ?? b.createdAt).getTime() -
          new Date(a.lastActivityAt ?? a.createdAt).getTime(),
      ),
    [conversations],
  )

  const active = sorted.find((c) => (c.publicId ?? c._id) === activeId) ?? null

  // Live updates: join the open conversation's room; messages arrive through
  // the RTK Query cache (lib/realtime/cacheSync), typing state comes from here.
  const { typingLabel, notifyTyping, stopTyping } = useConversationRealtime(activeId, [user?.publicId, user?._id])

  // Keep the open thread read while new messages from others stream in.
  useRealtimeEvent<{ conversationId?: string; message?: ChatMessage }>('message:new', (push) => {
    if (!activeId || push?.conversationId !== activeId || !push.message) return
    const sender = push.message.senderId
    const senderId = typeof sender === 'object' && sender ? sender._id : sender
    if (senderId && senderId !== myId) markRead(activeId)
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  useEffect(() => {
    if (activeId && (active?.myUnreadCount ?? 0) > 0) {
      markRead(activeId)
    }
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const text = draft.trim()
    if (!text || !activeId) return
    stopTyping()
    try {
      await sendMessage({ conversationId: activeId, text }).unwrap()
      setDraft('')
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to send', tone: 'critical' })
    }
  }

  const startDirect = async () => {
    if (!directUserId) return
    try {
      const conv = await createDirect({ userId: directUserId }).unwrap()
      setShowNew(false)
      setDirectUserId('')
      setActiveId(conv.publicId ?? conv._id)
      setToast({ msg: 'Chat ready', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to start chat', tone: 'critical' })
    }
  }

  const msgId = (m: ChatMessage) => m.publicId ?? m._id

  const startEdit = (m: ChatMessage) => {
    setEditingId(msgId(m))
    setEditText(m.text)
  }

  const saveEdit = async () => {
    const text = editText.trim()
    if (!text || !editingId || !activeId) return
    try {
      await editMessage({ id: editingId, conversationId: activeId, text }).unwrap()
      setEditingId(null)
      setEditText('')
    } catch (e: unknown) {
      setToast({ msg: errMsg(e, 'Failed to edit message'), tone: 'critical' })
    }
  }

  const removeMessage = async (m: ChatMessage) => {
    if (!activeId) return
    if (!window.confirm('Delete this message? It will be removed for everyone.')) return
    try {
      await deleteMessage({ id: msgId(m), conversationId: activeId }).unwrap()
      if (editingId === msgId(m)) setEditingId(null)
      setToast({ msg: 'Message deleted', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: errMsg(e, 'Failed to delete message'), tone: 'critical' })
    }
  }

  const submitAddMembers = async () => {
    if (!activeId || newMembers.length === 0) return
    try {
      await addParticipants({ id: activeId, userIds: newMembers }).unwrap()
      setShowAddMembers(false)
      setNewMembers([])
      setToast({ msg: 'Members added', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: errMsg(e, 'Failed to add members'), tone: 'critical' })
    }
  }

  const leaveActive = async () => {
    if (!activeId || !active) return
    if (!window.confirm(`Leave "${otherPartyName(active, myId)}"? You will stop receiving its messages.`)) return
    try {
      await leaveConversation(activeId).unwrap()
      setActiveId(null)
      setToast({ msg: 'You left the conversation', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: errMsg(e, 'Failed to leave conversation'), tone: 'critical' })
    }
  }

  const createGroup = async () => {
    if (!groupTitle.trim() || groupMembers.length === 0) return
    try {
      const conv = await submitCreateGroup({ title: groupTitle.trim(), participantIds: groupMembers }).unwrap()
      setShowGroup(false)
      setGroupTitle(''); setGroupMembers([])
      setActiveId(conv.publicId ?? conv._id)
      setToast({ msg: 'Group created', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create group', tone: 'critical' })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        subtitle="Direct messages and group chats within your organization"
        actions={
          <div className="flex gap-2">
            {canBrowseUsers && (
              <Button variant="secondary" onClick={() => setShowNew(true)}>
                <Plus size={15} /> New Chat
              </Button>
            )}
            {canBrowseUsers && (
              <Button onClick={() => setShowGroup(true)}>
                <Users size={15} /> New Group
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className={`rounded-xl border border-gray-200 bg-white ${activeId ? 'hidden lg:block' : ''}`}>
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-700">Chats</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Loading chats...</p>
            )}
            {isError && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">Could not load chats</p>
                <Button variant="secondary" className="mt-2" onClick={() => refetch()}>Retry</Button>
              </div>
            )}
            {!isLoading && sorted.length === 0 && (
              <div className="px-4 py-10 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No conversations yet</p>
                {canBrowseUsers && (
                  <Button variant="secondary" className="mt-3" onClick={() => setShowNew(true)}>
                    <Plus size={14} /> Start one
                  </Button>
                )}
              </div>
            )}
            {sorted.map((c) => {
              const id = c.publicId ?? c._id
              const isActive = id === activeId
              const unread = c.myUnreadCount ?? 0
              return (
                <button
                  key={id}
                  onClick={() => { setActiveId(id); setEditingId(null) }}
                  className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition ${
                    isActive ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-xs font-bold text-white">
                    {otherPartyName(c, myId).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {otherPartyName(c, myId)}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {c.lastMessage?.preview ?? (c.type === 'group' ? `${c.participants?.length ?? 0} members` : 'Say hello 👋')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex flex-col rounded-xl border border-gray-200 bg-white ${!activeId ? 'hidden lg:flex' : 'flex'}`}>
          {!activeId && (
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <MessageSquare size={40} className="mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">Select a conversation</p>
              <p className="mt-1 text-xs text-gray-400">Your messages stay inside your organization</p>
            </div>
          )}

          {active && (
            <>
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5">
                <button
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{otherPartyName(active, myId)}</p>
                  <p className="text-xs text-gray-400">
                    {active.type === 'group'
                      ? `${active.participants?.length ?? 0} members`
                      : 'Direct message'}
                  </p>
                </div>
                {active.type === 'group' && <StatusBadge status={active.status} />}
                {active.type === 'group' && canUpdateConversation && (
                  <div className="ml-auto flex gap-1.5">
                    {canBrowseUsers && (
                      <Button variant="secondary" size="sm" onClick={() => { setNewMembers([]); setShowAddMembers(true) }}>
                        <UserPlus size={14} /> Add
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={leaveActive}>
                      <LogOut size={14} /> Leave
                    </Button>
                  </div>
                )}
              </div>

              <div className="max-h-[55vh] min-h-[320px] flex-1 space-y-3 overflow-y-auto bg-gray-50/40 p-4">
                {messages?.length === 0 && (
                  <p className="py-10 text-center text-sm text-gray-400">No messages yet — start the conversation</p>
                )}
                {(messages ?? []).map((m) => {
                  const sender = typeof m.senderId === 'object' ? m.senderId : null
                  // getMessages does not populate senderId, so it is usually the raw id string
                  const senderId = sender ? sender._id : (m.senderId as string | undefined)
                  const isMine = senderId ? senderId === myId : m.senderName === user?.name
                  const canEditThis = isMine && canEditMessages
                  const canDeleteThis = (isMine || isModerator) && canDeleteMessages
                  const isEditing = editingId === msgId(m)
                  return (
                    <div key={msgId(m)} className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[75%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm ${
                            isMine ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 ring-1 ring-gray-100'
                          } ${isEditing ? 'w-full min-w-[240px]' : ''}`}
                        >
                          {!isMine && active.type === 'group' && (
                            <p className="mb-0.5 text-[10px] font-semibold text-sky-600">{m.senderName ?? sender?.name}</p>
                          )}
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                className={`${inputCls} text-gray-900`}
                                rows={2}
                                value={editText}
                                autoFocus
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                                  if (e.key === 'Escape') setEditingId(null)
                                }}
                              />
                              <div className="flex justify-end gap-1.5">
                                <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                                <Button size="sm" onClick={saveEdit} disabled={!editText.trim() || savingEdit}>Save</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          )}
                          <p className={`mt-1 text-[10px] ${isMine ? 'text-white/50' : 'text-gray-300'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {m.editedAt ? ' · edited' : ''}
                          </p>
                        </div>
                        {!isEditing && (canEditThis || canDeleteThis) && (
                          <div className="mt-0.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                            {canEditThis && (
                              <button
                                onClick={() => startEdit(m)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Edit message"
                                title="Edit"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                            {canDeleteThis && (
                              <button
                                onClick={() => removeMessage(m)}
                                className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                aria-label="Delete message"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <p className="h-5 px-4 pt-1 text-xs italic text-gray-400" aria-live="polite">
                {typingLabel ?? ''}
              </p>

              <div className="flex items-end gap-2 border-t border-gray-100 p-3">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    if (e.target.value.trim()) notifyTyping()
                    else stopTyping()
                  }}
                  onBlur={stopTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder="Write a message... (Enter to send)"
                />
                <Button onClick={send} disabled={!draft.trim()}>
                  <Send size={14} /> Send
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New direct chat */}
      <ModalShell
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New Chat"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={startDirect} disabled={!directUserId}>Start Chat</Button>
          </>
        }
      >
        <Field label="Pick a person" required>
          <select className={inputCls} value={directUserId} onChange={(e) => setDirectUserId(e.target.value)}>
            <option value="">— Select user —</option>
            {(users ?? [])
              .filter((u) => rid(u) !== myId)
              .map((u) => (
                <option key={rid(u)} value={rid(u)}>{u.name} ({u.role})</option>
              ))}
          </select>
        </Field>
        {!canBrowseUsers && (
          <p className="mt-2 text-xs text-gray-400">
            Ask an admin to add you to a conversation, or use a group you're already in.
          </p>
        )}
      </ModalShell>

      {/* New group */}
      <ModalShell
        open={showGroup}
        onClose={() => setShowGroup(false)}
        title="New Group"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowGroup(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!groupTitle.trim() || groupMembers.length === 0}>Create Group</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Group name" required>
            <input className={inputCls} value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="Grade 10 — Science" />
          </Field>
          <Field label={`Members (${groupMembers.length} selected)`} required>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {(users ?? [])
                .filter((u) => rid(u) !== myId)
                .map((u) => {
                  const id = rid(u)
                  const checked = groupMembers.includes(id)
                  return (
                    <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setGroupMembers((prev) =>
                            checked ? prev.filter((x) => x !== id) : [...prev, id],
                          )
                        }
                      />
                      <span className="text-gray-700">{u.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{u.role}</span>
                    </label>
                  )
                })}
            </div>
          </Field>
        </div>
      </ModalShell>

      {/* Add members to the active group */}
      <ModalShell
        open={showAddMembers && !!active}
        onClose={() => setShowAddMembers(false)}
        title="Add Members"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddMembers(false)}>Cancel</Button>
            <Button onClick={submitAddMembers} disabled={newMembers.length === 0 || addingMembers}>
              Add {newMembers.length > 0 ? newMembers.length : ''}
            </Button>
          </>
        }
      >
        {(() => {
          const existing = active ? participantIds(active) : new Set<string>()
          const candidates = (users ?? []).filter((u) => !existing.has(u._id) && !existing.has(rid(u)))
          if (candidates.length === 0) {
            return <p className="py-6 text-center text-sm text-gray-400">Everyone you can see is already in this group</p>
          }
          return (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {candidates.map((u) => {
                const id = rid(u)
                const checked = newMembers.includes(id)
                return (
                  <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setNewMembers((prev) => (checked ? prev.filter((x) => x !== id) : [...prev, id]))
                      }
                    />
                    <span className="text-gray-700">{u.name}</span>
                    <span className="ml-auto text-xs text-gray-400">{u.role}</span>
                  </label>
                )
              })}
            </div>
          )
        })()}
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
