import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface AttendanceRecord {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  userId: { _id: string; name: string; email: string; userCode?: string } | string
  classId?: { _id: string; name: string; subject?: string } | string | null
  date: string
  status: AttendanceStatus
  notes?: string
  markedBy?: string
}

export interface MyAttendanceResult {
  records: AttendanceRecord[]
  summary: { total: number; present: number; absent: number; late: number; percentage: number }
}

export interface MarkPayload {
  classId?: string | null
  date: string
  records: { userId: string; status: AttendanceStatus; notes?: string }[]
}

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    getAttendance: builder.query<
      AttendanceRecord[],
      { classId?: string; userId?: string; date?: string; month?: number; year?: number } | void
    >({
      query: (params) => ({
        url: '/attendance',
        params: params
          ? {
              classId: params.classId || undefined,
              userId: params.userId || undefined,
              date: params.date || undefined,
              month: params.month || undefined,
              year: params.year || undefined,
            }
          : undefined,
      }),
      transformResponse: (res: any) => res?.data ?? [],
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),
    getMyAttendance: builder.query<MyAttendanceResult, { month?: number; year?: number } | void>({
      query: (params) => ({
        url: '/attendance/me',
        params: params
          ? { month: params.month || undefined, year: params.year || undefined }
          : undefined,
      }),
      transformResponse: (res: any) => res?.data,
      providesTags: [{ type: 'Attendance', id: 'ME' }],
    }),
    markAttendance: builder.mutation<AttendanceRecord[], MarkPayload>({
      query: (payload) => ({ url: '/attendance', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Attendance', id: 'LIST' }, { type: 'Attendance', id: 'ME' }],
    }),
  }),
})

export const { useGetAttendanceQuery, useGetMyAttendanceQuery, useMarkAttendanceMutation } = attendanceApi
