import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

// Consolidated RTK Query slices for the new modules:
// Enrollments, Billing, CRM, Tickets, HR Ops, Gamification, Events.
// All URL identifiers are publicIds.

const list = <T,>(res: { data?: unknown }) => (res?.data ?? []) as T[]
const unwrap = <T,>(res: { data?: unknown }) => res?.data as T

// ─── Shared shapes ───────────────────────────────────────────────────────────

export interface Ref {
  _id: string
  publicId?: string
  name?: string
  email?: string
  userCode?: string
  role?: string
}

export interface Enrollment {
  _id: string
  publicId?: string
  studentId: Ref | string
  classId?: { _id: string; publicId?: string; name: string; subject?: string } | string | null
  type: string
  status: string
  enrollmentNumber?: string | null
  createdAt: string
}

export interface Invoice {
  _id: string
  publicId?: string
  invoiceNumber?: string | null
  studentId?: Ref | string | null
  employeeId?: Ref | string | null
  status: string
  paymentStatus?: string
  subTotal?: number
  taxTotal?: number
  grandTotal?: number
  amountPaid?: number
  amountDue?: number
  dueDate?: string | null
  lineItems?: { description?: string; quantity?: number; unitPrice?: number }[]
  createdAt: string
}

export interface Lead {
  _id: string
  publicId?: string
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  contact?: { email?: string | null; phone?: string | null }
  source: string
  status: string
  priority: string
  estimatedValue?: number
  createdAt: string
}

export interface Deal {
  _id: string
  publicId?: string
  title: string
  leadId?: { _id: string; publicId?: string; firstName?: string; lastName?: string; company?: string } | string | null
  value?: number
  currency?: string
  stage: string
  status: string
  expectedCloseDate?: string | null
  createdAt: string
}

export interface Pipeline {
  _id: string
  publicId?: string
  name: string
  type?: string
  status: string
  stages?: { name: string; order?: number }[]
  createdAt: string
}

export interface SupportTicket {
  _id: string
  publicId?: string
  subject: string
  description?: string | null
  type: string
  status: string
  priority: string
  requesterId?: Ref | string
  assigneeId?: Ref | string | null
  createdAt: string
}

export interface TicketMessageT {
  _id: string
  publicId?: string
  body: string
  isInternalNote?: boolean
  authorId?: Ref | string
  createdAt: string
}

export interface SalaryStructure {
  _id: string
  publicId?: string
  name: string
  type: string
  baseSalary: number
  components?: { name?: string; amount?: number; type?: string }[]
  payFrequency?: string
  status: string
  createdAt: string
}

export interface PerformanceReview {
  _id: string
  publicId?: string
  employeeId?: Ref | string | null
  title: string
  type?: string
  status: string
  overallRating?: number | null
  dueDate?: string | null
  createdAt: string
}

export interface Certificate {
  _id: string
  publicId?: string
  userId?: Ref | string | null
  title: string
  type?: string
  status: string
  issuedAt?: string | null
  expiresAt?: string | null
  createdAt: string
}

export interface Achievement {
  _id: string
  publicId?: string
  name: string
  slug?: string | null
  shortDescription?: string | null
  rarity: string
  type: string
  points: number
  icon?: string | null
  badge?: string | null
  status: string
}

export interface UserAchievement {
  _id: string
  publicId?: string
  userId?: Ref | string
  achievementId?: { _id: string; name: string; rarity: string; points: number; icon?: string | null; badge?: string | null } | string
  status: string
  awardedAt?: string
  reason?: string | null
}

export interface PointEntry {
  _id: string
  publicId?: string
  userId?: Ref | string
  type: string
  points: number
  balanceBefore?: number
  balanceAfter?: number
  description?: string | null
  createdAt: string
}

export interface LeaderRow {
  rank: number
  userId: string
  publicId?: string
  name?: string
  userCode?: string
  points: number
}

