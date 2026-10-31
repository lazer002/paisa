import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

/** Contacts and customers share one shape on the wire (see PartyRecord). */
export interface PartyRecord {
  _id: string
  publicId?: string
  type?: string
  status?: string
  createdAt?: string
  // contact
  fullName?: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
  // customer
  displayName?: string
  communication?: { primaryEmail?: string | null; primaryPhone?: string | null }
}

export type PartyKind = 'contacts' | 'customers'

export interface PartyPayload {
  firstName?: string
  lastName?: string
  /** Whole-name edit: contacts store fullName, customers displayName. */
  fullName?: string
  displayName?: string
  email?: string
  phone?: string
  type?: string
  status?: string
}

export interface EmployeeDocument {
  _id: string
  publicId?: string
  title: string
  type?: string
  status?: string
  documentNumber?: string | null
  expiryDate?: string | null
  employeeUserId?: { _id: string; publicId?: string; name?: string; email?: string } | string | null
  versions?: { fileName: string; fileUrl: string }[]
  createdAt: string
}

// ─── Activities / tasks / notes ──────────────────────────────────────────────

export interface CrmUserRef { _id: string; publicId?: string; name?: string; email?: string }
export interface CrmParentRef {
  _id: string
  publicId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  companyName?: string
  title?: string
  displayName?: string
}

/** Lead / deal / contact / customer the record hangs off (publicIds on the wire). */
export interface CrmParentFilter {
  leadId?: string
  dealId?: string
  contactId?: string
  customerId?: string
}

interface CrmLinked {
  _id: string
  publicId?: string
  leadId?: CrmParentRef | null
  dealId?: CrmParentRef | null
  contactId?: CrmParentRef | null
  customerId?: CrmParentRef | null
  ownerId?: CrmUserRef | null
  createdBy?: CrmUserRef | null
  completedBy?: CrmUserRef | null
  createdAt: string
  updatedAt?: string
}

/** Activity or note (notes are activities with type "note"). */
export interface CrmActivity extends CrmLinked {
  type: string
  status?: string
  priority?: string
  subject: string
  description?: string | null
  outcome?: string | null
  channel?: string | null
  scheduledAt?: string | null
  completedAt?: string | null
  dueAt?: string | null
  durationMinutes?: number | null
}

export interface CrmTask extends CrmLinked {
  title: string
  description?: string | null
  type?: string
  status: string
  priority?: string
  startAt?: string | null
  dueAt?: string | null
  completedAt?: string | null
  isOverdue?: boolean
}

export interface CrmActivityPayload extends CrmParentFilter {
  type?: string
  status?: string
  priority?: string
  subject?: string
  description?: string
  outcome?: string
  channel?: string
  scheduledAt?: string
  completedAt?: string
  durationMinutes?: number
}

export interface CrmTaskPayload extends CrmParentFilter {
  title?: string
  description?: string
  type?: string
  status?: string
  priority?: string
  dueAt?: string | null
  /** User publicId; defaults to the caller on create. */
  assignee?: string
}

export interface CrmTaskFilter extends CrmParentFilter {
  mine?: boolean
  overdue?: boolean
  status?: string
  assignee?: string
}

export interface CrmNotePayload extends CrmParentFilter {
  body?: string
  title?: string
}

const cleanParams = (params: object | void) =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== '' && v !== false),
  )

const list = <T,>(res: { data?: unknown }) => (res?.data ?? []) as T[]

