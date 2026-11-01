// client/src/lib/realtime/cacheSync.ts
//
// Applies server pushes to the RTK Query cache. Pushed records are patched in
// for instant display; list queries are invalidated so REST stays the truth.

import { store } from '@/app/store'
import { messagingApi, type ChatMessage } from '@/features/messaging/messagingApi'
import { notificationsApi, type NotificationItem } from '@/features/notifications/notificationsApi'

import { onRealtime, REALTIME_CONNECTED } from './socket'

const messageKey = (m: Pick<ChatMessage, '_id' | 'publicId'>) => m.publicId ?? m._id

interface MessagePush {
  conversationId?: string
  message?: ChatMessage
  messageId?: string
}

function patchMessages(conversationId: string, recipe: (draft: ChatMessage[]) => void) {
  store.dispatch(
    messagingApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
      recipe(draft)
    }),
  )
}

let installed = false

export function installRealtimeCacheSync() {
  if (installed) return
  installed = true

  onRealtime('message:new', (raw) => {
    const { conversationId, message } = (raw ?? {}) as MessagePush
    if (!conversationId || !message) return
    patchMessages(conversationId, (draft) => {
      if (!draft.some((m) => messageKey(m) === messageKey(message))) {
        draft.push(message)
      }
    })
  })

  onRealtime('message:updated', (raw) => {
    const { conversationId, message } = (raw ?? {}) as MessagePush
    if (!conversationId || !message) return
    patchMessages(conversationId, (draft) => {
      const index = draft.findIndex((m) => messageKey(m) === messageKey(message))
      if (index >= 0) draft[index] = message
    })
  })

  onRealtime('message:deleted', (raw) => {
    const { conversationId, messageId } = (raw ?? {}) as MessagePush
    if (!conversationId || !messageId) return
    patchMessages(conversationId, (draft) => {
      const index = draft.findIndex((m) => messageKey(m) === messageId || m._id === messageId)
      if (index >= 0) draft.splice(index, 1)
    })
  })

  // Conversation list: previews, ordering and unread badges.
  onRealtime('conversation:updated', () => {
    store.dispatch(messagingApi.util.invalidateTags([{ type: 'Conversation', id: 'LIST' }]))
  })

  onRealtime('notification:new', (raw) => {
    const notification = (raw as { notification?: NotificationItem } | undefined)?.notification
    if (notification) {
      // Bell badge + dropdown update immediately…
      store.dispatch(
        notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          const key = notification.publicId ?? notification._id
          if (draft.items.some((n) => (n.publicId ?? n._id) === key)) return
          draft.items.unshift(notification)
          if (notification.status === 'unread') draft.unreadCount += 1
        }),
      )
    }
    // …then every feed variant refetches from REST.
    store.dispatch(notificationsApi.util.invalidateTags([{ type: 'Notification', id: 'FEED' }]))
  })

  onRealtime('notification:read', () => {
    store.dispatch(notificationsApi.util.invalidateTags([{ type: 'Notification', id: 'FEED' }]))
  })

  // After a (re)connect, catch up on anything pushed while offline.
  let connectedOnce = false
  onRealtime(REALTIME_CONNECTED, () => {
    if (!connectedOnce) {
      connectedOnce = true
      return
    }
    store.dispatch(messagingApi.util.invalidateTags(['Message', { type: 'Conversation', id: 'LIST' }]))
    store.dispatch(notificationsApi.util.invalidateTags([{ type: 'Notification', id: 'FEED' }]))
  })
}