export interface CalendarEvent {
  _id: string
  publicId?: string
  title: string
  description?: string | null
  type: string
  category?: string
  startsAt: string
  endsAt?: string | null
  location?: string | null
  status: string
  createdBy?: Ref | string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const platformApi = createApi({
  reducerPath: 'platformApi',
  baseQuery: axiosBaseQuery,
  tagTypes: [
    'Enrollment', 'Invoice', 'Lead', 'Deal', 'Pipeline', 'Ticket',
    'SalaryStructure', 'Review', 'Certificate', 'Achievement', 'Points', 'Event',
  ],
  endpoints: (builder) => ({
    // ── Enrollments ──
    getEnrollments: builder.query<Enrollment[], { status?: string; classId?: string } | void>({
      query: (params) => ({
        url: '/enrollments',
        params: params ? { status: params.status || undefined, classId: params.classId || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Enrollment', id: 'LIST' }],
    }),
    createEnrollment: builder.mutation<Enrollment, { studentId: string; classId?: string; type?: string }>({
      query: (body) => ({ url: '/enrollments', method: 'POST', body }),
      invalidatesTags: [{ type: 'Enrollment', id: 'LIST' }],
    }),
    updateEnrollmentStatus: builder.mutation<Enrollment, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/enrollments/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: [{ type: 'Enrollment', id: 'LIST' }],
    }),
    deleteEnrollment: builder.mutation<void, string>({
      query: (id) => ({ url: `/enrollments/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Enrollment', id: 'LIST' }],
    }),

    // ── Billing ──
    getInvoices: builder.query<Invoice[], { status?: string; search?: string } | void>({
      query: (params) => ({
        url: '/invoices',
        params: params ? { status: params.status || undefined, search: params.search || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    createInvoice: builder.mutation<Invoice, Record<string, unknown>>({
      query: (body) => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    recordPayment: builder.mutation<Invoice, { id: string; amount: number; method?: string; reference?: string }>({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}/payments`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    updateInvoiceStatus: builder.mutation<Invoice, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/invoices/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    deleteInvoice: builder.mutation<void, string>({
      query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),

    // ── CRM: Leads ──
    getLeads: builder.query<Lead[], { status?: string; search?: string } | void>({
      query: (params) => ({
        url: '/leads',
        params: params ? { status: params.status || undefined, search: params.search || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    createLead: builder.mutation<Lead, Record<string, unknown>>({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    updateLead: builder.mutation<Lead, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/leads/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    deleteLead: builder.mutation<void, string>({
      query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),

    // ── CRM: Deals ──
    getDeals: builder.query<Deal[], { stage?: string; status?: string } | void>({
      query: (params) => ({
        url: '/deals',
        params: params ? { stage: params.stage || undefined, status: params.status || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Deal', id: 'LIST' }],
    }),
    createDeal: builder.mutation<Deal, Record<string, unknown>>({
      query: (body) => ({ url: '/deals', method: 'POST', body }),
      invalidatesTags: [{ type: 'Deal', id: 'LIST' }],
    }),
    updateDealStage: builder.mutation<Deal, { id: string; stage?: string; status?: string }>({
      query: ({ id, ...body }) => ({ url: `/deals/${id}/stage`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'Deal', id: 'LIST' }],
    }),
    deleteDeal: builder.mutation<void, string>({
      query: (id) => ({ url: `/deals/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Deal', id: 'LIST' }],
    }),

    // ── CRM: Pipelines ──
    getPipelines: builder.query<Pipeline[], void>({
      query: () => '/pipelines',
      transformResponse: list,
      providesTags: [{ type: 'Pipeline', id: 'LIST' }],
    }),
    createPipeline: builder.mutation<Pipeline, Record<string, unknown>>({
      query: (body) => ({ url: '/pipelines', method: 'POST', body }),
      invalidatesTags: [{ type: 'Pipeline', id: 'LIST' }],
    }),
    deletePipeline: builder.mutation<void, string>({
      query: (id) => ({ url: `/pipelines/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Pipeline', id: 'LIST' }],
    }),

    // ── Tickets ──
    getTickets: builder.query<SupportTicket[], { status?: string; search?: string } | void>({
      query: (params) => ({
        url: '/tickets',
        params: params ? { status: params.status || undefined, search: params.search || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Ticket', id: 'LIST' }],
    }),
    getTicket: builder.query<{ ticket: SupportTicket; messages: TicketMessageT[] }, string>({
      query: (id) => `/tickets/${id}`,
      transformResponse: unwrap<{ ticket: SupportTicket; messages: TicketMessageT[] }>,
      providesTags: (r, e, id) => [{ type: 'Ticket', id }],
    }),
    createTicket: builder.mutation<SupportTicket, { subject: string; description?: string; type?: string; priority?: string }>({
      query: (body) => ({ url: '/tickets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Ticket', id: 'LIST' }],
    }),
    updateTicket: builder.mutation<SupportTicket, { id: string; status?: string; priority?: string; assigneeId?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/tickets/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Ticket', id }, { type: 'Ticket', id: 'LIST' }],
    }),
    addTicketMessage: builder.mutation<TicketMessageT, { id: string; body: string; isInternal?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/tickets/${id}/messages`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Ticket', id }, { type: 'Ticket', id: 'LIST' }],
    }),
    deleteTicket: builder.mutation<void, string>({
      query: (id) => ({ url: `/tickets/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Ticket', id: 'LIST' }],
    }),

    // ── HR Ops: Salary structures ──
    getSalaryStructures: builder.query<SalaryStructure[], { status?: string } | void>({
      query: (params) => ({ url: '/salary-structures', params: params ? { status: params.status || undefined } : undefined }),
      transformResponse: list,
      providesTags: [{ type: 'SalaryStructure', id: 'LIST' }],
    }),
    createSalaryStructure: builder.mutation<SalaryStructure, Record<string, unknown>>({
      query: (body) => ({ url: '/salary-structures', method: 'POST', body }),
      invalidatesTags: [{ type: 'SalaryStructure', id: 'LIST' }],
    }),
    updateSalaryStructure: builder.mutation<SalaryStructure, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/salary-structures/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'SalaryStructure', id: 'LIST' }],
    }),
    deleteSalaryStructure: builder.mutation<void, string>({
      query: (id) => ({ url: `/salary-structures/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'SalaryStructure', id: 'LIST' }],
    }),

    // ── HR Ops: Reviews ──
    getReviews: builder.query<PerformanceReview[], { status?: string } | void>({
      query: (params) => ({ url: '/reviews', params: params ? { status: params.status || undefined } : undefined }),
      transformResponse: list,
      providesTags: [{ type: 'Review', id: 'LIST' }],
    }),
    createReview: builder.mutation<PerformanceReview, Record<string, unknown>>({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),
    updateReview: builder.mutation<PerformanceReview, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/reviews/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),
    deleteReview: builder.mutation<void, string>({
      query: (id) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),

    // ── HR Ops: Certificates ──
    getCertificates: builder.query<Certificate[], { status?: string } | void>({
      query: (params) => ({ url: '/certificates', params: params ? { status: params.status || undefined } : undefined }),
      transformResponse: list,
      providesTags: [{ type: 'Certificate', id: 'LIST' }],
    }),
    createCertificate: builder.mutation<Certificate, { userId: string; title: string; type?: string }>({
      query: (body) => ({ url: '/certificates', method: 'POST', body }),
      invalidatesTags: [{ type: 'Certificate', id: 'LIST' }],
    }),
    revokeCertificate: builder.mutation<Certificate, string>({
      query: (id) => ({ url: `/certificates/${id}/revoke`, method: 'PUT', body: {} }),
      invalidatesTags: [{ type: 'Certificate', id: 'LIST' }],
    }),
    deleteCertificate: builder.mutation<void, string>({
      query: (id) => ({ url: `/certificates/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Certificate', id: 'LIST' }],
    }),

    // ── Gamification ──
    getAchievements: builder.query<Achievement[], void>({
      query: () => '/gamification/achievements',
      transformResponse: list,
      providesTags: [{ type: 'Achievement', id: 'LIST' }],
    }),
    createAchievement: builder.mutation<Achievement, Record<string, unknown>>({
      query: (body) => ({ url: '/gamification/achievements', method: 'POST', body }),
      invalidatesTags: [{ type: 'Achievement', id: 'LIST' }],
    }),
    deleteAchievement: builder.mutation<void, string>({
      query: (id) => ({ url: `/gamification/achievements/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Achievement', id: 'LIST' }],
    }),
    awardAchievement: builder.mutation<UserAchievement, { userId: string; achievementId: string; reason?: string }>({
      query: (body) => ({ url: '/gamification/award', method: 'POST', body }),
      invalidatesTags: [{ type: 'Achievement', id: 'LIST' }, { type: 'Points', id: 'LIST' }],
    }),
    getUserAchievements: builder.query<UserAchievement[], void>({
      query: () => '/gamification/user-achievements',
      transformResponse: list,
      providesTags: [{ type: 'Achievement', id: 'AWARDS' }],
    }),
    awardPoints: builder.mutation<PointEntry, { userId: string; points: number; reason?: string }>({
      query: (body) => ({ url: '/gamification/points', method: 'POST', body }),
      invalidatesTags: [{ type: 'Points', id: 'LIST' }],
    }),
    getPointsLedger: builder.query<PointEntry[], void>({
      query: () => '/gamification/points',
      transformResponse: list,
      providesTags: [{ type: 'Points', id: 'LIST' }],
    }),
    getLeaderboard: builder.query<LeaderRow[], void>({
      query: () => '/gamification/leaderboard',
      transformResponse: unwrap<LeaderRow[]>,
      providesTags: [{ type: 'Points', id: 'BOARD' }],
    }),

    // ── Events ──
    getEvents: builder.query<CalendarEvent[], void>({
      query: () => '/events',
      transformResponse: list,
      providesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    createEvent: builder.mutation<CalendarEvent, Record<string, unknown>>({
      query: (body) => ({ url: '/events', method: 'POST', body }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    updateEvent: builder.mutation<CalendarEvent, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/events/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({ url: `/events/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetEnrollmentsQuery, useCreateEnrollmentMutation, useUpdateEnrollmentStatusMutation, useDeleteEnrollmentMutation,
  useGetInvoicesQuery, useCreateInvoiceMutation, useRecordPaymentMutation, useUpdateInvoiceStatusMutation, useDeleteInvoiceMutation,
  useGetLeadsQuery, useCreateLeadMutation, useUpdateLeadMutation, useDeleteLeadMutation,
  useGetDealsQuery, useCreateDealMutation, useUpdateDealStageMutation, useDeleteDealMutation,
  useGetPipelinesQuery, useCreatePipelineMutation, useDeletePipelineMutation,
  useGetTicketsQuery, useGetTicketQuery, useCreateTicketMutation, useUpdateTicketMutation, useAddTicketMessageMutation, useDeleteTicketMutation,
  useGetSalaryStructuresQuery, useCreateSalaryStructureMutation, useUpdateSalaryStructureMutation, useDeleteSalaryStructureMutation,
  useGetReviewsQuery, useCreateReviewMutation, useUpdateReviewMutation, useDeleteReviewMutation,
  useGetCertificatesQuery, useCreateCertificateMutation, useRevokeCertificateMutation, useDeleteCertificateMutation,
  useGetAchievementsQuery, useCreateAchievementMutation, useDeleteAchievementMutation,
  useAwardAchievementMutation, useGetUserAchievementsQuery,
  useAwardPointsMutation, useGetPointsLedgerQuery, useGetLeaderboardQuery,
  useGetEventsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
} = platformApi
