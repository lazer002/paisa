import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Person {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  name: string
  email: string
  role: string
  userCode?: string
  status?: string
  instituteId?: { _id: string; name: string; type: string } | string | null
  createdAt?: string
}

export interface CreatePersonPayload {
  name: string
  email: string
  password: string
  instituteId?: string
}

export const employeesApi = createApi({
  reducerPath: 'employeesApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Person'] as const,
  endpoints: (builder) => ({
    getEmployees: builder.query<Person[], void>({
      query: () => '/employees',
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res ?? []) as Person[],
      providesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    createEmployee: builder.mutation<Person, CreatePersonPayload>({
      query: (payload) => ({ url: '/employees', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    getEmployee: builder.query<Person, string>({
      query: (publicId) => `/employees/${publicId}`,
      transformResponse: (res: { data?: unknown }) =>
        (res?.data ?? res ?? {}) as Person,
      providesTags: (_r, _e, publicId) => [{ type: 'Person', id: publicId }],
    }),
    updateEmployee: builder.mutation<
      Person,
      { publicId: string; changes: { name?: string; status?: string } }
    >({
      query: ({ publicId, changes }) => ({
        url: `/employees/${publicId}`,
        method: 'PUT',
        body: changes,
      }),
      invalidatesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    deleteEmployee: builder.mutation<{ success: boolean }, string>({
      query: (publicId) => ({ url: `/employees/${publicId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
  }),
})

export const hrsApi = createApi({
  reducerPath: 'hrsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Person'] as const,
  endpoints: (builder) => ({
    getHRs: builder.query<Person[], void>({
      query: () => '/hr',
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res ?? []) as Person[],
      providesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    createHR: builder.mutation<Person, CreatePersonPayload>({
      query: (payload) => ({ url: '/hr', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    updateHR: builder.mutation<
      Person,
      { publicId: string; changes: { name?: string; status?: string } }
    >({
      query: ({ publicId, changes }) => ({
        url: `/hr/${publicId}`,
        method: 'PUT',
        body: changes,
      }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    deleteHR: builder.mutation<{ success: boolean }, string>({
      query: (publicId) => ({ url: `/hr/${publicId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useGetEmployeeQuery,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi
export const {
  useGetHRsQuery,
  useCreateHRMutation,
  useUpdateHRMutation,
  useDeleteHRMutation,
} = hrsApi
