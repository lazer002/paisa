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

const list = <T,>(res: { data?: unknown }) => (res?.data ?? []) as T[]

export const crmApi = createApi({
  reducerPath: 'crmApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Contact', 'Customer', 'EmployeeDocument'],
  endpoints: (builder) => ({
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
} = crmApi
