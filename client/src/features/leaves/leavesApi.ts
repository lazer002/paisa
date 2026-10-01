import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid' | 'other'

export interface Leave {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  instituteId?: string | null
  userId:
    | { _id: string; publicId?: string; name: string; email: string; userCode?: string; role?: string }
    | string
  type: LeaveType
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

export const leavesApi = createApi({
  reducerPath: 'leavesApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Leave'],
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
      transformResponse: (res: any) => res?.data ?? [],
      providesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
    applyLeave: builder.mutation<
      Leave,
      { type: LeaveType; startDate: string; endDate: string; reason: string }
    >({
      query: (payload) => ({ url: '/leaves', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
    updateLeaveStatus: builder.mutation<
      Leave,
      { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }
    >({
      query: ({ id, ...payload }) => ({ url: `/leaves/${id}/status`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
    cancelLeave: builder.mutation<Leave, string>({
      query: (id) => ({ url: `/leaves/${id}/cancel`, method: 'PUT' }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
  }),
})

export const { useGetLeavesQuery, useApplyLeaveMutation, useUpdateLeaveStatusMutation, useCancelLeaveMutation } = leavesApi
