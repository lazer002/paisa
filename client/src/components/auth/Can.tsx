import type { ReactNode } from 'react'

import { usePermission } from '@/lib/auth/usePermission'
import type { Permission } from '@/config/permissions'

interface CanProps {
  /** Render children only when the role holds this permission. */
  permission?: Permission
  /** Render children when the role holds at least one of these. */
  anyOf?: readonly Permission[]
  /** Render children when the role holds every one of these. */
  allOf?: readonly Permission[]
  children: ReactNode
  /** Rendered instead of children when access is denied. */
  fallback?: ReactNode
}

/**
 * Declarative permission gate.
 *
 * ```tsx
 * <Can permission="payroll:create" fallback={null}>
 *   <Button>Process payroll</Button>
 * </Can>
 * ```
 */
export default function Can({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: CanProps) {
  const { can, canAny, canAll } = usePermission()

  const allowed = permission
    ? can(permission)
    : anyOf
      ? canAny(...anyOf)
      : allOf
        ? canAll(...allOf)
        : true

  return <>{allowed ? children : fallback}</>
}
