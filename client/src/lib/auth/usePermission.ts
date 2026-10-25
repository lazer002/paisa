import { useCallback, useMemo } from 'react'

import { useAppSelector } from '@/app/store'
import {
  permissionsForRole,
  roleCan,
  roleCanAll,
  roleCanAny,
  type Permission,
} from '@/config/permissions'

export interface PermissionGate {
  /** Current user's role (null when signed out). */
  role: string | null
  /** Everything the current role is granted. */
  permissions: readonly Permission[]
  /** Single permission check. */
  can: (permission: Permission) => boolean
  /** True when the role holds ANY of the permissions. */
  canAny: (...permissions: Permission[]) => boolean
  /** True when the role holds ALL of the permissions. */
  canAll: (...permissions: Permission[]) => boolean
}

/**
 * Role/permission checks for the signed-in user.
 *
 * The matrix mirrors the server (see config/permissions.ts), so UI decisions
 * here match what the API will actually allow.
 */
export function usePermission(): PermissionGate {
  const role = useAppSelector((s) => s.auth.user?.role ?? null)

  const permissions = useMemo(
    () => permissionsForRole(role),
    [role],
  )

  const can = useCallback(
    (permission: Permission) => roleCan(role, permission),
    [role],
  )

  const canAny = useCallback(
    (...permissions: Permission[]) => roleCanAny(role, permissions),
    [role],
  )

  const canAll = useCallback(
    (...permissions: Permission[]) => roleCanAll(role, permissions),
    [role],
  )

  return { role, permissions, can, canAny, canAll }
}

export default usePermission
