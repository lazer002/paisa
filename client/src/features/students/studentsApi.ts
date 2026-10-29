import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export type AcademicStatus = 'active' | 'alumni' | 'suspended' | 'dropped_out' | 'graduating'

export interface StudentProfile {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  userId: { _id: string; name: string; email: string; userCode?: string; role?: string; status?: string } | string
  instituteId?: { _id: string; name: string; type: string } | string | null
  enrollmentNumber: string
  course?: string
  branch?: string | null
  year?: number | null
  semester?: number | null
  section?: string | null
  rollNumber?: string | null
  academicStatus?: AcademicStatus
  /** Linked parent accounts (user _ids). */
  guardianUserIds?: string[]
}

export interface UpdateStudentPayload {
  course?: string
  branch?: string | null
  year?: number | null
  semester?: number | null
  section?: string | null
  rollNumber?: string | null
  academicStatus?: AcademicStatus
  /** Parent accounts (publicIds) allowed to see this student's records. */
  guardianUserIds?: string[]
}

const unwrap = (res: { data?: unknown }) =>
  (Array.isArray(res) ? res : res?.data ?? res ?? []) as never

export const studentsApi = createApi({
  reducerPath: 'studentsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Student'],
  endpoints: (builder) => ({
    getStudents: builder.query<StudentProfile[], void>({
      query: () => '/students',
      transformResponse: (res: { data?: unknown }) =>
        (Array.isArray(res) ? res : res?.data ?? []) as StudentProfile[],
      providesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    getStudent: builder.query<StudentProfile, string>({
      query: (publicId) => `/students/${publicId}`,
      transformResponse: (res: { data?: unknown }) => unwrap(res) as StudentProfile,
      providesTags: (_result, _err, publicId) => [{ type: 'Student', id: publicId }],
    }),
    createStudent: builder.mutation<
      StudentProfile,
      { userId: string; enrollmentNumber: string; course?: string; year?: number; semester?: number }
    >({
      query: (payload) => ({ url: '/students', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    updateStudent: builder.mutation<StudentProfile, { publicId: string; changes: UpdateStudentPayload }>({
      query: ({ publicId, changes }) => ({
        url: `/students/${publicId}`,
        method: 'PUT',
        body: changes,
      }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    deleteStudent: builder.mutation<{ success: boolean }, string>({
      query: (publicId) => ({ url: `/students/${publicId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi
