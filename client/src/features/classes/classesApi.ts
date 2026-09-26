import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface ClassSchedule {
  days?: string[]
  startTime?: string
  endTime?: string
}

export interface SchoolClass {
  _id: string
  instituteId: string
  name: string
  subject: string
  description?: string
  teacherId?: { _id: string; name: string; email: string; userCode?: string } | string
  studentIds?: ({ _id: string; name: string; email: string; userCode?: string } | string)[]
  schedule?: ClassSchedule
  room?: string
  maxStudents?: number
  status: 'active' | 'inactive'
  createdAt: string
}

export interface ClassPayload {
  name: string
  subject: string
  description?: string
  teacherId?: string
  schedule?: ClassSchedule
  room?: string
  maxStudents?: number
  status?: 'active' | 'inactive'
}

export const classesApi = createApi({
  reducerPath: 'classesApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Class'],
  endpoints: (builder) => ({
    getClasses: builder.query<SchoolClass[], { search?: string; status?: string; teacherId?: string } | void>({
      query: (params) => ({
        url: '/classes',
        params: params
          ? {
              search: params.search || undefined,
              status: params.status || undefined,
              teacherId: params.teacherId || undefined,
            }
          : undefined,
      }),
      transformResponse: (res: any) => res?.data ?? [],
      providesTags: (r) =>
        r
          ? [...r.map((c) => ({ type: 'Class' as const, id: c._id })), { type: 'Class' as const, id: 'LIST' }]
          : [{ type: 'Class' as const, id: 'LIST' }],
    }),
    getClass: builder.query<SchoolClass, string>({
      query: (id) => `/classes/${id}`,
      transformResponse: (res: any) => res?.data,
      providesTags: (r, e, id) => [{ type: 'Class', id }],
    }),
    createClass: builder.mutation<SchoolClass, ClassPayload>({
      query: (payload) => ({ url: '/classes', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Class', id: 'LIST' }],
    }),
    updateClass: builder.mutation<SchoolClass, { id: string; payload: Partial<ClassPayload> }>({
      query: ({ id, payload }) => ({ url: `/classes/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Class', id }, { type: 'Class', id: 'LIST' }],
    }),
    deleteClass: builder.mutation<void, string>({
      query: (id) => ({ url: `/classes/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Class', id: 'LIST' }],
    }),
    enrollStudent: builder.mutation<SchoolClass, { id: string; studentId: string }>({
      query: ({ id, studentId }) => ({ url: `/classes/${id}/enroll`, method: 'POST', body: { studentId } }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Class', id }, { type: 'Class', id: 'LIST' }],
    }),
    removeStudent: builder.mutation<SchoolClass, { id: string; studentId: string }>({
      query: ({ id, studentId }) => ({ url: `/classes/${id}/students/${studentId}`, method: 'DELETE' }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Class', id }, { type: 'Class', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useEnrollStudentMutation,
  useRemoveStudentMutation,
} = classesApi
