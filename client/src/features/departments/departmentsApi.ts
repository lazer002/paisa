// src/features/departments/departmentsApi.ts

import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface DepartmentHead {
  _id: string
  publicId?: string
  name: string
  email: string
  userCode?: string
  role?: string
}

export interface Department {
  _id: string
  publicId?: string
  instituteId: string
  name: string
  code?: string | null
  head?: DepartmentHead | string | null
  description?: string
  status: 'active' | 'inactive'
  employeeCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateDepartmentPayload {
  name: string
  code?: string
  head?: string
  description?: string
}

export interface UpdateDepartmentPayload {
  name?: string
  code?: string
  head?: string | null
  description?: string
  status?: 'active' | 'inactive'
}

export const departmentsApi = createApi({
  reducerPath: 'departmentsApi',

  baseQuery: axiosBaseQuery,

  tagTypes: ['Department'],

  endpoints: (builder) => ({
    getDepartments: builder.query<
      Department[],
      {
        status?: 'active' | 'inactive'
        search?: string
        instituteId?: string
      } | void
    >({
      query: (params) => ({
        url: '/departments',
        method: 'GET',
        params: params
          ? {
              status: params.status || undefined,
              search: params.search || undefined,
              instituteId: params.instituteId || undefined,
            }
          : undefined,
      }),

      transformResponse: (res: any) =>
        res?.data ?? res ?? [],

      providesTags: (result) =>
        result
          ? [
              ...result.map((department) => ({
                type: 'Department' as const,
                id: department.publicId ?? department._id,
              })),
              {
                type: 'Department' as const,
                id: 'LIST',
              },
            ]
          : [
              {
                type: 'Department' as const,
                id: 'LIST',
              },
            ],
    }),

    createDepartment: builder.mutation<
      Department,
      CreateDepartmentPayload
    >({
      query: (payload) => ({
        url: '/departments',
        method: 'POST',
        body: payload,
      }),

      transformResponse: (res: any) =>
        res?.data ?? res,

      invalidatesTags: [
        {
          type: 'Department',
          id: 'LIST',
        },
      ],
    }),

    updateDepartment: builder.mutation<
      Department,
      {
        id: string
        payload: UpdateDepartmentPayload
      }
    >({
      query: ({ id, payload }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body: payload,
      }),

      transformResponse: (res: any) =>
        res?.data ?? res,

      invalidatesTags: (result, error, { id }) => [
        {
          type: 'Department',
          id,
        },
        {
          type: 'Department',
          id: 'LIST',
        },
      ],
    }),

    deleteDepartment: builder.mutation<
      void,
      string
    >({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: 'Department',
          id,
        },
        {
          type: 'Department',
          id: 'LIST',
        },
      ],
    }),
  }),
})

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi