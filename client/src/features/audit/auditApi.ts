import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface AuditLogEntry {
  _id: string
  action: string
  category: string
  description?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  resourceType?: string | null
  createdAt: string
  request?: { method?: string; route?: string; statusCode?: number; ipAddress?: string }
}

export interface AuditPage {
  items: AuditLogEntry[]
  total: number
}

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Audit'],
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      AuditPage,
      { page?: number; limit?: number; action?: string; category?: string; search?: string }
    >({
      query: (params) => ({
        url: '/audit-logs',
        params: {
          page: params.page,
          limit: params.limit,
          action: params.action || undefined,
          category: params.category || undefined,
          search: params.search || undefined,
        },
      }),
      transformResponse: (res: { data?: AuditLogEntry[]; meta?: { total?: number } }) => ({
        items: res?.data ?? [],
        total: res?.meta?.total ?? 0,
      }),
      providesTags: ['Audit'],
    }),
  }),
})

export const { useGetAuditLogsQuery } = auditApi
