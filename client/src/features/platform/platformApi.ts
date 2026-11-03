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
  createdBy?: Ref | string | null
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
  createdBy?: Ref | string | null
  createdAt: string
}

export interface Pipeline {
  _id: string
  publicId?: string
  name: string
  type?: string
  status: string
  stages?: { _id?: string; name: string; key?: string; order?: number; type?: string }[]
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
  firstResponseAt?: string | null
  /** Set when this ticket was merged into another one. */
  parentTicketId?: string | null
  /** Computed by the server from priority (see TICKET_SLA_HOURS in ticketController). */
  slaState?: TicketSlaState
  createdAt: string
}

export interface TicketSlaState {
  hours: number
  dueAt: string
  responseDueAt: string
  firstResponseAt?: string | null
  overdue: boolean
  responseOverdue: boolean
  stopped: boolean
}

export interface TicketTemplate {
  _id: string
  publicId?: string
  name: string
  body: string
  createdAt?: string
  updatedAt?: string
}

export interface TicketAssignee {
  _id: string
  publicId?: string
  name: string
  email?: string
  role: string
}

export interface TicketMessageT {
  _id: string
  publicId?: string
  body: string
  /** "internal_note" = staff-only; the server never sends these to requesters. */
  type?: string
  isInternal?: boolean
  authorId?: Ref | string
  createdAt: string
}

export interface SalaryComponent {
  code: string
  name: string
  type: string
  category?: string
  calculationType?: string
  amount?: number
  percentage?: number | null
  percentageBase?: string | null
  formula?: string | null
  perUnitAmount?: number | null
  proratable?: boolean
  [key: string]: unknown
}

export interface SalaryStructure {
  _id: string
  publicId?: string
  name: string
  type: string
  baseSalary: number
  components?: SalaryComponent[]
  payFrequency?: string
  status: string
  createdAt: string
}

export interface PerformanceReview {
  _id: string
  publicId?: string
  employeeId?: Ref | string | null
  title: string
  description?: string | null
  type?: string
  status: string
  overallRating?: number | null
  maxRating?: number | null
  dueDate?: string | null
  dueAt?: string | null
  goals?: ReviewGoal[]
  goalScore?: number | null
  strengths?: string[]
  areasForImprovement?: string[]
  outcome?: string | null
  outcomeComments?: string | null
  performanceImprovementPlan?: ImprovementPlan | null
  createdAt: string
}

export interface ReviewGoal {
  title: string
  description?: string | null
  dueDate?: string | null
  status?: string
  progress?: number
  weight?: number
  targetValue?: number | null
  actualValue?: number | null
  unit?: string | null
}

export interface ImprovementPlan {
  enabled?: boolean
  startDate?: string | null
  endDate?: string | null
  reviewFrequency?: string | null
  status?: 'planned' | 'active' | 'completed' | 'failed' | 'cancelled'
  outcome?: string | null
  objectives?: { title: string; description?: string | null; targetDate?: string | null; status?: string; progress?: number }[]
}

export interface Certificate {
  _id: string
  publicId?: string
  userId?: Ref | string | null
  title: string
  description?: string | null
  type?: string
  status: string
  certificateNumber?: string | null
  issueDate?: string | null
  validUntil?: string | null
  revokedAt?: string | null
  recipientSnapshot?: { name?: string | null }
  issuer?: { name?: string | null; organizationName?: string | null }
  verification?: { status?: string; verificationCode?: string | null; verificationUrl?: string | null }
  /** Design copied from a template when the certificate was issued. */
  template?: { templateId?: string | null; name?: string | null; configuration?: CertificateDesign | null }
  createdAt: string
}

export interface CertificateDesign {
  heading?: string | null
  intro?: string | null
  awardLine?: string | null
  footerNote?: string | null
  signatoryName?: string | null
  signatoryTitle?: string | null
  accentColor?: string | null
  style?: 'classic' | 'modern'
}

export interface CertificateTemplate extends CertificateDesign {
  _id: string
  publicId: string
  name: string
  isDefault: boolean
}

export type CertificateTemplateInput = Partial<Omit<CertificateTemplate, '_id' | 'publicId'>> & { name: string }

/** GET /public/certificates/:code — minimal, unauthenticated. */
export interface CertificateVerification {
  code: string
  status: 'valid' | 'revoked' | 'expired' | 'invalid'
  valid: boolean
  holderName: string | null
  title: string
  type: string | null
  organizationName: string | null
  certificateNumber: string | null
  issueDate: string | null
  validUntil: string | null
  revokedAt: string | null
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
  createdBy?: Ref | string | null
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
  role?: string
  points: number
}

export type LeaderboardPeriod = 'week' | 'month' | 'all'

