import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export type PayrollStatus = 'draft' | 'processed' | 'approved' | 'paid' | 'cancelled'

export interface PayrollLine {
  code: string
  name: string
  amount: number
}

export interface PayrollCalculation {
  calendarDays: number
  workingDays: number
  nonWorkingDays: number
  presentDays: number
  paidLeaveDays: number
  unpaidLeaveDays: number
  absentDays: number
  unmarkedDays: number
  assumedPresentDays: number
  lopDays: number
  paidDays: number
  perDayRate: number
  lopEnabled: boolean
  lines?: { earnings: PayrollLine[]; deductions: PayrollLine[] }
  weeklyOff: number[]
  unmarkedAsPresent: boolean
  structure?: { publicId: string; name: string }
  generatedAt?: string
}

export interface PayrollUser {
  _id?: string
  publicId?: string
  name: string
  email?: string
  userCode?: string
  role?: string
}

export interface Payroll {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  instituteId?: string | null
  employeeId: PayrollUser | string
  month: number
  year: number
  basicSalary: number
  allowances?: Record<string, number>
  deductions?: Record<string, number>
  attendanceSummary?: { workingDays: number; presentDays: number; paidLeaveDays: number; unpaidLeaveDays: number }
  grossSalary?: number
  totalDeductions?: number
  netSalary: number
  status: PayrollStatus
  source?: 'manual' | 'generated'
  calculation?: PayrollCalculation | null
  payment?: { method?: string | null; paidAt?: string | null; referenceNo?: string | null }
  isFinalized?: boolean
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

export interface PayslipData {
  payroll: Payroll
  employee: {
    publicId: string
    employeeCode?: string
    name?: string
    designation?: string | null
    department?: string | null
    joiningDate?: string | null
  } | null
  organization: { name?: string; contact?: { email?: string; phone?: string } } | null
}

export interface RunOptions {
  month: number
  year: number
  weeklyOff?: number[]
  unmarkedAsPresent?: boolean
}

export interface PayrollPreview {
  user: PayrollUser | null
  month: number
  year: number
  basicSalary: number
  allowances: Record<string, number>
  deductions: Record<string, number>
  grossSalary: number
  totalDeductions: number
  netSalary: number
  calculation: PayrollCalculation
  existing?: { publicId: string; status: PayrollStatus; source?: string; netSalary: number } | null
}

export interface GenerateSummary {
  month: number
  year: number
  created: number
  updated: number
  unchanged: number
  skipped: { user: PayrollUser | null; reason: string }[]
  results: { user: PayrollUser | null; publicId: string; netSalary: number; action: string }[]
}

export interface SalaryAssignment {
  employee: { publicId: string; employeeCode?: string; name?: string; designation?: string; status?: string }
  user: PayrollUser | null
  salaryStructure: { _id: string; publicId?: string; name: string; baseSalary?: number; type?: string; status?: string } | null
}

const optionParams = ({ weeklyOff, unmarkedAsPresent, ...rest }: RunOptions) => ({
  ...rest,
  weeklyOff: weeklyOff?.join(','),
  unmarkedAsPresent: unmarkedAsPresent ? 'true' : undefined,
})

export const payrollApi = createApi({
  reducerPath: 'payrollApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Payroll', 'SalaryAssignment'],
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
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as Payroll[],
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
    getPayslip: builder.query<PayslipData, string>({
      query: (id) => ({ url: `/payroll/${id}` }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res) as PayslipData,
    }),
    previewPayroll: builder.query<PayrollPreview, RunOptions & { userId: string }>({
      query: (params) => ({ url: '/payroll/preview', params: optionParams(params) }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res) as PayrollPreview,
    }),
    generatePayroll: builder.mutation<GenerateSummary, RunOptions>({
      query: (body) => ({ url: '/payroll/generate', method: 'POST', body }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res) as GenerateSummary,
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),
    getSalaryAssignments: builder.query<SalaryAssignment[], void>({
      query: () => ({ url: '/payroll/salary-assignments' }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as SalaryAssignment[],
      providesTags: [{ type: 'SalaryAssignment', id: 'LIST' }],
    }),
    assignSalaryStructure: builder.mutation<void, { userId: string; salaryStructureId: string | null }>({
      query: ({ userId, salaryStructureId }) => ({
        url: `/payroll/salary-assignments/${userId}`,
        method: 'PUT',
        body: { salaryStructureId },
      }),
      invalidatesTags: [{ type: 'SalaryAssignment', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetPayrollsQuery,
  useCreatePayrollMutation,
  useUpdatePayrollStatusMutation,
  useDeletePayrollMutation,
  useLazyGetPayslipQuery,
  useLazyPreviewPayrollQuery,
  useGeneratePayrollMutation,
  useGetSalaryAssignmentsQuery,
  useAssignSalaryStructureMutation,
} = payrollApi
