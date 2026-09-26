import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Payroll {
  _id: string
  instituteId?: string | null
  employeeId: { _id: string; name: string; email: string; userCode?: string } | string
  month: number
  year: number
  basicSalary: number
  allowances?: Record<string, number>
  deductions?: Record<string, number>
  netSalary: number
  status: 'draft' | 'processed' | 'paid'
  paidAt?: string | null
  processedBy?: { _id: string; name: string } | string
  remarks?: string
  createdAt: string
}

export interface PayrollPayload {
  employeeId: string
  month: number
  year: number
  basicSalary: number
  allowances?: Record<string, number>
  deductions?: Record<string, number>
  remarks?: string
}

export const payrollApi = createApi({
  reducerPath: 'payrollApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Payroll'],
  endpoints: (builder) => ({
    getPayrolls: builder.query<
      Payroll[],
      { employeeId?: string; month?: number; year?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/payroll',
        params: params
          ? {
              employeeId: params.employeeId || undefined,
              month: params.month || undefined,
              year: params.year || undefined,
              status: params.status || undefined,
            }
          : undefined,
      }),
      transformResponse: (res: any) => res?.data ?? [],
      providesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),
    createPayroll: builder.mutation<Payroll, PayrollPayload>({
      query: (payload) => ({ url: '/payroll', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),
    updatePayrollStatus: builder.mutation<Payroll, { id: string; status: 'draft' | 'processed' | 'paid' }>({
      query: ({ id, status }) => ({ url: `/payroll/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),
    deletePayroll: builder.mutation<void, string>({
      query: (id) => ({ url: `/payroll/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetPayrollsQuery,
  useCreatePayrollMutation,
  useUpdatePayrollStatusMutation,
  useDeletePayrollMutation,
} = payrollApi
