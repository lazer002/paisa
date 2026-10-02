// src/features/users/usersApi.ts

import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/api/axiosBaseQuery'
import type { Role } from '@/config/roles'

/* =========================================================
   TYPES
========================================================= */

export interface OrgUser {
  _id: string
  publicId?: string

  name: string
  displayName?: string | null
  email: string

  role: Role
  userCode?: string

  status: 'active' | 'inactive' | 'suspended'

  instituteId?: {
    _id: string
    name: string
    type: string
    orgCode?: string
    status?: string
    plan?: string
  } | string | null

  profile?: {
    phone?: string | null
    alternatePhone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    pincode?: string | null
    avatarUrl?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    bloodGroup?: string | null
    bio?: string | null

    socialLinks?: {
      linkedin?: string | null
      github?: string | null
      twitter?: string | null
      website?: string | null
    }
  }

  employment?: {
    employeeId?: string | null
      department?:
    | string
    | {
        _id: string
        name: string
        code?: string
      }
    | null
    designation?: string | null
   reportingManager?: string | ReportingManager | null
    workLocation?: string | null
    workEmail?: string | null
    dateOfJoining?: string | null
    dateOfExit?: string | null
    probationEndDate?: string | null
    skills?: string[]
    employmentHistory?: unknown[]
    documents?: unknown[]
  }

  academic?: {
    rollNumber?: string | null
    grade?: string | null
    section?: string | null
    guardianName?: string | null
    guardianPhone?: string | null
    admissionDate?: string | null

    course?: string | null
    enrollmentNumber?: string | null
  }

  compensation?: {
    bank?: {
      accountName?: string | null
      accountNumber?: string | null
      bankName?: string | null
      ifsc?: string | null
      branch?: string | null
    }

    statutory?: {
      pan?: string | null
      aadhaarLast4?: string | null
      uan?: string | null
      esic?: string | null
    }

    ctc?: number | null
    basicMonthly?: number | null
  }

  preferences?: {
    notifications?: {
      email?: boolean
      push?: boolean
      announcements?: boolean
      payroll?: boolean
    }

    language?: string
    timezone?: string
    theme?: string
  }

  mustChangePassword?: boolean
  passwordChangedAt?: string | null

  emailVerified?: boolean
  emailVerifiedAt?: string | null

  lastLogin?: string | null
  lastLoginIp?: string | null
  lastActiveAt?: string | null

  failedAttempts?: number
  lockedUntil?: string | null

  twoFactorEnabled?: boolean

  createdAt?: string
  updatedAt?: string

  createdBy?: string
  updatedBy?: string | null
}

/* =========================================================
   CREATE USER
========================================================= */

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: Role
  instituteId?: string

  profile?: {
    phone?: string
    alternatePhone?: string
    address?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  }

  teacher?: Record<string, unknown>
  student?: Record<string, unknown>
  employee?: Record<string, unknown>
  hr?: Record<string, unknown>
}

/* =========================================================
   UPDATE USER
========================================================= */
export interface ReportingManager {
  _id: string
  publicId?: string
  name: string
  displayName?: string
  email?: string
  role?: Role
}

export interface UpdateUserPayload {
  name?: string
  displayName?: string
  email?: string
  role?: Role
  status?: 'active' | 'inactive' | 'suspended'
  password?: string

  profile?: {
    phone?: string
    alternatePhone?: string
    address?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
    avatarUrl?: string
    dateOfBirth?: string
    gender?: string
    bloodGroup?: string
    bio?: string
    socialLinks?: {
      linkedin?: string
      github?: string
      twitter?: string
      website?: string
    }
  }


employment?: {
  department?:
    | string
    | {
        _id: string
        name: string
        code?: string
      }
    | null
  designation?: string | null
  reportingManager?: string | null
  workLocation?: string | null
  workEmail?: string | null
  dateOfJoining?: string | null
  dateOfExit?: string | null
  probationEndDate?: string | null
  skills?: string[]
}

  academic?: {
    rollNumber?: string
    grade?: string
    section?: string
    guardianName?: string
    guardianPhone?: string
    admissionDate?: string
    course?: string
    enrollmentNumber?: string
  }

  compensation?: {
    bank?: {
      accountName?: string
      accountNumber?: string
      bankName?: string
      ifsc?: string
      branch?: string
    }
    statutory?: {
      pan?: string
      aadhaarLast4?: string
      uan?: string
      esic?: string
    }
    ctc?: number
    basicMonthly?: number
  }

  preferences?: {
    notifications?: {
      email?: boolean
      push?: boolean
      announcements?: boolean
      payroll?: boolean
    }
    language?: string
    timezone?: string
    theme?: string
  }
}

