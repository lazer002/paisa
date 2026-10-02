// src/features/teachers/teachersApi.ts

import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Teacher {
  _id: string
  userId:
    | {
        _id: string
        name: string
        email: string
        userCode?: string
      }
    | string
    | null

  instituteId:
    | {
        _id: string
        name: string
        type?: string
      }
    | string
    | null

  subject?: string
  qualifications?: string
  experience?: number | string
  createdAt?: string
}

export interface CreateTeacherPayload {
  userId: string
  instituteId?: string
  subject?: string
  qualifications?: string
  experience?: number
}

export const teachersApi = createApi({
  reducerPath: 'teachersApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Teacher'],

  endpoints: (builder) => ({
    getTeachers: builder.query<Teacher[], void>({
      query: () => '/teachers',
      transformResponse: (res: any) =>
        res?.data ?? [],
      providesTags: [
        {
          type: 'Teacher',
          id: 'LIST',
        },
      ],
    }),

    createTeacher: builder.mutation<
      Teacher,
      CreateTeacherPayload
    >({
      query: (body) => ({
        url: '/teachers',
        method: 'POST',
        body,
      }),

      invalidatesTags: [
        {
          type: 'Teacher',
          id: 'LIST',
        },
      ],
    }),
  }),
})

export const {
  useGetTeachersQuery,
  useCreateTeacherMutation,
} = teachersApi