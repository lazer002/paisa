import api from '@/lib/api/axios'
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

export const orgApi = {
  list: (params?: OrgListParams) =>
    api.get('/organizations', { params }).then(normalizeListResponse),

  getById: (id: string): Promise<Organization> =>
    api.get(`/organizations/${id}`).then((r) => r.data?.data ?? r.data),

  create: (payload: CreateOrgPayload): Promise<Organization> =>
    api.post('/organizations', payload).then((r) => r.data?.data ?? r.data),

  update: (id: string, payload: UpdateOrgPayload): Promise<Organization> =>
    api.put(`/organizations/${id}`, payload).then((r) => r.data?.data ?? r.data),

  delete: (id: string) => api.delete(`/organizations/${id}`),
}