/* =========================================================
   USER DETAIL
========================================================= */

export interface UserActivity {
  leaves: any[]
  payrolls: any[]

  attendancePercent: number | null

  recentAttendance: any[]

  teachingClasses: any[]

  enrolledClasses: any[]

  studentProfile: any
}

export interface UserDetailResponse {
  user: OrgUser

  permissions: string[]

  activity: UserActivity
}

/* =========================================================
   RESOURCE ID
========================================================= */

export const rid = (
  record: {
    publicId?: string
    _id: string
  }
): string => {
  return record.publicId ?? record._id
}

/* =========================================================
   API
========================================================= */

export const usersApi = createApi({
  reducerPath: 'usersApi',

  baseQuery: axiosBaseQuery,

  tagTypes: ['User', 'UserDetail'],

  endpoints: (builder) => ({
    /* =====================================================
       GET USERS
    ===================================================== */

    getUsers: builder.query<
      OrgUser[],
      {
        role?: string
        search?: string
        status?: string
        instituteId?: string
      } | void
    >({
      query: (params) => ({
        url: '/users',

        method: 'GET',

        params: params
          ? {
              role: params.role || undefined,
              search: params.search || undefined,
              status: params.status || undefined,
              instituteId: params.instituteId || undefined,
            }
          : undefined,
      }),

      transformResponse: (res: any) => {
        return res?.data ?? res ?? []
      },

      providesTags: (result) => {
        if (!result) {
          return [
            {
              type: 'User' as const,
              id: 'LIST',
            },
          ]
        }

        return [
          ...result.map((user) => ({
            type: 'User' as const,
            id: rid(user),
          })),

          {
            type: 'User' as const,
            id: 'LIST',
          },
        ]
      },
    }),

    /* =====================================================
       GET SINGLE USER
    ===================================================== */

    getUserById: builder.query<OrgUser, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),

      transformResponse: (res: any) => {
        return res?.data ?? res
      },

      providesTags: (result, error, id) => [
        {
          type: 'User',
          id,
        },
      ],
    }),

    /* =====================================================
       GET USER DETAIL
    ===================================================== */

    getUserDetail: builder.query<
      UserDetailResponse,
      string
    >({
      query: (id) => ({
        url: `/users/${id}/detail`,
        method: 'GET',
      }),

      transformResponse: (res: any) => {
        return res?.data ?? res
      },

      providesTags: (result, error, id) => [
        {
          type: 'UserDetail',
          id,
        },

        {
          type: 'User',
          id,
        },
      ],
    }),

    /* =====================================================
       CREATE USER
    ===================================================== */

    createUser: builder.mutation<
      OrgUser,
      CreateUserPayload
    >({
      query: (payload) => ({
        url: '/users',
        method: 'POST',
        body: payload,
      }),

      transformResponse: (res: any) => {
        return res?.data ?? res
      },

      invalidatesTags: [
        {
          type: 'User',
          id: 'LIST',
        },
      ],
    }),

    /* =====================================================
       UPDATE USER
    ===================================================== */

    updateUser: builder.mutation<
      OrgUser,
      {
        id: string
        payload: UpdateUserPayload
      }
    >({
      query: ({ id, payload }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: payload,
      }),

      transformResponse: (res: any) => {
        return res?.data ?? res
      },

      invalidatesTags: (result, error, { id }) => [
        {
          type: 'User',
          id,
        },

        {
          type: 'UserDetail',
          id,
        },

        {
          type: 'User',
          id: 'LIST',
        },
      ],
    }),

    /* =====================================================
       DELETE USER
    ===================================================== */

    deleteUser: builder.mutation<
      any,
      string
    >({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),

      transformResponse: (res: any) => {
        return res?.data ?? res
      },

      invalidatesTags: (result, error, id) => [
        {
          type: 'User',
          id,
        },

        {
          type: 'UserDetail',
          id,
        },

        {
          type: 'User',
          id: 'LIST',
        },
      ],
    }),

getReportingManagers: builder.query<
  OrgUser[],
  { instituteId?: string } | void
>({
  query: (params) => ({
    url: '/users',
    params: {
      role: 'admin,super_admin',
      status: 'active',
      instituteId: params?.instituteId || undefined,
    },
  }),

  transformResponse: (res: any) =>
    res?.data ?? res ?? [],

  providesTags: [{ type: 'User', id: 'REPORTING_MANAGERS' }],
}),

  }),
  
})





/* =========================================================
   HOOKS
========================================================= */

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserDetailQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetReportingManagersQuery,
} = usersApi