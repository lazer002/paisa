// Live session join (Jitsi) + host roster. Injected into messagingApi, which
// owns the live-session list/create/update/delete endpoints.
import { messagingApi } from '@/features/messaging/messagingApi'

export interface LiveSessionJoin {
  publicId: string
  title: string
  provider: string
  joinUrl: string
  jitsi: { domain: string; roomName: string; scriptUrl: string } | null
  displayName: string
  isHost: boolean
  joinedAt: string
}

export interface LiveSessionParticipant {
  user: { publicId?: string; name?: string; email?: string; role?: string } | null
  role: string
  status: string
  joinedAt?: string | null
  lastSeenAt?: string | null
  connectionCount?: number
}

const unwrap = <T>(res: { data?: unknown }) => (res?.data ?? res) as T

export const liveSessionsApi = messagingApi.injectEndpoints({
  endpoints: (builder) => ({
    joinLiveSession: builder.mutation<LiveSessionJoin, string>({
      query: (id) => ({ url: `/live-sessions/${id}/join`, method: 'POST', body: {} }),
      transformResponse: unwrap<LiveSessionJoin>,
      invalidatesTags: (_r, _e, id) => [{ type: 'LiveSession', id: 'LIST' }, { type: 'LiveSession', id: `participants-${id}` }],
    }),
    getLiveSessionParticipants: builder.query<LiveSessionParticipant[], string>({
      query: (id) => `/live-sessions/${id}/participants`,
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as LiveSessionParticipant[],
      providesTags: (_r, _e, id) => [{ type: 'LiveSession', id: `participants-${id}` }],
    }),
  }),
})

export const { useJoinLiveSessionMutation, useGetLiveSessionParticipantsQuery } = liveSessionsApi
