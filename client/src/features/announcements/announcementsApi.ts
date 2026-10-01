import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Announcement {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  instituteId: string | null
  createdBy: { _id: string; name: string; role: string } | string
  title: string
  content: string
  targetRoles: string[]
  priority: 'low' | 'medium' | 'high'
  expiresAt?: string | null
  isActive: boolean
  createdAt: string
}

export interface AnnouncementPayload {
  title: string
  content: string
  targetRoles?: string[]
  priority?: 'low' | 'medium' | 'high'
  expiresAt?: string | null
}

export const announcementsApi = createApi({
  reducerPath: 'announcementsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Announcement'],
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => '/announcements',
      transformResponse: (res: any) => res?.data ?? [],
      providesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),
    createAnnouncement: builder.mutation<Announcement, AnnouncementPayload>({
      query: (payload) => ({ url: '/announcements', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),
    updateAnnouncement: builder.mutation<Announcement, { id: string; payload: Partial<AnnouncementPayload> & { isActive?: boolean } }>({
      query: ({ id, payload }) => ({ url: `/announcements/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),
    deleteAnnouncement: builder.mutation<void, string>({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = announcementsApi
