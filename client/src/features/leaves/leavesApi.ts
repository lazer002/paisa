import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type LeaveType = 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'comp_off' | 'unpaid' | 'half_day' | 'other'

/** Types a policy can be created for ("unpaid" is loss of pay and never limited). */
export const POLICY_LEAVE_TYPES: LeaveType[] = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'comp_off', 'half_day', 'other']

export interface Leave {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  instituteId?: string | null
  userId:
    | { _id: string; publicId?: string; name: string; email: string; userCode?: string; role?: string }
    | string
  type: LeaveType
  duration?: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  approvedBy?: { _id: string; name: string } | string | null
  approvedAt?: string | null
  rejectionReason?: string
  createdAt: string
}

export interface LeavePolicy {
  _id: string
  publicId: string
  leaveType: LeaveType
  name?: string | null
  yearlyAllocation: number
  carryForwardCap: number
  appliesToRoles: string[]
  isActive: boolean
}

export interface LeaveBalance {
  publicId: string | null
  leaveType: LeaveType
  name: string
  year: number
  allocated: number
  carriedForward: number
  adjustment: number
  total: number
  used: number
  pending: number
  remaining: number
}

export interface AllBalances {
  year: number
  policies: { publicId: string; leaveType: LeaveType; name: string }[]
  users: {
    user: { publicId: string; name: string; email?: string; role?: string; userCode?: string }
    balances: LeaveBalance[]
  }[]
}

const LIST = { type: 'Leave' as const, id: 'LIST' }
const BALANCES = { type: 'LeaveBalance' as const, id: 'LIST' }
const POLICIES = { type: 'LeavePolicy' as const, id: 'LIST' }

export const leavesApi = createApi({
  reducerPath: 'leavesApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Leave', 'LeaveBalance', 'LeavePolicy'],
  endpoints: (builder) => ({
    getLeaves: builder.query<Leave[], { status?: string; type?: string; userId?: string } | void>({
      query: (params) => ({
        url: '/leaves',
        params: params
          ? {
              status: params.status || undefined,
              type: params.type || undefined,
              userId: params.userId || undefined,
            }
          : undefined,
      }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as Leave[],
      providesTags: [LIST],
    }),
    applyLeave: builder.mutation<
      Leave,
      { type: LeaveType; startDate: string; endDate: string; reason: string; duration?: string }
    >({
      query: (payload) => ({ url: '/leaves', method: 'POST', body: payload }),
      invalidatesTags: [LIST, BALANCES],
    }),
    updateLeaveStatus: builder.mutation<
      Leave,
      { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }
    >({
      query: ({ id, ...payload }) => ({ url: `/leaves/${id}/status`, method: 'PUT', body: payload }),
      invalidatesTags: [LIST, BALANCES],
    }),
    cancelLeave: builder.mutation<Leave, string>({
      query: (id) => ({ url: `/leaves/${id}/cancel`, method: 'PUT' }),
      invalidatesTags: [LIST, BALANCES],
    }),

    getLeavePolicies: builder.query<LeavePolicy[], void>({
      query: () => ({ url: '/leaves/policies' }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as LeavePolicy[],
      providesTags: [POLICIES],
    }),
    createLeavePolicy: builder.mutation<LeavePolicy, Partial<LeavePolicy>>({
      query: (body) => ({ url: '/leaves/policies', method: 'POST', body }),
      invalidatesTags: [POLICIES, BALANCES],
    }),
    updateLeavePolicy: builder.mutation<LeavePolicy, { id: string; payload: Partial<LeavePolicy> }>({
      query: ({ id, payload }) => ({ url: `/leaves/policies/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [POLICIES, BALANCES],
    }),
    deleteLeavePolicy: builder.mutation<void, string>({
      query: (id) => ({ url: `/leaves/policies/${id}`, method: 'DELETE' }),
      invalidatesTags: [POLICIES, BALANCES],
    }),

    getMyLeaveBalances: builder.query<{ year: number; balances: LeaveBalance[] }, { year?: number; userId?: string } | void>({
      query: (params) => ({
        url: '/leaves/balances',
        params: params ? { year: params.year || undefined, userId: params.userId || undefined } : undefined,
      }),
      transformResponse: (res: { data?: unknown }) =>
        (res?.data ?? { year: new Date().getFullYear(), balances: [] }) as { year: number; balances: LeaveBalance[] },
      providesTags: [BALANCES],
    }),
    getAllLeaveBalances: builder.query<AllBalances, { year?: number } | void>({
      query: (params) => ({ url: '/leaves/balances/all', params: params ? { year: params.year || undefined } : undefined }),
      transformResponse: (res: { data?: unknown }) => res?.data as AllBalances,
      providesTags: [BALANCES],
    }),
    adjustLeaveBalance: builder.mutation<LeaveBalance, { userId: string; year: number; leaveType: string; adjustment: number }>({
      query: ({ userId, ...body }) => ({ url: `/leaves/balances/${userId}/adjust`, method: 'PUT', body }),
      invalidatesTags: [BALANCES],
    }),
  }),
})

export const {
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useCancelLeaveMutation,
  useGetLeavePoliciesQuery,
  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
  useDeleteLeavePolicyMutation,
  useGetMyLeaveBalancesQuery,
  useGetAllLeaveBalancesQuery,
  useAdjustLeaveBalanceMutation,
} = leavesApi