export interface Leaderboard {
  rows: LeaderRow[]
  /** The caller's own row, also when outside the top rows; null without points. */
  me: LeaderRow | null
}

export interface GamificationSummary {
  points: number
  rank: number | null
  pointsThisWeek: number
  streak: { current: number; longest: number; lastActiveDay: string | null }
  achievements: number
  pointRules: Record<string, number>
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
    'SalaryStructure', 'Review', 'Certificate', 'Achievement', 'Points', 'Event', 'TicketTemplate',
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
    checkLeadDuplicates: builder.query<Lead[], Record<string, string | undefined>>({
      query: (params) => ({ url: '/leads/duplicates', params }),
      transformResponse: list,
    }),
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
    updatePipeline: builder.mutation<Pipeline, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/pipelines/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Pipeline', id: 'LIST' }],
    }),
    deletePipeline: builder.mutation<void, string>({
      query: (id) => ({ url: `/pipelines/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Pipeline', id: 'LIST' }],
    }),

    // ── Tickets ──
    getTickets: builder.query<SupportTicket[], { status?: string; search?: string; overdue?: boolean } | void>({
      query: (params) => ({
        url: '/tickets',
        params: params
          ? { status: params.status || undefined, search: params.search || undefined, overdue: params.overdue ? 'true' : undefined }
          : undefined,
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
    // Folds ticket `id` into `into` (same requester only; staff).
    mergeTicket: builder.mutation<{ mergedFrom: string; movedMessages: number }, { id: string; into: string }>({
      query: ({ id, into }) => ({ url: `/tickets/${id}/merge`, method: 'POST', body: { into } }),
      invalidatesTags: (r, e, { id, into }) => [{ type: 'Ticket', id }, { type: 'Ticket', id: into }, { type: 'Ticket', id: 'LIST' }],
    }),
    // Staff of the ticket's organization who can be assigned (staff only).
    getTicketAssignees: builder.query<TicketAssignee[], string>({
      query: (id) => `/tickets/${id}/assignees`,
      transformResponse: list,
    }),
    // Reply templates (canned responses): staff read, admin/support manage.
    getTicketTemplates: builder.query<TicketTemplate[], void>({
      query: () => '/tickets/templates',
      transformResponse: list,
      providesTags: [{ type: 'TicketTemplate', id: 'LIST' }],
    }),
    createTicketTemplate: builder.mutation<TicketTemplate, { name: string; body: string }>({
      query: (body) => ({ url: '/tickets/templates', method: 'POST', body }),
      invalidatesTags: [{ type: 'TicketTemplate', id: 'LIST' }],
    }),
    updateTicketTemplate: builder.mutation<TicketTemplate, { id: string; name?: string; body?: string }>({
      query: ({ id, ...body }) => ({ url: `/tickets/templates/${id}`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'TicketTemplate', id: 'LIST' }],
    }),
    deleteTicketTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/tickets/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'TicketTemplate', id: 'LIST' }],
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
    // The reviewed employee confirms they have seen a finished review.
    updateReviewProgress: builder.mutation<
      PerformanceReview,
      { id: string; goals?: { index: number; progress?: number; status?: string }[]; objectives?: { index: number; progress?: number; status?: string }[] }
    >({
      query: ({ id, ...body }) => ({ url: `/reviews/${id}/progress`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),
    acknowledgeReview: builder.mutation<PerformanceReview, string>({
      query: (id) => ({ url: `/reviews/${id}/acknowledge`, method: 'POST' }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),

    // ── HR Ops: Certificates ──
    getCertificates: builder.query<Certificate[], { status?: string } | void>({
      query: (params) => ({ url: '/certificates', params: params ? { status: params.status || undefined } : undefined }),
      transformResponse: list,
      providesTags: [{ type: 'Certificate', id: 'LIST' }],
    }),
    createCertificate: builder.mutation<
      Certificate,
      { userId: string; title: string; type?: string; description?: string; issueDate?: string; validUntil?: string; templateId?: string }
    >({
      query: (body) => ({ url: '/certificates', method: 'POST', body }),
      invalidatesTags: [{ type: 'Certificate', id: 'LIST' }],
    }),
    getCertificateTemplates: builder.query<CertificateTemplate[], void>({
      query: () => '/certificates/templates',
      transformResponse: list,
      providesTags: [{ type: 'Certificate', id: 'TEMPLATES' }],
    }),
    saveCertificateTemplate: builder.mutation<CertificateTemplate, { id?: string; payload: CertificateTemplateInput }>({
      query: ({ id, payload }) =>
        id
          ? { url: `/certificates/templates/${id}`, method: 'PUT', body: payload }
          : { url: '/certificates/templates', method: 'POST', body: payload },
      invalidatesTags: [{ type: 'Certificate', id: 'TEMPLATES' }],
    }),
    deleteCertificateTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/certificates/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Certificate', id: 'TEMPLATES' }],
    }),
    // Unauthenticated public lookup (also used by the /verify page while signed out).
    verifyCertificate: builder.query<CertificateVerification, string>({
      query: (code) => `/public/certificates/${encodeURIComponent(code)}`,
      transformResponse: unwrap<CertificateVerification>,
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
    updateAchievement: builder.mutation<Achievement, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/gamification/achievements/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Achievement', id: 'LIST' }, { type: 'Achievement', id: 'AWARDS' }],
    }),
    deleteAchievement: builder.mutation<void, string>({
      query: (id) => ({ url: `/gamification/achievements/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Achievement', id: 'LIST' }],
    }),
    awardAchievement: builder.mutation<UserAchievement, { userId: string; achievementId: string; reason?: string }>({
      query: (body) => ({ url: '/gamification/award', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Achievement', id: 'LIST' }, { type: 'Achievement', id: 'AWARDS' },
        { type: 'Points', id: 'LIST' }, { type: 'Points', id: 'BOARD' }, { type: 'Points', id: 'ME' },
      ],
    }),
    getUserAchievements: builder.query<UserAchievement[], void>({
      query: () => '/gamification/user-achievements',
      transformResponse: list,
      providesTags: [{ type: 'Achievement', id: 'AWARDS' }],
    }),
    awardPoints: builder.mutation<PointEntry, { userId: string; points: number; reason?: string }>({
      query: (body) => ({ url: '/gamification/points', method: 'POST', body }),
      invalidatesTags: [{ type: 'Points', id: 'LIST' }, { type: 'Points', id: 'BOARD' }, { type: 'Points', id: 'ME' }],
    }),
    getPointsLedger: builder.query<PointEntry[], void>({
      query: () => '/gamification/points',
      transformResponse: list,
      providesTags: [{ type: 'Points', id: 'LIST' }],
    }),
    getLeaderboard: builder.query<Leaderboard, { period?: LeaderboardPeriod; role?: string } | void>({
      query: (args) => ({
        url: '/gamification/leaderboard',
        params: { period: args?.period, role: args?.role || undefined },
      }),
      transformResponse: (res: { data?: LeaderRow[]; meta?: { me?: LeaderRow | null } }) => ({
        rows: res?.data ?? [],
        me: res?.meta?.me ?? null,
      }),
      providesTags: [{ type: 'Points', id: 'BOARD' }],
    }),
    getMyGamification: builder.query<GamificationSummary, void>({
      query: () => '/gamification/me',
      transformResponse: unwrap<GamificationSummary>,
      providesTags: [{ type: 'Points', id: 'ME' }],
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
  useGetLeadsQuery, useLazyCheckLeadDuplicatesQuery, useCreateLeadMutation, useUpdateLeadMutation, useDeleteLeadMutation,
  useGetDealsQuery, useCreateDealMutation, useUpdateDealStageMutation, useDeleteDealMutation,
  useGetPipelinesQuery, useCreatePipelineMutation, useUpdatePipelineMutation, useDeletePipelineMutation,
  useGetTicketsQuery, useGetTicketQuery, useCreateTicketMutation, useUpdateTicketMutation, useAddTicketMessageMutation, useDeleteTicketMutation,
  useMergeTicketMutation,
  useGetTicketAssigneesQuery,
  useGetTicketTemplatesQuery, useCreateTicketTemplateMutation, useUpdateTicketTemplateMutation, useDeleteTicketTemplateMutation,
  useGetSalaryStructuresQuery, useCreateSalaryStructureMutation, useUpdateSalaryStructureMutation, useDeleteSalaryStructureMutation,
  useGetReviewsQuery, useCreateReviewMutation, useUpdateReviewMutation, useDeleteReviewMutation,
  useAcknowledgeReviewMutation,
  useUpdateReviewProgressMutation,
  useGetCertificatesQuery, useCreateCertificateMutation, useRevokeCertificateMutation, useDeleteCertificateMutation,
  useGetCertificateTemplatesQuery, useSaveCertificateTemplateMutation, useDeleteCertificateTemplateMutation,
  useVerifyCertificateQuery, useLazyVerifyCertificateQuery,
  useGetAchievementsQuery, useCreateAchievementMutation, useUpdateAchievementMutation, useDeleteAchievementMutation,
  useAwardAchievementMutation, useGetUserAchievementsQuery,
  useAwardPointsMutation, useGetPointsLedgerQuery, useGetLeaderboardQuery, useGetMyGamificationQuery,
  useGetEventsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
} = platformApi
