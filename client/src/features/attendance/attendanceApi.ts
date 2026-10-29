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

/** The browser's IANA timezone, so the server files attendance under the right local day. */
export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export interface SelfCheckPayload {
  action: 'in' | 'out'
  latitude?: number
  longitude?: number
  accuracy?: number
  timezone?: string
}

export interface QrSessionOpened {
  publicId: string
  /** Shown once — the server only keeps its hash. */
  code: string
  startsAt: string
  expiresAt: string
}

export interface QrSessionRow {
  _id: string
  publicId?: string
  status: string
  classId?: { _id: string; name: string; subject?: string } | string | null
  expiresAt: string
  scanCount?: number
}

export interface Geofence {
  _id: string
  publicId?: string
  name: string
  type?: string
  status?: string
  radiusMeters?: number
  center?: { latitude: number; longitude: number }
}

export interface GeofencePayload {
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
}

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Attendance', 'QrSession', 'Geofence'],
  endpoints: (builder) => ({
    selfCheck: builder.mutation<AttendanceRecord, SelfCheckPayload>({
      query: (body) => ({ url: '/attendance/check-in', method: 'POST', body }),
      invalidatesTags: [{ type: 'Attendance', id: 'ME' }],
    }),
    scanQr: builder.mutation<AttendanceRecord | null, string>({
      query: (code) => ({
        url: '/attendance/qr-scan',
        method: 'POST',
        body: { code, timezone: browserTimezone() },
      }),
      invalidatesTags: [{ type: 'Attendance', id: 'ME' }],
    }),
    openQrSession: builder.mutation<QrSessionOpened, { classId: string; minutes: number }>({
      query: (body) => ({ url: '/qr-sessions', method: 'POST', body }),
      transformResponse: (res: { data?: unknown }) => res?.data as QrSessionOpened,
      invalidatesTags: ['QrSession'],
    }),
    getQrSessions: builder.query<QrSessionRow[], void>({
      query: () => ({ url: '/qr-sessions' }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as QrSessionRow[],
      providesTags: ['QrSession'],
    }),
    closeQrSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/qr-sessions/${id}/close`, method: 'PUT' }),
      invalidatesTags: ['QrSession'],
    }),
    getGeofences: builder.query<Geofence[], void>({
      query: () => ({ url: '/geofences' }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as Geofence[],
      providesTags: ['Geofence'],
    }),
    createGeofence: builder.mutation<Geofence, GeofencePayload>({
      query: (body) => ({ url: '/geofences', method: 'POST', body }),
      invalidatesTags: ['Geofence'],
    }),
    deleteGeofence: builder.mutation<void, string>({
      query: (id) => ({ url: `/geofences/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Geofence'],
    }),
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
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as AttendanceRecord[],
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),
    getMyAttendance: builder.query<MyAttendanceResult, { month?: number; year?: number } | void>({
      query: (params) => ({
        url: '/attendance/me',
        params: params
          ? { month: params.month || undefined, year: params.year || undefined }
          : undefined,
      }),
      transformResponse: (res: { data?: unknown }) => res?.data as MyAttendanceResult,
      providesTags: [{ type: 'Attendance', id: 'ME' }],
    }),
    markAttendance: builder.mutation<AttendanceRecord[], MarkPayload>({
      query: (payload) => ({ url: '/attendance', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Attendance', id: 'LIST' }, { type: 'Attendance', id: 'ME' }],
    }),
  }),
})

export const {
  useGetAttendanceQuery,
  useGetMyAttendanceQuery,
  useMarkAttendanceMutation,
  useSelfCheckMutation,
  useScanQrMutation,
  useOpenQrSessionMutation,
  useGetQrSessionsQuery,
  useCloseQrSessionMutation,
  useGetGeofencesQuery,
  useCreateGeofenceMutation,
  useDeleteGeofenceMutation,
} = attendanceApi
