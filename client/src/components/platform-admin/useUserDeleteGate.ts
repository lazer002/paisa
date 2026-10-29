import { useCallback } from 'react'

import { useAppSelector } from '@/app/store'
import { usePermission } from '@/lib/auth/usePermission'

/** Mirror of ROLE_HIERARCHY in server/src/utils/permissions.js. */
const ROLE_LEVEL: Record<string, number> = {
  super_admin: 100,
  admin: 90,
  principal: 80,
  hr: 70,
  accountant: 70,
  counselor: 60,
  teacher: 60,
  support: 50,
  employee: 40,
  parent: 30,
  student: 20,
}

/** Server route roles for DELETE /users/:publicId (requireRole). */
const DELETE_ROLES = new Set(['super_admin', 'admin'])

export interface DeletableUser {
  _id?: string
  publicId?: string
  role?: string
  instituteId?: unknown
}

function refId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  const v = value as { _id?: unknown }
  return v._id ? String(v._id) : ''
}

/**
 * Returns `canDelete(target)` mirroring the server's DELETE /users rules:
 * - route: role super_admin or admin (+ `user:delete` in the permission matrix)
 * - never yourself
 * - non-super-admins: same organization and target role strictly lower
 *   (canManageRole), so an admin can never remove another admin.
 */
export function useUserDeleteGate() {
  const me = useAppSelector((s) => s.auth.user) as
    | { _id?: string; publicId?: string; role?: string; instituteId?: unknown }
    | null
  const { role, can } = usePermission()

  const canDelete = useCallback(
    (target: DeletableUser | null | undefined): boolean => {
      if (!me || !target || !role) return false
      if (!DELETE_ROLES.has(role) || !can('user:delete')) return false

      const isSelf =
        (!!me._id && !!target._id && String(me._id) === String(target._id)) ||
        (!!me.publicId && !!target.publicId && me.publicId === target.publicId)
      if (isSelf) return false

      if (role === 'super_admin') return true

      const myOrg = refId(me.instituteId)
      const targetOrg = refId(target.instituteId)
      if (!myOrg || myOrg !== targetOrg) return false

      const mine = ROLE_LEVEL[role] ?? 0
      const theirs = ROLE_LEVEL[target.role ?? ''] ?? 0
      return mine > 0 && theirs > 0 && mine > theirs
    },
    [me, role, can],
  )

  return { canDelete }
}
