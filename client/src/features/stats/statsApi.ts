import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface SuperAdminStats {
  organizations: number
  users: number
  institutes: number
  companies: number
  teachers: number
  students: number
  employees: number
  hr: number
  admins: number
}

export interface AdminStats {
  teachers: number
  students: number
  employees: number
  hr: number
  announcements: number
  pendingLeaves: number
  totalStaff: number
}

export interface TeacherStats {
  myClasses: number
  myAssignments: number
  pendingSubmissions: number
}

export interface StudentStats {
  enrolledClasses: number
  pendingAssignments: number
  submittedAssignments: number
  attendancePercent: number
}

export interface HRStats {
  employees: number
  pendingLeaves: number
  processedPayrolls: number
  departments: number
}

export interface EmployeeStats {
  myLeaves: number
  myPayslips: number
  pendingLeaves: number
  attendancePercent: number
}

export const statsApi = createApi({
  reducerPath: 'statsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Stats'],
  endpoints: (builder) => ({
    getSuperAdminStats: builder.query<SuperAdminStats, void>({
      query: () => '/stats/superadmin',
      transformResponse: (res: any) => res?.data,
      providesTags: ['Stats'],
    }),
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/stats/admin',
      transformResponse: (res: any) => res?.data,
      providesTags: ['Stats'],
    }),
    getTeacherStats: builder.query<TeacherStats, void>({
      query: () => '/stats/teacher',
      transformResponse: (res: any) => res?.data,
      providesTags: ['Stats'],
    }),
    getStudentStats: builder.query<StudentStats, void>({
      query: () => '/stats/student',
      transformResponse: (res: any) => res?.data,
      providesTags: ['Stats'],
    }),
    getHRStats: builder.query<HRStats, void>({
      query: () => '/stats/hr',
      transformResponse: (res: any) => res?.data,
      providesTags: ['Stats'],
    }),
    getEmployeeStats: builder.query<EmployeeStats, void>({
      query: () => '/stats/employee',
      transformResponse: (res: any) => res?.data,
      providesTags: ['Stats'],
    }),
  }),
})

export const {
  useGetSuperAdminStatsQuery,
  useGetAdminStatsQuery,
  useGetTeacherStatsQuery,
  useGetStudentStatsQuery,
  useGetHRStatsQuery,
  useGetEmployeeStatsQuery,
} = statsApi
