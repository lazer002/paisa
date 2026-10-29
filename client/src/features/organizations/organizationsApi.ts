import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'
import type { Organization, CreateOrgPayload, CreateOrgResult, UpdateOrgPayload } from './types'

export interface OrgListParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  search?: string
  /** Super admin only: list soft-deleted organizations instead. */
  deleted?: boolean
}

export interface OrgListResult {
  data: Organization[]
  total: number
  page: number
  limit: number
  /** Total page count when the server reports it. */
  pages?: number
}

type Pagination = { total?: number; page?: number; pages?: number; limit?: number }

function normalizeListResponse(
  res: { data?: unknown; pagination?: Pagination },
  _meta?: unknown,
  arg?: OrgListParams | void,
): OrgListResult {
  const outer = res?.data as Record<string, unknown> | unknown[] | undefined
  const d = (Array.isArray(outer) ? undefined : (outer as Record<string, unknown> | undefined)?.data) ?? outer
  if (Array.isArray(d)) {
    // Server shape: { success, data: [...], pagination: { total, page, pages } }
    const p = res?.pagination
    return {
      data: d as Organization[],
      total: p?.total ?? d.length,
      page: p?.page ?? 1,
      limit: p?.limit ?? arg?.limit ?? d.length,
      pages: p?.pages,
    }
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
              deleted: params.deleted ? 'true' : undefined,
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

    getOrganization: builder.query<Organization, string>({
      query: (id) => ({ url: `/organizations/${id}` }),
      transformResponse: (r: { data?: Organization }) => (r?.data ?? r) as Organization,
      providesTags: (r, e, id) => [{ type: 'Organization', id }],
    }),

    // Super admin only. Also creates the org's first admin user from
    // contact.email and returns a one-time temporary password.
    addOrganization: builder.mutation<CreateOrgResult, CreateOrgPayload>({
      query: (payload) => ({ url: '/organizations', method: 'POST', body: payload }),
      transformResponse: (r: { data?: CreateOrgResult }) => (r?.data ?? r) as CreateOrgResult,
      invalidatesTags: [{ type: 'Organization', id: 'LIST' }],
    }),

    updateOrganization: builder.mutation<Organization, { id: string; payload: UpdateOrgPayload }>({
      query: ({ id, payload }) => ({ url: `/organizations/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
      ],
    }),

    // Super admin only. Soft delete (isDeleted + deletedAt); members of a
    // deleted org can no longer authenticate.
    deleteOrganization: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/organizations/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, id) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
      ],
    }),

    // Super admin only. Members regain access immediately.
    restoreOrganization: builder.mutation<Organization, string>({
      query: (id) => ({ url: `/organizations/${id}/restore`, method: 'POST' }),
      invalidatesTags: (r, e, id) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useAddOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useRestoreOrganizationMutation,
} = organizationsApi
