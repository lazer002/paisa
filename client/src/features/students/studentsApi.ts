import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface StudentProfile {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  userId: { _id: string; name: string; email: string; userCode?: string } | string
  instituteId?: { _id: string; name: string; type: string } | string | null
  enrollmentNumber: string
  course?: string
  year?: number
}

export const studentsApi = createApi({
  reducerPath: 'studentsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Student'],
  endpoints: (builder) => ({
    getStudents: builder.query<StudentProfile[], void>({
      query: () => '/students',
      transformResponse: (res: any) => (Array.isArray(res) ? res : res?.data ?? []),
      providesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    createStudent: builder.mutation<StudentProfile, { userId: string; enrollmentNumber: string; course?: string; year?: number }>({
      query: (payload) => ({ url: '/students', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
  }),
})

export const { useGetStudentsQuery, useCreateStudentMutation } = studentsApi
