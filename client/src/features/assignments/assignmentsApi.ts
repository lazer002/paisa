import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

// ─── Assignments ─────────────────────────────────────────────────────────────

export interface Assignment {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  classId: { _id: string; name: string; subject?: string } | string
  createdBy?: { _id: string; name: string } | string
  title: string
  description?: string
  instructions?: string
  dueDate?: string
  maxScore?: number
  /** Criteria graded separately; with a rubric, maxScore is their total. */
  rubric?: RubricCriterion[]
  status: string
  createdAt: string
}

export interface RubricCriterion {
  criterion: string
  description?: string | null
  maxPoints: number
}

export interface RubricScore {
  criterion: string
  points: number
  maxPoints: number
  comment?: string | null
}

export const assignmentsApi = createApi({
  reducerPath: 'assignmentsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Assignment'],
  endpoints: (builder) => ({
    getAssignments: builder.query<Assignment[], { classId?: string; status?: string } | void>({
      query: (params) => ({
        url: '/assignments',
        params: params ? { classId: params.classId || undefined, status: params.status || undefined } : undefined,
      }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as Assignment[],
      providesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
    createAssignment: builder.mutation<Assignment, { classId: string; title: string; description?: string; instructions?: string; dueDate?: string; maxScore?: number; rubric?: RubricCriterion[] }>({
      query: (payload) => ({ url: '/assignments', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
    updateAssignment: builder.mutation<Assignment, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/assignments/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
    deleteAssignment: builder.mutation<void, string>({
      query: (id) => ({ url: `/assignments/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
} = assignmentsApi

// ─── Study Materials ─────────────────────────────────────────────────────────

export interface StudyMaterial {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  title: string
  description?: string
  classId?: { _id: string; publicId?: string; name: string } | string | null
  subject?: string
  type?: string
  url: string
  /** Stored file publicId when the material is an upload (url is then its download path). */
  fileId?: string | null
  visibility?: 'class_only' | 'institute' | 'public'
  uploadedBy?: { _id: string; name: string } | string
  createdAt: string
}

export const materialsApi = createApi({
  reducerPath: 'materialsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Material'],
  endpoints: (builder) => ({
    getMaterials: builder.query<StudyMaterial[], { classId?: string; type?: string } | void>({
      query: (params) => ({
        url: '/study-materials',
        params: params ? { classId: params.classId || undefined, type: params.type || undefined } : undefined,
      }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as StudyMaterial[],
      providesTags: [{ type: 'Material', id: 'LIST' }],
    }),
    createMaterial: builder.mutation<StudyMaterial, { title: string; url?: string; fileId?: string; description?: string; classId?: string; subject?: string; type?: string }>({
      query: (payload) => ({ url: '/study-materials', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Material', id: 'LIST' }],
    }),
    updateMaterial: builder.mutation<StudyMaterial, { id: string; payload: { title?: string; url?: string; fileId?: string; description?: string; classId?: string | null; subject?: string; type?: string } }>({
      query: ({ id, payload }) => ({ url: `/study-materials/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Material', id: 'LIST' }],
    }),
    deleteMaterial: builder.mutation<void, string>({
      query: (id) => ({ url: `/study-materials/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Material', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} = materialsApi

// ─── Submissions ─────────────────────────────────────────────────────────────

export interface SubmissionAttachment {
  name?: string | null
  /** External link, or /api/files/:id/download for an uploaded file. */
  url: string
  fileId?: string | null
  sizeBytes?: number
  mimeType?: string | null
}

export interface Submission {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  assignmentId:
    | { _id: string; publicId?: string; title: string; maxScore?: number; dueDate?: string }
    | string
  studentId: { _id: string; publicId?: string; name: string; email: string; userCode?: string } | string
  content?: string
  attachments?: SubmissionAttachment[]
  status: 'submitted' | 'graded'
  score?: number
  maxScore?: number
  rubricScores?: RubricScore[]
  feedback?: string
  gradedBy?: { _id: string; name: string } | string
  submittedAt?: string
  gradedAt?: string
}

export const submissionsApi = createApi({
  reducerPath: 'submissionsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Submission'],
  endpoints: (builder) => ({
    getSubmissions: builder.query<Submission[], { assignmentId?: string; status?: string } | void>({
      query: (params) => ({
        url: '/submissions',
        params: params ? { assignmentId: params.assignmentId || undefined, status: params.status || undefined } : undefined,
      }),
      transformResponse: (res: { data?: unknown }) => (res?.data ?? []) as Submission[],
      providesTags: [{ type: 'Submission', id: 'LIST' }],
    }),
    submitAssignment: builder.mutation<Submission, { assignmentId: string; content: string; attachments?: { fileId?: string; url?: string; name?: string }[] }>({
      query: (payload) => ({ url: '/submissions', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'Submission', id: 'LIST' }],
    }),
    gradeSubmission: builder.mutation<
      Submission,
      { id: string; score?: number; rubricScores?: { criterion: string; points: number; comment?: string }[]; feedback?: string }
    >({
      query: ({ id, ...payload }) => ({ url: `/submissions/${id}/grade`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Submission', id: 'LIST' }],
    }),
  }),
})

export const { useGetSubmissionsQuery, useSubmitAssignmentMutation, useGradeSubmissionMutation } = submissionsApi
