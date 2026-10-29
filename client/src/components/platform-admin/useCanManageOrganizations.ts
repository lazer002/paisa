import { usePermission } from '@/lib/auth/usePermission'

/**
 * Server gate for POST and DELETE /organizations is `superAdminOnly`
 * (role super_admin AND `organization:manage`). Mirror both — admin also
 * holds `organization:manage`, so the permission alone is not enough.
 */
export function useCanManageOrganizations(): boolean {
  const { role, can } = usePermission()
  return role === 'super_admin' && can('organization:manage')
}
