import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'
import type { Organization, CreateOrgPayload, UpdateOrgPayload } from './types'

export interface OrgListParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  search?: string
}

export interface OrgListResult {
  data: Organization[]
  total: number
  page: number
  limit: number
}

function normalizeListResponse(res: { data?: unknown }): OrgListResult {
  const outer = res?.data as Record<string, unknown> | unknown[] | undefined
  const d = (Array.isArray(outer) ? undefined : (outer as Record<string, unknown> | undefined)?.data) ?? outer
  if (Array.isArray(d)) {
    return { data: d as Organization[], total: d.length, page: 1, limit: d.length }
  }
  const obj = d as Record<string, unknown> | undefined
  const pagination = obj?.pagination as { total?: number; page?: number; limit?: number } | undefined
  return {
    data: (obj?.organizations ?? obj?.data ?? obj ?? []) as Organization[],
    total: pagination?.total ?? (obj?.total as number | undefined) ?? 0,
    page: pagination?.page ?? (obj?.page as number | undefined) ?? 1,
    limit: pagination?.limit ?? (obj?.limit as number | undefined) ?? 12,
  }
}

export const organizationsApi = createApi({
  reducerPath: 'organizationsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Organization'],
  endpoints: (builder) => ({
    getOrganizations: builder.query<OrgListResult, OrgListParams | void>({
      query: (params) => ({
        url: '/organizations',
        params: params
          ? {
              page: params.page,
              limit: params.limit,
              type: params.type || undefined,
              status: params.status || undefined,
              search: params.search || undefined,
            }
          : undefined,
      }),
      transformResponse: normalizeListResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Organization' as const, id: _id })),
              { type: 'Organization' as const, id: 'LIST' },
            ]
          : [{ type: 'Organization' as const, id: 'LIST' }],
    }),

    addOrganization: builder.mutation<Organization, CreateOrgPayload>({
      query: (payload) => ({ url: '/organizations', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Organization', id: 'LIST' }],
    }),

    updateOrganization: builder.mutation<Organization, { id: string; payload: UpdateOrgPayload }>({
      query: ({ id, payload }) => ({ url: `/organizations/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
      ],
    }),

    deleteOrganization: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/organizations/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, id) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetOrganizationsQuery,
  useAddOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} = organizationsApi