export const crmApi = createApi({
  reducerPath: 'crmApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Contact', 'Customer', 'EmployeeDocument', 'CrmActivity', 'CrmTask', 'CrmNote'],
  endpoints: (builder) => ({
    getCrmActivities: builder.query<CrmActivity[], (CrmParentFilter & { type?: string; mine?: boolean }) | void>({
      query: (params) => ({ url: '/crm-activities', params: cleanParams(params) }),
      transformResponse: list<CrmActivity>,
      providesTags: ['CrmActivity'],
    }),
    createCrmActivity: builder.mutation<CrmActivity, CrmActivityPayload>({
      query: (body) => ({ url: '/crm-activities', method: 'POST', body }),
      invalidatesTags: ['CrmActivity'],
    }),
    updateCrmActivity: builder.mutation<CrmActivity, { id: string; changes: CrmActivityPayload }>({
      query: ({ id, changes }) => ({ url: `/crm-activities/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: ['CrmActivity'],
    }),
    deleteCrmActivity: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm-activities/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmActivity'],
    }),

    getCrmTasks: builder.query<CrmTask[], CrmTaskFilter | void>({
      query: (params) => ({ url: '/crm-tasks', params: cleanParams(params) }),
      transformResponse: list<CrmTask>,
      providesTags: ['CrmTask'],
    }),
    createCrmTask: builder.mutation<CrmTask, CrmTaskPayload>({
      query: (body) => ({ url: '/crm-tasks', method: 'POST', body }),
      invalidatesTags: ['CrmTask'],
    }),
    updateCrmTask: builder.mutation<CrmTask, { id: string; changes: CrmTaskPayload }>({
      query: ({ id, changes }) => ({ url: `/crm-tasks/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: ['CrmTask'],
    }),
    completeCrmTask: builder.mutation<CrmTask, { id: string; completed: boolean }>({
      query: ({ id, completed }) => ({ url: `/crm-tasks/${id}/complete`, method: 'PATCH', body: { completed } }),
      invalidatesTags: ['CrmTask'],
    }),
    deleteCrmTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm-tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmTask'],
    }),

    getCrmNotes: builder.query<CrmActivity[], CrmParentFilter | void>({
      query: (params) => ({ url: '/crm-notes', params: cleanParams(params) }),
      transformResponse: list<CrmActivity>,
      providesTags: ['CrmNote'],
    }),
    createCrmNote: builder.mutation<CrmActivity, CrmNotePayload>({
      query: (body) => ({ url: '/crm-notes', method: 'POST', body }),
      invalidatesTags: ['CrmNote'],
    }),
    updateCrmNote: builder.mutation<CrmActivity, { id: string; changes: CrmNotePayload }>({
      query: ({ id, changes }) => ({ url: `/crm-notes/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: ['CrmNote'],
    }),
    deleteCrmNote: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm-notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmNote'],
    }),

    getContacts: builder.query<PartyRecord[], void>({
      query: () => ({ url: '/contacts' }),
      transformResponse: list<PartyRecord>,
      providesTags: ['Contact'],
    }),
    createContact: builder.mutation<PartyRecord, PartyPayload>({
      query: (body) => ({ url: '/contacts', method: 'POST', body }),
      invalidatesTags: ['Contact'],
    }),
    updateContact: builder.mutation<PartyRecord, { id: string; changes: PartyPayload }>({
      query: ({ id, changes }) => ({ url: `/contacts/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: ['Contact'],
    }),
    deleteContact: builder.mutation<void, string>({
      query: (id) => ({ url: `/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contact'],
    }),

    getCustomers: builder.query<PartyRecord[], void>({
      query: () => ({ url: '/customers' }),
      transformResponse: list<PartyRecord>,
      providesTags: ['Customer'],
    }),
    createCustomer: builder.mutation<PartyRecord, PartyPayload>({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<PartyRecord, { id: string; changes: PartyPayload }>({
      query: ({ id, changes }) => ({ url: `/customers/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),

    getEmployeeDocuments: builder.query<EmployeeDocument[], void>({
      query: () => ({ url: '/employee-documents' }),
      transformResponse: list<EmployeeDocument>,
      providesTags: ['EmployeeDocument'],
    }),
    createEmployeeDocument: builder.mutation<EmployeeDocument, Record<string, unknown>>({
      query: (body) => ({ url: '/employee-documents', method: 'POST', body }),
      invalidatesTags: ['EmployeeDocument'],
    }),
    updateEmployeeDocument: builder.mutation<EmployeeDocument, { id: string; changes: Record<string, unknown> }>({
      query: ({ id, changes }) => ({ url: `/employee-documents/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: ['EmployeeDocument'],
    }),
    deleteEmployeeDocument: builder.mutation<void, string>({
      query: (id) => ({ url: `/employee-documents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['EmployeeDocument'],
    }),
  }),
})

export const {
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetEmployeeDocumentsQuery,
  useCreateEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
  useDeleteEmployeeDocumentMutation,
  useGetCrmActivitiesQuery,
  useCreateCrmActivityMutation,
  useUpdateCrmActivityMutation,
  useDeleteCrmActivityMutation,
  useGetCrmTasksQuery,
  useCreateCrmTaskMutation,
  useUpdateCrmTaskMutation,
  useCompleteCrmTaskMutation,
  useDeleteCrmTaskMutation,
  useGetCrmNotesQuery,
  useCreateCrmNoteMutation,
  useUpdateCrmNoteMutation,
  useDeleteCrmNoteMutation,
} = crmApi
