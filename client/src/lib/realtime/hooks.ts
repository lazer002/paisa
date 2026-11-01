// client/src/lib/realtime/hooks.ts

import { useCallback, useEffect, useRef, useState } from 'react'

import { joinConversation, leaveConversation, onRealtime, sendTyping } from './socket'

/** Run `handler` for a server push while the component is mounted. */
export function useRealtimeEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => onRealtime(event, (payload) => ref.current(payload as T)), [event])
}

interface TypingPush {
  conversationId?: string
  userId?: string
  name?: string
  isTyping?: boolean
}

// A peer counts as typing until they stop or go quiet for this long; the
// sender re-announces more often than this while still typing.
const TYPING_TTL_MS = 4000
const TYPING_RESEND_MS = 2000

/**
 * Joins the conversation's socket room while `conversationId` is set and
 * tracks who else is typing there. `myIds` filters out this user's own
 * other tabs.
 */
export function useConversationRealtime(conversationId: string | null, myIds: Array<string | undefined>) {
  const [typing, setTyping] = useState<Record<string, { name: string; at: number }>>({})
  const lastSentRef = useRef(0)
  const idsKey = myIds.filter(Boolean).join('|')

  useEffect(() => {
    if (!conversationId) return
    joinConversation(conversationId)
    return () => {
      leaveConversation(conversationId)
      setTyping({})
      lastSentRef.current = 0
    }
  }, [conversationId])

  useRealtimeEvent<TypingPush>('typing', (push) => {
    if (!conversationId || push?.conversationId !== conversationId || !push.userId) return
    if (idsKey.split('|').includes(push.userId)) return
    const userId = push.userId
    setTyping((prev) => {
      const next = { ...prev }
      if (push.isTyping === false) delete next[userId]
      else next[userId] = { name: push.name ?? 'Someone', at: Date.now() }
      return next
    })
  })

  // A new message from someone ends their typing state.
  useRealtimeEvent<{ conversationId?: string; message?: { senderName?: string | null } }>('message:new', (push) => {
    if (push?.conversationId !== conversationId || !push.message?.senderName) return
    const name = push.message.senderName
    setTyping((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([, v]) => v.name !== name))
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  })

  // Expire stale entries.
  const hasTyping = Object.keys(typing).length > 0
  useEffect(() => {
    if (!hasTyping) return
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - TYPING_TTL_MS
      setTyping((prev) => {
        const next = Object.fromEntries(Object.entries(prev).filter(([, v]) => v.at >= cutoff))
        return Object.keys(next).length === Object.keys(prev).length ? prev : next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [hasTyping])

  /** Call on every keystroke; throttled. */
  const notifyTyping = useCallback(() => {
    if (!conversationId) return
    const now = Date.now()
    if (now - lastSentRef.current < TYPING_RESEND_MS) return
    lastSentRef.current = now
    sendTyping(conversationId, true)
  }, [conversationId])

  /** Call after sending or clearing the draft. */
  const stopTyping = useCallback(() => {
    if (!conversationId || lastSentRef.current === 0) return
    lastSentRef.current = 0
    sendTyping(conversationId, false)
  }, [conversationId])

  const names = Object.values(typing).map((t) => t.name)
  const typingLabel =
    names.length === 0
      ? null
      : names.length === 1
        ? `${names[0]} is typing…`
        : names.length === 2
          ? `${names[0]} and ${names[1]} are typing…`
          : 'Several people are typing…'

  return { typingLabel, notifyTyping, stopTyping }
}
