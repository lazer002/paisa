import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'

export interface OrgUser {
  _id: string
  name: string
  email: string
  role: string
  userCode?: string
  status?: string
  instituteId?: { _id: string; name: string; type: string } | string | null
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: string
  instituteId?: string
}

export interface UpdateUserPayload {
  name?: string
  status?: 'active' | 'inactive'
  role?: string
  password?: string
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<
      OrgUser[],
      { role?: string; search?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/users',
        params: params
          ? {
              role: params.role || undefined,
              search: params.search || undefined,
              status: params.status || undefined,
            }
          : undefined,
      }),
      transformResponse: (res: any) => res?.data ?? res ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((u: OrgUser) => ({ type: 'User' as const, id: u._id })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),

    createUser: builder.mutation<OrgUser, CreateUserPayload>({
      query: (payload) => ({ url: '/users', method: 'POST', body: payload }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUser: builder.mutation<OrgUser, { id: string; payload: UpdateUserPayload }>({
      query: ({ id, payload }) => ({ url: `/users/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (r, e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
  }),
})

export const { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } = usersApi
