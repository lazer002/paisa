import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'
import type { OrgUser } from '@/features/users/usersApi'

export interface UserDetail {
  user: OrgUser & {
    instituteId?: { _id: string; name: string; type: string; orgCode?: string; status?: string; plan?: string } | null
    lastLogin?: string
    createdAt?: string
    profile?: { phone?: string; address?: string; avatarUrl?: string }
  }
  permissions: string[]
  activity: {
    leaves: any[]
    payrolls: any[]
    attendancePercent: number | null
    recentAttendance: any[]
    teachingClasses: any[]
    enrolledClasses: any[]
    studentProfile: any
  }
}

export const userDetailApi = createApi({
  reducerPath: 'userDetailApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['UserDetail'],
  endpoints: (builder) => ({
    getUserDetail: builder.query<UserDetail, string>({
      query: (id) => `/users/${id}/detail`,
      transformResponse: (res: any) => res?.data,
      providesTags: (r, e, id) => [{ type: 'UserDetail', id }],
    }),
  }),
})

export const { useGetUserDetailQuery } = userDetailApi
