import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

const unwrap = <T,>(res: { data?: unknown }) => res?.data as T
const list = <T,>(res: { data?: unknown }) => (res?.data ?? []) as T[]

export interface NotificationItem {
  _id: string
  publicId?: string
  type: string
  title: string
  body?: string | null
  link?: string | null
  status: 'unread' | 'read' | 'archived'
  actorName?: string | null
  readAt?: string | null
  createdAt: string
}

export interface NotificationFeed {
  items: NotificationItem[]
  unreadCount: number
}

export interface NotificationPreferences {
  _id: string
  enabled?: boolean
  allowNotifications?: boolean
  allowMarketing?: boolean
  allowSystem?: boolean
  allowSecurity?: boolean
  channels?: Record<
    string,
    { enabled?: boolean; frequency?: string }
  >
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Notification', 'NotificationPrefs'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationFeed, { status?: string } | void>({
      query: (params) => ({
        url: '/notifications',
        params: params ? { status: params.status || undefined } : undefined,
      }),
      transformResponse: unwrap<NotificationFeed>,
      providesTags: [{ type: 'Notification', id: 'FEED' }],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT', body: {} }),
      invalidatesTags: [{ type: 'Notification', id: 'FEED' }],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST', body: {} }),
      invalidatesTags: [{ type: 'Notification', id: 'FEED' }],
    }),
    archiveNotification: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/archive`, method: 'PUT', body: {} }),
      invalidatesTags: [{ type: 'Notification', id: 'FEED' }],
    }),
    getNotificationPreferences: builder.query<NotificationPreferences, void>({
      query: () => '/notifications/preferences',
      transformResponse: unwrap<NotificationPreferences>,
      providesTags: [{ type: 'NotificationPrefs', id: 'SELF' }],
    }),
    updateNotificationPreferences: builder.mutation<
      NotificationPreferences,
      Partial<Pick<NotificationPreferences, 'allowMarketing' | 'allowSystem' | 'allowSecurity'>>
    >({
      query: (body) => ({ url: '/notifications/preferences', method: 'PUT', body }),
      invalidatesTags: [{ type: 'NotificationPrefs', id: 'SELF' }],
    }),
    broadcastNotification: builder.mutation<
      { delivered: number },
      { title: string; body?: string; type?: string; targetRoles?: string[] }
    >({
      query: (body) => ({ url: '/notifications/broadcast', method: 'POST', body }),
      invalidatesTags: [{ type: 'Notification', id: 'FEED' }],
    }),
  }),
})

// export list to silence unused helper if it stays unused
void list

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useArchiveNotificationMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useBroadcastNotificationMutation,
} = notificationsApi
