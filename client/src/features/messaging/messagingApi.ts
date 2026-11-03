import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

const list = <T,>(res: { data?: unknown }) => (res?.data ?? []) as T[]

// ─── Shapes ──────────────────────────────────────────────────────────────────

export interface Ref {
  _id: string
  publicId?: string
  name?: string
  email?: string
  userCode?: string
  role?: string
}

export interface ConversationParticipant {
  userId: Ref | string
  role?: string
  status?: string
  lastReadAt?: string | null
  unreadCount?: number
}

export interface Conversation {
  _id: string
  publicId?: string
  type: 'direct' | 'group' | 'support' | 'system'
  title?: string | null
  status: string
  participants: ConversationParticipant[]
  participantView?: ConversationParticipant[]
  myUnreadCount?: number
  lastMessage?: {
    preview?: string | null
    senderName?: string | null
    createdAt?: string | null
  } | null
  messageCount?: number
  lastActivityAt?: string | null
  createdAt: string
}

export interface ChatMessage {
  _id: string
  publicId?: string
  conversationId: string | Ref
  senderId: Ref | string
  senderName?: string | null
  text: string
  type: string
  status: string
  attachments?: ChatAttachment[]
  editedAt?: string | null
  /** emoji → count */
  reactionSummary?: Record<string, number>
  reactions?: { userId: string; emoji: string }[]
  /** On your own messages: names of participants who have read it. */
  seenBy?: string[]
  createdAt: string
}

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export interface ChatAttachment {
  fileId?: string | null
  name?: string | null
  url?: string | null
  mimeType?: string | null
  size?: number | null
}

export interface ChatSearchHit extends ChatMessage {
  conversation: { publicId?: string; title?: string | null; type?: string }
}

export interface LiveSession {
  _id: string
  publicId?: string
  title: string
  description?: string | null
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled'
  classId?: { _id: string; name?: string } | string | null
  hostUserId?: Ref | string | null
  scheduledStartAt: string
  scheduledEndAt?: string | null
  joinUrl?: string | null
  accessMode?: string
  createdAt: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const messagingApi = createApi({
  reducerPath: 'messagingApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Conversation', 'Message', 'LiveSession'],
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => '/conversations',
      transformResponse: list,
      providesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    createDirectConversation: builder.mutation<Conversation, { userId: string }>({
      query: (body) => ({ url: '/conversations/direct', method: 'POST', body }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    createGroupConversation: builder.mutation<Conversation, { title: string; participantIds: string[] }>({
      query: (body) => ({ url: '/conversations/group', method: 'POST', body }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    markConversationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/conversations/${id}/read`, method: 'POST', body: {} }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    leaveConversation: builder.mutation<void, string>({
      query: (id) => ({ url: `/conversations/${id}/leave`, method: 'POST', body: {} }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    getMessages: builder.query<ChatMessage[], { conversationId: string }>({
      query: ({ conversationId }) => `/conversations/${conversationId}/messages`,
      transformResponse: list,
      providesTags: (r, e, { conversationId }) => [{ type: 'Message', id: conversationId }],
    }),
    sendMessage: builder.mutation<ChatMessage, { conversationId: string; text: string; fileIds?: string[] }>({
      query: ({ conversationId, text, fileIds }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        body: fileIds?.length ? { text, fileIds } : { text },
      }),
      invalidatesTags: (r, e, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    searchMessages: builder.query<ChatSearchHit[], { q: string; conversationId?: string }>({
      query: (params) => ({ url: '/messages/search', params }),
      transformResponse: list,
    }),
    addConversationParticipants: builder.mutation<Conversation, { id: string; userIds: string[] }>({
      query: ({ id, userIds }) => ({ url: `/conversations/${id}/participants`, method: 'POST', body: { userIds } }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    editMessage: builder.mutation<ChatMessage, { id: string; conversationId: string; text: string }>({
      query: ({ id, text }) => ({ url: `/messages/${id}`, method: 'PUT', body: { text } }),
      invalidatesTags: (r, e, { conversationId }) => [{ type: 'Message', id: conversationId }],
    }),
    toggleReaction: builder.mutation<ChatMessage, { id: string; conversationId: string; emoji: string }>({
      query: ({ id, emoji }) => ({ url: `/messages/${id}/reactions`, method: 'POST', body: { emoji } }),
      invalidatesTags: (r, e, { conversationId }) => [{ type: 'Message', id: conversationId }],
    }),
    deleteMessage: builder.mutation<void, { id: string; conversationId: string }>({
      query: ({ id }) => ({ url: `/messages/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),

    // ── Live sessions ──
    getLiveSessions: builder.query<LiveSession[], void>({
      query: () => '/live-sessions',
      transformResponse: list,
      providesTags: [{ type: 'LiveSession', id: 'LIST' }],
    }),
    createLiveSession: builder.mutation<LiveSession, Record<string, unknown>>({
      query: (body) => ({ url: '/live-sessions', method: 'POST', body }),
      invalidatesTags: [{ type: 'LiveSession', id: 'LIST' }],
    }),
    updateLiveSession: builder.mutation<LiveSession, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/live-sessions/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'LiveSession', id: 'LIST' }],
    }),
    deleteLiveSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/live-sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'LiveSession', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupConversationMutation,
  useMarkConversationReadMutation,
  useLeaveConversationMutation,
  useAddConversationParticipantsMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useToggleReactionMutation,
  useDeleteMessageMutation,
  useSearchMessagesQuery,
  useGetLiveSessionsQuery,
  useCreateLiveSessionMutation,
  useUpdateLiveSessionMutation,
  useDeleteLiveSessionMutation,
} = messagingApi
