import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

/**
 * Assessment module: Tests, Questions, Attempts.
 * All identifiers in URLs and payloads are publicIds
 * (the server resolves them via resolveRef).
 */

export interface TestQuestion {
  _id: string
  publicId?: string
  text: string
  type: string
  difficulty: string
  status: string
  points?: number
  options?: { text: string; isCorrect?: boolean }[]
  correctAnswer?: string | null
  subject?: string | null
}

export interface SchoolTest {
  _id: string
  publicId?: string
  title: string
  description?: string | null
  instructions?: string | null
  classId?: { _id: string; publicId?: string; name: string; subject?: string } | string | null
  createdBy?: { _id: string; publicId?: string; name: string } | string
  type: string
  mode: string
  status: string
  schedule?: { startsAt?: string | null; endsAt?: string | null; durationMinutes?: number }
  grading?: { totalPoints?: number; passingScore?: number }
  questionIds?: TestQuestion[] | string[]
  createdAt: string
}

export interface TestAttempt {
  _id: string
  publicId?: string
  testId: { _id: string; publicId?: string; title: string; grading?: { totalPoints?: number } } | string
  studentId: { _id: string; publicId?: string; name: string; userCode?: string } | string
  status: string
  attemptNumber: number
  score?: { earned?: number; total?: number; percentage?: number; passed?: boolean | null }
  submittedAt?: string | null
  createdAt: string
}

const list = (res: { data?: unknown }) => (res?.data ?? []) as never

export const assessmentApi = createApi({
  reducerPath: 'assessmentApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Test', 'Question', 'Attempt'],
  endpoints: (builder) => ({
    // ── Tests ──
    getTests: builder.query<SchoolTest[], { status?: string; search?: string } | void>({
      query: (params) => ({
        url: '/tests',
        params: params ? { status: params.status || undefined, search: params.search || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Test', id: 'LIST' }],
    }),
    createTest: builder.mutation<SchoolTest, Record<string, unknown>>({
      query: (body) => ({ url: '/tests', method: 'POST', body }),
      invalidatesTags: [{ type: 'Test', id: 'LIST' }],
    }),
    updateTest: builder.mutation<SchoolTest, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/tests/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Test', id: 'LIST' }],
    }),
    deleteTest: builder.mutation<void, string>({
      query: (id) => ({ url: `/tests/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Test', id: 'LIST' }],
    }),

    // ── Questions ──
    getQuestions: builder.query<TestQuestion[], { type?: string; difficulty?: string; status?: string; search?: string } | void>({
      query: (params) => ({
        url: '/questions',
        params: params
          ? {
              type: params.type || undefined,
              difficulty: params.difficulty || undefined,
              status: params.status || undefined,
              search: params.search || undefined,
            }
          : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    createQuestion: builder.mutation<TestQuestion, Record<string, unknown>>({
      query: (body) => ({ url: '/questions', method: 'POST', body }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    updateQuestion: builder.mutation<TestQuestion, { id: string; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({ url: `/questions/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({ url: `/questions/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),

    // ── Attempts ──
    getAttempts: builder.query<TestAttempt[], { testId?: string; status?: string } | void>({
      query: (params) => ({
        url: '/attempts',
        params: params ? { testId: params.testId || undefined, status: params.status || undefined } : undefined,
      }),
      transformResponse: list,
      providesTags: [{ type: 'Attempt', id: 'LIST' }],
    }),
    startAttempt: builder.mutation<TestAttempt, string>({
      query: (testPublicId) => ({ url: `/attempts/${testPublicId}/start`, method: 'POST', body: {} }),
      invalidatesTags: [{ type: 'Attempt', id: 'LIST' }],
    }),
    submitAttempt: builder.mutation<TestAttempt, { id: string; answers: { questionId: string; answer: unknown }[] }>({
      query: ({ id, answers }) => ({ url: `/attempts/${id}/submit`, method: 'PUT', body: { answers } }),
      invalidatesTags: [{ type: 'Attempt', id: 'LIST' }],
    }),
    gradeAttempt: builder.mutation<TestAttempt, { id: string; score?: number; feedback?: string }>({
      query: ({ id, ...payload }) => ({ url: `/attempts/${id}/grade`, method: 'PUT', body: payload }),
      invalidatesTags: [{ type: 'Attempt', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetTestsQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetAttemptsQuery,
  useStartAttemptMutation,
  useSubmitAttemptMutation,
  useGradeAttemptMutation,
} = assessmentApi
