import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface Person {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  name: string
  email: string
  role: string
  userCode?: string
  status?: string
  instituteId?: { _id: string; name: string; type: string } | string | null
  createdAt?: string
  /** Employees list only: stage from the Employee profile (null = no profile yet). */
  lifecycleStage?: LifecycleStage | 'inactive' | null
  employmentStatus?: string | null
  joiningDate?: string | null
  lastWorkingDate?: string | null
  lastStageChangeAt?: string | null
}

export const LIFECYCLE_STAGES = [
  'onboarding',
  'probation',
  'active',
  'on_leave',
  'suspended',
  'notice_period',
  'exited',
] as const

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

export type ExitType = 'resigned' | 'terminated' | 'retired'

export interface ChecklistItem {
  key: string
  label: string
  phase: 'onboarding' | 'exit'
  done: boolean
  doneAt?: string | null
}

export interface StageHistoryEntry {
  id: string
  from: string | null
  to: string
  status: string | null
  at: string
  byName: string | null
  note: string | null
}

export interface EmployeeLifecycle {
  employee: { publicId: string; name: string; email: string; accountStatus?: string }
  hasProfile: boolean
  /** 'none' when the person has no Employee profile yet; 'inactive' for legacy records. */
  stage: LifecycleStage | 'none' | 'inactive'
  status: string | null
  allowedNext: LifecycleStage[]
  dates: Record<
    | 'joiningDate'
    | 'probationStartDate'
    | 'probationEndDate'
    | 'confirmationDate'
    | 'resignationDate'
    | 'lastWorkingDate'
    | 'terminationDate'
    | 'retirementDate',
    string | null
  >
  exitReason: string | null
  history: StageHistoryEntry[]
  checklist: ChecklistItem[]
}

export interface ChangeStagePayload {
  stage: LifecycleStage
  note?: string
  effectiveDate?: string
  lastWorkingDate?: string
  probationEndDate?: string
  exitType?: ExitType
  reason?: string
  /** Only for stage "exited": also deactivate the linked login account. */
  deactivateUser?: boolean
  /** Only when leaving "exited": reactivate the linked login account. */
  reactivateUser?: boolean
}

export interface CreatePersonPayload {
  name: string
  email: string
  password: string
  instituteId?: string
}

export const employeesApi = createApi({
  reducerPath: 'employeesApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Person', 'Lifecycle'] as const,
  endpoints: (builder) => ({
    getEmployeeLifecycle: builder.query<EmployeeLifecycle, string>({
      query: (publicId) => `/employees/${publicId}/lifecycle`,
      transformResponse: (res: { data?: unknown }) =>
        (res?.data ?? res) as EmployeeLifecycle,
      providesTags: (_r, _e, publicId) => [{ type: 'Lifecycle', id: publicId }],
    }),
    changeEmployeeStage: builder.mutation<
      EmployeeLifecycle,
      { publicId: string } & ChangeStagePayload
    >({
      query: ({ publicId, ...body }) => ({
        url: `/employees/${publicId}/stage`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { publicId }) => [
        { type: 'Lifecycle', id: publicId },
        { type: 'Person', id: 'EMPLOYEES' },
      ],
    }),
    updateEmployeeChecklist: builder.mutation<
      EmployeeLifecycle,
      { publicId: string; items: ChecklistItem[] }
    >({
      query: ({ publicId, items }) => ({
        url: `/employees/${publicId}/checklist`,
        method: 'PUT',
        body: { items },
      }),
      invalidatesTags: (_r, _e, { publicId }) => [{ type: 'Lifecycle', id: publicId }],
    }),
    getEmployees: builder.query<Person[], void>({
      query: () => '/employees',
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res ?? []) as Person[],
      providesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    createEmployee: builder.mutation<Person, CreatePersonPayload>({
      query: (payload) => ({ url: '/employees', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    getEmployee: builder.query<Person, string>({
      query: (publicId) => `/employees/${publicId}`,
      transformResponse: (res: { data?: unknown }) =>
        (res?.data ?? res ?? {}) as Person,
      providesTags: (_r, _e, publicId) => [{ type: 'Person', id: publicId }],
    }),
    updateEmployee: builder.mutation<
      Person,
      { publicId: string; changes: { name?: string; status?: string } }
    >({
      query: ({ publicId, changes }) => ({
        url: `/employees/${publicId}`,
        method: 'PUT',
        body: changes,
      }),
      invalidatesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
    deleteEmployee: builder.mutation<{ success: boolean }, string>({
      query: (publicId) => ({ url: `/employees/${publicId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Person', id: 'EMPLOYEES' }],
    }),
  }),
})

export const hrsApi = createApi({
  reducerPath: 'hrsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Person'] as const,
  endpoints: (builder) => ({
    getHRs: builder.query<Person[], void>({
      query: () => '/hr',
      transformResponse: (res: { data?: unknown }) => (res?.data ?? res ?? []) as Person[],
      providesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    createHR: builder.mutation<Person, CreatePersonPayload>({
      query: (payload) => ({ url: '/hr', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    updateHR: builder.mutation<
      Person,
      { publicId: string; changes: { name?: string; status?: string } }
    >({
      query: ({ publicId, changes }) => ({
        url: `/hr/${publicId}`,
        method: 'PUT',
        body: changes,
      }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
    deleteHR: builder.mutation<{ success: boolean }, string>({
      query: (publicId) => ({ url: `/hr/${publicId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Person', id: 'HRS' }],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useGetEmployeeQuery,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeeLifecycleQuery,
  useChangeEmployeeStageMutation,
  useUpdateEmployeeChecklistMutation,
} = employeesApi
export const {
  useGetHRsQuery,
  useCreateHRMutation,
  useUpdateHRMutation,
  useDeleteHRMutation,
} = hrsApi
