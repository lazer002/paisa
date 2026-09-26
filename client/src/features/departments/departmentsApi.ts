import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Department {
  _id: string
  instituteId: string
  name: string
  code?: string
  head?: { _id: string; name: string; email: string; userCode?: string } | string | null
  description?: string
  status: 'active' | 'inactive'
  employeeCount?: number
  createdAt: string
}

export const departmentsApi = createApi({
  reducerPath: 'departmentsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Department'],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], void>({
      query: () => '/departments',
      transformResponse: (res: any) => res?.data ?? [],
      providesTags: [{ type: 'Department', id: 'LIST' }],
    }),
    createDepartment: builder.mutation<Department, { name: string; code?: string; head?: string; description?: string }>({
      query: (payload) => ({ url: '/departments', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
    updateDepartment: builder.mutation<Department, { id: string; payload: Partial<{ name: string; code: string; head: string; description: string; status: string }> }>({
      query: ({ id, payload }) => ({ url: `/departments/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({ url: `/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi
