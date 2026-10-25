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

export interface AccountantStats {
  totalInvoices: number
  paidInvoices: number
  openInvoices: number
  outstanding: number
}

export interface CounselorStats {
  totalLeads: number
  newLeads: number
  convertedLeads: number
  openDeals: number
}

export interface SupportStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
}

export const statsApi = createApi({
  reducerPath: 'statsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Stats'],
  endpoints: (builder) => ({
    getSuperAdminStats: builder.query<SuperAdminStats, void>({
      query: () => '/stats/superadmin',
      transformResponse: (res: { data?: unknown }) => res?.data as SuperAdminStats,
      providesTags: ['Stats'],
    }),
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/stats/admin',
      transformResponse: (res: { data?: unknown }) => res?.data as AdminStats,
      providesTags: ['Stats'],
    }),
    getTeacherStats: builder.query<TeacherStats, void>({
      query: () => '/stats/teacher',
      transformResponse: (res: { data?: unknown }) => res?.data as TeacherStats,
      providesTags: ['Stats'],
    }),
    getStudentStats: builder.query<StudentStats, void>({
      query: () => '/stats/student',
      transformResponse: (res: { data?: unknown }) => res?.data as StudentStats,
      providesTags: ['Stats'],
    }),
    getHRStats: builder.query<HRStats, void>({
      query: () => '/stats/hr',
      transformResponse: (res: { data?: unknown }) => res?.data as HRStats,
      providesTags: ['Stats'],
    }),
    getEmployeeStats: builder.query<EmployeeStats, void>({
      query: () => '/stats/employee',
      transformResponse: (res: { data?: unknown }) => res?.data as EmployeeStats,
      providesTags: ['Stats'],
    }),
    getAccountantStats: builder.query<AccountantStats, void>({
      query: () => '/stats/accountant',
      transformResponse: (res: { data?: unknown }) => res?.data as AccountantStats,
      providesTags: ['Stats'],
    }),
    getCounselorStats: builder.query<CounselorStats, void>({
      query: () => '/stats/counselor',
      transformResponse: (res: { data?: unknown }) => res?.data as CounselorStats,
      providesTags: ['Stats'],
    }),
    getSupportStats: builder.query<SupportStats, void>({
      query: () => '/stats/support',
      transformResponse: (res: { data?: unknown }) => res?.data as SupportStats,
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
  useGetAccountantStatsQuery,
  useGetCounselorStatsQuery,
  useGetSupportStatsQuery,
} = statsApi
