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

function normalizeListResponse(res: any): OrgListResult {
  const d = res?.data?.data ?? res?.data
  if (Array.isArray(d)) {
    return { data: d, total: d.length, page: 1, limit: d.length }
  }
  return {
    data: d?.organizations ?? d?.data ?? d ?? [],
    total: d?.pagination?.total ?? d?.total ?? 0,
    page: d?.pagination?.page ?? d?.page ?? 1,
    limit: d?.pagination?.limit ?? d?.limit ?? 12,
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
