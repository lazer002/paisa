import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Person {
  _id: string
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

const personListEndpoints = (url: string) => ({
  getList: (builder: any) => ({
    query: () => url,
    transformResponse: (res: any) => res?.data ?? res ?? [],
    providesTags: [{ type: 'Person', id: 'LIST' }],
  }),
  create: (builder: any) => ({
    query: (payload: CreatePersonPayload) => ({ url, method: 'POST', body: payload }),
    invalidatesTags: [{ type: 'Person', id: 'LIST' }],
  }),
})

export const employeesApi = createApi({
  reducerPath: 'employeesApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Person'] as const,
  endpoints: (builder) => ({
    getEmployees: builder.query<Person[], void>({
      query: () => '/employees',
      transformResponse: (res: any) => res?.data ?? res ?? [],
      providesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    createEmployee: builder.mutation<Person, CreatePersonPayload>({
      query: (payload) => ({ url: '/employees', method: 'POST', body: payload }),
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
      transformResponse: (res: any) => res?.data ?? res ?? [],
      providesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    createHR: builder.mutation<Person, CreatePersonPayload>({
      query: (payload) => ({ url: '/hr', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
  }),
})

void personListEndpoints

export const { useGetEmployeesQuery, useCreateEmployeeMutation } = employeesApi
export const { useGetHRsQuery, useCreateHRMutation } = hrsApi
