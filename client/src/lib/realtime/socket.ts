// client/src/lib/realtime/socket.ts
//
// One socket.io connection per signed-in session, driven by the auth slice:
// - a token appears (login, bootstrap refresh)  → connect with it
// - the token changes (axios refresh flow)       → later (re)connects use it
// - the token is cleared (logout)                → disconnect
// The server refuses a bad/expired token at the handshake (`connect_error`
// with data.code) and kicks a socket whose token expires (`auth_error`);
// both trigger the shared single-flight refresh and a reconnect.
//
// Sockets only push hints; REST stays the source of truth.

import { io, type Socket } from 'socket.io-client'

import { store } from '@/app/store'
import { doRefresh } from '@/lib/api/refresh'

type Handler = (...args: unknown[]) => void

/** Local pseudo-event fired after every successful (re)connect. */
export const REALTIME_CONNECTED = 'realtime:connected'

const AUTH_ERROR_CODES = new Set([
  'AUTHENTICATION_REQUIRED',
  'ACCESS_TOKEN_EXPIRED',
  'INVALID_ACCESS_TOKEN',
  'INVALID_TOKEN_TYPE',
  'TOKEN_REVOKED',
  'TOKEN_INVALIDATED',
])

// Don't hammer /auth/refresh if the server keeps refusing fresh tokens.
const MIN_REFRESH_GAP_MS = 15_000

let socket: Socket | null = null
let currentToken: string | null = null
let started = false
let lastRefreshAt = 0
let refreshing = false

const listeners = new Map<string, Set<Handler>>()
const joinedConversations = new Set<string>()

function dispatchLocal(event: string, args: unknown[]) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(...args)
    } catch (error) {
      console.error(`realtime handler for ${event} failed`, error)
    }
  })
}

/** Absolute API origin when VITE_API_URL points elsewhere; same-origin otherwise. */
function socketOrigin(): string | undefined {
  const api = import.meta.env.VITE_API_URL as string | undefined
  if (api && /^https?:\/\//i.test(api)) {
    try {
      return new URL(api).origin
    } catch {
      return undefined
    }
  }
  return undefined
}

async function refreshAndReconnect() {
  if (refreshing || !socket) return
  const now = Date.now()
  if (now - lastRefreshAt < MIN_REFRESH_GAP_MS) return

  refreshing = true
  lastRefreshAt = now
  try {
    const token = await doRefresh()
    // A new token reconnects through the store subscription; if the token
    // string did not change (another tab refreshed), reconnect here.
    if (token && socket && !socket.connected) {
      socket.connect()
    }
  } finally {
    refreshing = false
  }
}

function rejoinConversations(target: Socket) {
  joinedConversations.forEach((conversationId) => {
    target.emit('conversation:join', { conversationId })
  })
}

function createSocket(): Socket {
  const options = {
    path: '/socket.io',
    withCredentials: true,
    // Read the latest in-memory token on every (re)connect attempt.
    auth: (cb: (data: object) => void) => cb({ token: store.getState().auth.token }),
  }

  const origin = socketOrigin()
  const next = origin ? io(origin, options) : io(options)

  next.on('connect', () => {
    rejoinConversations(next)
    dispatchLocal(REALTIME_CONNECTED, [])
  })

  next.on('connect_error', (error: Error & { data?: { code?: string } }) => {
    const code = error?.data?.code
    if (code && AUTH_ERROR_CODES.has(code)) {
      void refreshAndReconnect()
    }
  })

  next.on('auth_error', () => {
    void refreshAndReconnect()
  })

  next.onAny((event: string, ...args: unknown[]) => {
    dispatchLocal(event, args)
  })

  return next
}

function disconnectSocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
  joinedConversations.clear()
}

function syncWithAuth() {
  const token = store.getState().auth.token
  if (token === currentToken) return
  currentToken = token

  if (!token) {
    disconnectSocket()
    return
  }

  if (!socket) {
    socket = createSocket()
  } else if (!socket.connected) {
    socket.connect()
  }
}

/** Call once at app start; follows the auth slice from then on. */
export function startRealtime() {
  if (started) return
  started = true
  syncWithAuth()
  store.subscribe(syncWithAuth)
}

/** Subscribe to a server event (or REALTIME_CONNECTED). Returns an unsubscribe. */
export function onRealtime(event: string, handler: Handler): () => void {
  let set = listeners.get(event)
  if (!set) {
    set = new Set()
    listeners.set(event, set)
  }
  set.add(handler)
  return () => {
    set?.delete(handler)
  }
}

/** Ask the server to put this socket in a conversation room (participant-checked). */
export function joinConversation(conversationId: string) {
  joinedConversations.add(conversationId)
  if (socket?.connected) {
    socket.emit('conversation:join', { conversationId })
  }
}

export function leaveConversation(conversationId: string) {
  joinedConversations.delete(conversationId)
  if (socket?.connected) {
    socket.emit('conversation:leave', { conversationId })
  }
}

export function sendTyping(conversationId: string, isTyping: boolean) {
  if (socket?.connected && joinedConversations.has(conversationId)) {
    socket.emit('typing', { conversationId, isTyping })
  }
}
